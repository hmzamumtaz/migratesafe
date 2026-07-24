"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DBConnectionStatus } from "@/components/design-system/verdict-badge";
import { LoadingTableSkeleton } from "@/components/design-system/states";
import { formatBytes } from "@/lib/utils";
import { ArrowLeft, GitBranch, Shield, RefreshCw, Loader2, Pencil, Trash2 } from "lucide-react";

interface RepoSettings { id: string; name: string; fullName: string; defaultBranch: string; dbConnected: boolean; checksEnabled: boolean; blockOnDanger: boolean; dbConnection: { dialect: string; host: string; tableCount: number; totalSizeBytes: number } | null; }

export default function SettingsReposPage() {
  const [repos, setRepos] = useState<RepoSettings[]>([]);
  const [loading, setLoading] = useState(true);

  const [editRepo, setEditRepo] = useState<RepoSettings | null>(null);
  const [editForm, setEditForm] = useState({ name: "", fullName: "", defaultBranch: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteRepo, setDeleteRepo] = useState<RepoSettings | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetch("/api/repositories").then((r) => r.json()).then((d) => { setRepos(d.repositories || []); setLoading(false); });
  }, []);

  const openEdit = (repo: RepoSettings) => {
    setEditRepo(repo);
    setEditForm({ name: repo.name, fullName: repo.fullName, defaultBranch: repo.defaultBranch });
    setEditError("");
  };

  const handleEdit = async () => {
    if (!editRepo) return;
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/repositories/${editRepo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const data = await res.json();
        setRepos(repos.map((r) => r.id === editRepo.id ? { ...r, ...data.repository } : r));
        setEditRepo(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setEditError(data.error || "Failed to update");
      }
    } catch {
      setEditError("Network error");
    }
    setEditLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteRepo) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/repositories/${deleteRepo.id}`, { method: "DELETE" });
      if (res.ok) {
        setRepos(repos.filter((r) => r.id !== deleteRepo.id));
        setDeleteRepo(null);
      }
    } catch { }
    setDeleteLoading(false);
  };

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
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(repo)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteRepo(repo)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[#B3261E] dark:hover:text-[#F87171] hover:bg-[var(--bg)] transition-colors" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
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

      {editRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditRepo(null)}>
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Edit repository</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Repository name</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full name (owner/repo)</label>
                <input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Default branch</label>
                <input value={editForm.defaultBranch} onChange={(e) => setEditForm({ ...editForm, defaultBranch: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            </div>
            {editError && <div className="mt-3 px-3 py-2 rounded-lg bg-[#B3261E]/10 text-[#B3261E] dark:text-[#F87171] text-sm">{editError}</div>}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditRepo(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors">Cancel</button>
              <button onClick={handleEdit} disabled={editLoading || !editForm.name || !editForm.fullName} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />} Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteRepo(null)}>
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-[#B3261E]/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-[#B3261E] dark:text-[#F87171]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Delete repository</h2>
                <p className="text-sm text-[var(--text-secondary)]">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Are you sure you want to delete <span className="font-medium text-[var(--text-primary)]">{deleteRepo.fullName}</span>?</p>
            <p className="text-xs text-[var(--text-tertiary)] mb-6">All migration checks, findings, audit entries, and database connections will be permanently deleted.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteRepo(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#B3261E] rounded-lg hover:bg-[#8B1A14] transition-colors disabled:opacity-50">
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete repository
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
