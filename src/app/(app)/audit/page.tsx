"use client";

import { useEffect, useState } from "react";
import { LoadingTableSkeleton, EmptyState } from "@/components/design-system/states";
import { formatDateTime } from "@/lib/utils";
import { Shield, GitBranch, Database, Pencil } from "lucide-react";

const actionIcons: Record<string, typeof Shield> = { "verdict-issued": Shield, "verdict-overridden": Pencil, "repository-connected": GitBranch, "database-connected": Database };

export default function AuditPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const reposRes = await fetch("/api/repositories");
      const reposData = await reposRes.json();
      const allEntries: any[] = [];
      for (const repo of reposData.repositories || []) {
        const res = await fetch(`/api/repositories/${repo.id}/audit`);
        const data = await res.json();
        allEntries.push(...(data.entries || []));
      }
      allEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEntries(allEntries);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = entries.filter((e) => {
    if (filter === "all") return true;
    if (filter === "overrides") return e.action === "verdict-overridden";
    if (filter === "connections") return e.action.includes("connected");
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Audit Log</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Chronological record of all significant actions.</p>
      </div>

      <div className="flex gap-2">
        {["all", "overrides", "connections"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === f ? "bg-brand/10 text-brand" : "text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <LoadingTableSkeleton rows={7} /> : filtered.length === 0 ? (
        <EmptyState title="No audit entries" description="Actions will appear here as you use MigrateSafe." />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
          {filtered.map((entry) => {
            const Icon = actionIcons[entry.action] || Shield;
            return (
              <div key={entry.id} className="flex items-start gap-4 px-4 py-3">
                <div className="h-8 w-8 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-[var(--text-tertiary)]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">{entry.details}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">{entry.user?.name || "System"}</p>
                </div>
                <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap flex-shrink-0">{formatDateTime(entry.createdAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
