"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VerdictBadge, StatusPill } from "@/components/design-system/verdict-badge";
import { LoadingTableSkeleton, EmptyState } from "@/components/design-system/states";
import { timeAgo } from "@/lib/utils";
import { Search, ArrowUpRight, Shield } from "lucide-react";

interface Check { id: string; prTitle: string; prNumber: number; branch: string; author: string; commitSha: string; verdict: string | null; status: string; findingsCount: number; createdAt: string; repositoryId: string; }

export default function ChecksPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const reposRes = await fetch("/api/repositories");
      const reposData = await reposRes.json();
      const allChecks: Check[] = [];
      for (const repo of reposData.repositories || []) {
        const res = await fetch(`/api/repositories/${repo.id}/checks`);
        const data = await res.json();
        allChecks.push(...(data.checks || []));
      }
      allChecks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setChecks(allChecks);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = checks.filter((c) => {
    if (verdictFilter !== "all" && c.verdict !== verdictFilter) return false;
    if (search && !c.prTitle.toLowerCase().includes(search.toLowerCase()) && !c.author.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Migration Checks</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">All analyzed schema changes across connected repositories.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="Search checks..." />
        </div>
        <select value={verdictFilter} onChange={(e) => setVerdictFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30">
          <option value="all">All verdicts</option>
          <option value="safe">Safe</option>
          <option value="caution">Caution</option>
          <option value="dangerous">Dangerous</option>
        </select>
      </div>

      {loading ? <LoadingTableSkeleton rows={6} /> : filtered.length === 0 ? (
        <EmptyState title="No checks found" description={checks.length === 0 ? "Connect a repository and open a PR with a migration to see your first check." : "No checks match your filters."} action={checks.length === 0 ? <Link href="/repos" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors"><Shield className="h-4 w-4" /> Connect repository</Link> : undefined} />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((check) => (
              <Link key={check.id} href={`/checks/${check.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg)] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{check.prTitle}</p>
                  <p className="text-xs text-[var(--text-tertiary)] font-mono">#{check.prNumber} &middot; {check.commitSha || check.branch}</p>
                </div>
                <span className="text-xs text-[var(--text-secondary)] hidden sm:block">{check.author}</span>
                {check.verdict ? <VerdictBadge verdict={check.verdict as "safe" | "caution" | "dangerous"} size="sm" /> : <span className="text-xs text-[var(--text-tertiary)]">—</span>}
                <StatusPill status={check.status as "queued" | "analyzing" | "complete"} />
                <span className="text-xs text-[var(--text-tertiary)] hidden sm:block">{timeAgo(check.createdAt)}</span>
                <ArrowUpRight className="h-4 w-4 text-[var(--text-tertiary)]" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
