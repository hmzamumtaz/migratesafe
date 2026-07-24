"use client";

import { useEffect, useState } from "react";
import { LoadingCardSkeleton } from "@/components/design-system/states";
import { formatNumber } from "@/lib/utils";
import { Users, GitBranch, Shield, AlertTriangle, Clock, TrendingUp } from "lucide-react";

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then((d) => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 space-y-6">{[1, 2, 3].map((i) => <LoadingCardSkeleton key={i} />)}</div>;
  if (!stats) return null;

  const s = stats.stats;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
          <Shield className="h-4 w-4 text-[var(--text-secondary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">Internal platform metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total accounts", value: formatNumber(s.totalAccounts), icon: <Users className="h-4 w-4" />, color: "text-brand" },
          { label: "Repos connected", value: formatNumber(s.totalRepos), icon: <GitBranch className="h-4 w-4" />, color: "text-[#1E7A46] dark:text-[#34D27B]" },
          { label: "Checks run", value: formatNumber(s.totalChecksRun), icon: <Shield className="h-4 w-4" />, color: "text-[#C77700] dark:text-[#F59E0B]" },
          { label: "Dangerous caught", value: `${s.dangerousCaughtRate}%`, icon: <AlertTriangle className="h-4 w-4" />, color: "text-[#B3261E] dark:text-[#F87171]" },
        ].map((item) => (
          <div key={item.label} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-2 mb-2">
              <span className={item.color}>{item.icon}</span>
              <span className="text-xs text-[var(--text-tertiary)]">{item.label}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-[#1E7A46] dark:text-[#34D27B]" />
            <span className="text-xs text-[var(--text-tertiary)]">Avg analysis time</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{(s.avgAnalysisTimeMs / 1000).toFixed(1)}s</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-[#B3261E] dark:text-[#F87171]" />
            <span className="text-xs text-[var(--text-tertiary)]">Total findings</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{formatNumber(s.totalFindings)}</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-[#C77700] dark:text-[#F59E0B]" />
            <span className="text-xs text-[var(--text-tertiary)]">Checks with findings</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{formatNumber(s.checksWithFindings)}</p>
        </div>
      </div>

      {stats.recentChecks && stats.recentChecks.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--border)] text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Recent checks</div>
          <div className="divide-y divide-[var(--border)]">
            {stats.recentChecks.map((check: any) => (
              <div key={check.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{check.prTitle}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">#{check.prNumber} &middot; {check.repository?.name}</p>
                </div>
                {check.verdict && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${check.verdict === "safe" ? "bg-[#1E7A46]/10 text-[#1E7A46]" : check.verdict === "caution" ? "bg-[#C77700]/10 text-[#C77700]" : "bg-[#B3261E]/10 text-[#B3261E]"}`}>
                    {check.verdict}
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${check.status === "complete" ? "bg-[#1E7A46]/10 text-[#1E7A46]" : "bg-brand/10 text-brand"}`}>
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
