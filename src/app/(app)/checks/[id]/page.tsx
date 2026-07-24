"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { VerdictBadge, StatusPill } from "@/components/design-system/verdict-badge";
import { FindingCard } from "@/components/design-system/finding-card";
import { SQLBlock } from "@/components/design-system/sql-block";
import { LoadingCardSkeleton, ErrorState } from "@/components/design-system/states";
import { timeAgo } from "@/lib/utils";
import { ArrowLeft, ExternalLink, RotateCcw, Route, Pencil, Loader2, Play } from "lucide-react";

export default function CheckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [check, setCheck] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [sqlInput, setSqlInput] = useState("");
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overriding, setOverriding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [checkRes, reportRes] = await Promise.all([
        fetch(`/api/checks/${id}`),
        fetch(`/api/checks/${id}/risk-report`),
      ]);
      const checkData = await checkRes.json();
      const reportData = await reportRes.json();
      setCheck(checkData.check);
      setReport(reportData.report);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/checks/${id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sqlContent: sqlInput }),
      });
      if (res.ok) {
        setShowSqlModal(false);
        setSqlInput("");
        await load();
      }
    } catch { /* empty */ }
    setAnalyzing(false);
  };

  const handleOverride = async () => {
    setOverriding(true);
    await fetch(`/api/checks/${id}/override`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: overrideReason }),
    });
    setOverriding(false);
    setShowOverrideModal(false);
    await load();
  };

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 space-y-6">{[1, 2, 3].map((i) => <LoadingCardSkeleton key={i} />)}</div>;
  if (!check) return <ErrorState title="Check not found" onRetry={() => window.location.reload()} />;

  const needsAnalysis = check.status === "queued" || !check.verdict;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
      <Link href="/checks" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to checks
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            {report?.verdict && <VerdictBadge verdict={report.verdict} size="lg" />}
            <StatusPill status={check.status} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-1">{check.prTitle}</h1>
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] flex-wrap">
            <span className="font-mono text-xs">#{check.prNumber}</span>
            <span>{check.author}</span>
            <span className="font-mono text-xs">{check.branch}</span>
            <span>{timeAgo(check.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {needsAnalysis && (
            <button onClick={() => setShowSqlModal(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
              <Play className="h-4 w-4" /> Analyze migration
            </button>
          )}
          {check.prUrl && (
            <a href={check.prUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
              <ExternalLink className="h-4 w-4" /> View PR
            </a>
          )}
        </div>
      </div>

      {report?.summary && (
        <div className={`p-4 rounded-xl border ${report.verdict === "dangerous" ? "border-[#B3261E]/20 bg-[#B3261E]/5" : report.verdict === "caution" ? "border-[#C77700]/20 bg-[#C77700]/5" : "border-[#1E7A46]/20 bg-[#1E7A46]/5"}`}>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">{report.summary}</p>
        </div>
      )}

      {check.sqlContent && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">Proposed change</h2>
          <SQLBlock code={check.sqlContent} variant="diff" title="migration.sql" />
        </div>
      )}

      {report?.findings && report.findings.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">Findings ({report.findings.length})</h2>
          <div className="space-y-3">
            {report.findings.map((finding: any) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </div>
      )}

      {report?.verdict && report.verdict !== "safe" && (
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={`/checks/${id}/rollout`} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
            <Route className="h-4 w-4" /> View safe rollout plan
          </Link>
          <Link href={`/checks/${id}/rollback`} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
            <RotateCcw className="h-4 w-4" /> View rollback
          </Link>
          <button onClick={() => setShowOverrideModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[#C77700]/30 text-[#C77700] dark:text-[#F59E0B] hover:bg-[#C77700]/5 transition-colors">
            <Pencil className="h-4 w-4" /> Override &amp; approve
          </button>
        </div>
      )}

      {report?.analysisTimeMs && (
        <div className="text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border)]">
          Analysis completed in {(report.analysisTimeMs / 1000).toFixed(1)}s
        </div>
      )}

      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSqlModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Analyze migration</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Paste the SQL migration to analyze for safety issues.</p>
            <textarea value={sqlInput} onChange={(e) => setSqlInput(e.target.value)} className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)] resize-none" rows={8} placeholder={`ALTER TABLE orders\n  ADD COLUMN status VARCHAR(50) NOT NULL;`} />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowSqlModal(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors">Cancel</button>
              <button onClick={handleAnalyze} disabled={!sqlInput.trim() || analyzing} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {analyzing ? "Analyzing..." : "Run analysis"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowOverrideModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Override verdict</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">This action will be recorded in the audit log.</p>
            <textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)] resize-none" rows={3} placeholder="Explain why you're overriding this verdict..." />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowOverrideModal(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors">Cancel</button>
              <button onClick={handleOverride} disabled={!overrideReason.trim() || overriding} className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                {overriding ? "Overriding..." : "Override & approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
