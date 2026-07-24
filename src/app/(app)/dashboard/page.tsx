"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VerdictBadge, StatusPill, DBConnectionStatus } from "@/components/design-system/verdict-badge";
import { LoadingCardSkeleton, LoadingTableSkeleton, EmptyState } from "@/components/design-system/states";
import { Shield, GitBranch, AlertTriangle, Clock, ArrowUpRight } from "lucide-react";

interface Check { id: string; prTitle: string; prNumber: number; branch: string; author: string; verdict: string | null; status: string; findingsCount: number; createdAt: string; }
interface Repo { id: string; name: string; fullName: string; dbConnection: { status: string } | null; checksEnabled: boolean; }

export default function DashboardPage() {
  const router = useRouter();
  const [checks, setChecks] = useState<Check[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) { router.push("/auth/signin"); return; }

        const reposRes = await fetch("/api/repositories");
        const reposData = await reposRes.json();
        const reposList = reposData.repositories || [];
        setRepos(reposList);

        const allChecks: Check[] = [];
        const checkPromises = reposList.map((repo: Repo) =>
          fetch(`/api/repositories/${repo.id}/checks`).then((r) => r.json())
        );
        const checkResults = await Promise.all(checkPromises);
        for (const data of checkResults) {
          allChecks.push(...(data.checks || []));
        }
        allChecks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setChecks(allChecks);
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, [router]);

  const dangerChecks = checks.filter((c) => c.verdict === "dangerous");
  const connectedRepos = repos.filter((r) => r.dbConnection);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Migration safety overview across all repositories.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <LoadingCardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total checks", value: checks.length, icon: <Shield className="h-4 w-4" />, color: "text-brand" },
            { label: "Dangerous caught", value: dangerChecks.length, icon: <AlertTriangle className="h-4 w-4" />, color: "text-[#B3261E] dark:text-[#F87171]" },
            { label: "Repos connected", value: repos.length, icon: <GitBranch className="h-4 w-4" />, color: "text-[#1E7A46] dark:text-[#34D27B]" },
            { label: "DB connections", value: connectedRepos.length, icon: <Clock className="h-4 w-4" />, color: "text-[#C77700] dark:text-[#F59E0B]" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-2 mb-2">
                <span className={s.color}>{s.icon}</span>
                <span className="text-xs text-[var(--text-tertiary)]">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Recent migration checks</h2>
          {loading ? <LoadingTableSkeleton rows={5} /> : checks.length === 0 ? (
            <EmptyState title="No checks yet" description="Connect a repository and open a PR with a migration to see your first report." action={<Link href="/repos" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors"><GitBranch className="h-4 w-4" /> Connect repository</Link>} />
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
              {checks.map((check) => (
                <Link key={check.id} href={`/checks/${check.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg)] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{check.prTitle}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">#{check.prNumber} &middot; {check.author} &middot; {check.branch}</p>
                  </div>
                  {check.verdict && <VerdictBadge verdict={check.verdict as "safe" | "caution" | "dangerous"} size="sm" />}
                  <StatusPill status={check.status as "queued" | "analyzing" | "complete"} />
                  <ArrowUpRight className="h-4 w-4 text-[var(--text-tertiary)] hidden sm:block" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {dangerChecks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Needs attention</h2>
              <div className="rounded-xl border border-[#B3261E]/20 bg-[#B3261E]/5 overflow-hidden">
                {dangerChecks.map((check) => (
                  <Link key={check.id} href={`/checks/${check.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#B3261E]/8 transition-colors border-b border-[#B3261E]/10 last:border-0">
                    <AlertTriangle className="h-4 w-4 text-[#B3261E] dark:text-[#F87171] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{check.prTitle}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">#{check.prNumber}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Database connections</h2>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
              {connectedRepos.length === 0 ? (
                <div className="px-4 py-4 text-center"><p className="text-xs text-[var(--text-tertiary)]">No database connections</p></div>
              ) : connectedRepos.map((repo) => (
                <div key={repo.id} className="flex items-center gap-3 px-4 py-3">
                  <GitBranch className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{repo.name}</p>
                  </div>
                  <DBConnectionStatus connected={!!repo.dbConnection} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
