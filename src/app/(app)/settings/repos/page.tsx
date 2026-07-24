"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DBConnectionStatus } from "@/components/design-system/verdict-badge";
import { LoadingTableSkeleton } from "@/components/design-system/states";
import { formatBytes } from "@/lib/utils";
import { ArrowLeft, GitBranch, Shield, RefreshCw, Loader2 } from "lucide-react";

interface RepoSettings { id: string; name: string; fullName: string; defaultBranch: string; dbConnected: boolean; checksEnabled: boolean; blockOnDanger: boolean; dbConnection: { dialect: string; host: string; tableCount: number; totalSizeBytes: number } | null; }

export default function SettingsReposPage() {
  const [repos, setRepos] = useState<RepoSettings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/repositories").then((r) => r.json()).then((d) => { setRepos(d.repositories || []); setLoading(false); });
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Repositories & Database</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage connected repositories and their read-only database connections.</p>
      </div>

      <div className="p-4 rounded-xl border border-[#1E7A46]/20 bg-[#1E7A46]/5">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-[#1E7A46] dark:text-[#34D27B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Read-only database access</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              MigrateSafe only reads schema structure and table sizes. We never access, modify, or store your data rows.
            </p>
          </div>
        </div>
      </div>

      {loading ? <LoadingTableSkeleton rows={3} /> : (
        <div className="space-y-4">
          {repos.map((repo) => (
            <div key={repo.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="h-9 w-9 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center">
                  <GitBranch className="h-4 w-4 text-[var(--text-secondary)]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{repo.fullName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[var(--text-tertiary)] font-mono">{repo.defaultBranch}</span>
                    <DBConnectionStatus connected={repo.dbConnected} />
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] px-5 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Automatic checks</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Analyze every PR with migration changes</p>
                  </div>
                  <div className={`h-5 w-9 rounded-full relative cursor-pointer transition-colors ${repo.checksEnabled ? "bg-brand" : "bg-[var(--border)]"}`}>
                    <div className={`h-4 w-4 rounded-full bg-white absolute top-0.5 transition-all ${repo.checksEnabled ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Block merge on Dangerous</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Require override before merging</p>
                  </div>
                  <div className={`h-5 w-9 rounded-full relative cursor-pointer transition-colors ${repo.blockOnDanger ? "bg-brand" : "bg-[var(--border)]"}`}>
                    <div className={`h-4 w-4 rounded-full bg-white absolute top-0.5 transition-all ${repo.blockOnDanger ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </div>
                {repo.dbConnection && (
                  <div className="pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-[var(--text-primary)]">Database connection</p>
                      <button className="text-xs text-brand hover:underline flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Re-test
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div><span className="text-[var(--text-tertiary)]">Dialect:</span> <span className="text-[var(--text-primary)] font-mono capitalize">{repo.dbConnection.dialect}</span></div>
                      <div><span className="text-[var(--text-tertiary)]">Host:</span> <span className="text-[var(--text-primary)] font-mono">{repo.dbConnection.host}</span></div>
                      <div><span className="text-[var(--text-tertiary)]">Tables:</span> <span className="text-[var(--text-primary)]">{repo.dbConnection.tableCount}</span></div>
                      <div><span className="text-[var(--text-tertiary)]">Size:</span> <span className="text-[var(--text-primary)]">{formatBytes(repo.dbConnection.totalSizeBytes)}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
