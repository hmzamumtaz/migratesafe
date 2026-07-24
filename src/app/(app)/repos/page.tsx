"use client";

import { useEffect, useState } from "react";
import { DBConnectionStatus } from "@/components/design-system/verdict-badge";
import { LoadingTableSkeleton, EmptyState } from "@/components/design-system/states";
import { GitBranch, Plus, Settings, Shield, Loader2, RefreshCw, AlertCircle, Info, Pencil, Trash2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { GithubIcon } from "@/components/ui/github-icon";

interface Repo { id: string; name: string; fullName: string; provider: string; defaultBranch: string; dbConnection: { status: string } | null; checksEnabled: boolean; lastCheckAt: string | null; createdAt: string; _count: { migrationChecks: number }; }

interface GitHubRepo { id: number; name: string; fullName: string; private: boolean; defaultBranch: string; description: string | null; url: string; }

export default function ReposPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [modalTab, setModalTab] = useState<"manual" | "github">("github");
  const [newRepo, setNewRepo] = useState({ name: "", fullName: "", provider: "github", defaultBranch: "main" });
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [ghRepos, setGhRepos] = useState<GitHubRepo[]>([]);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghConnected, setGhConnected] = useState(false);
  const [ghError, setGhError] = useState("");

  const [editRepo, setEditRepo] = useState<Repo | null>(null);
  const [editForm, setEditForm] = useState({ name: "", fullName: "", defaultBranch: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteRepo, setDeleteRepo] = useState<Repo | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/repositories").then((r) => r.json()).then((d) => { setRepos(d.repositories || []); setLoading(false); });
  }, []);

  useEffect(() => {
    const handler = () => setOpenMenu(null);
    if (openMenu) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openMenu]);

  const connectGitHub = () => {
    window.location.href = "/api/auth/github?redirect=/repos";
  };

  const loadGitHubRepos = async () => {
    setGhLoading(true);
    setGhError("");
    try {
      const res = await fetch("/api/repositories/github");
      if (res.ok) {
        const data = await res.json();
        setGhRepos(data.repos || []);
        setGhConnected(true);
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 400 && data.error === "GitHub not connected") {
          setGhConnected(false);
        } else {
          setGhError(data.error || "Failed to load repositories");
        }
      }
    } catch {
      setGhError("Network error. Please try again.");
    }
    setGhLoading(false);
  };

  const handleImportFromGitHub = async (ghRepo: GitHubRepo) => {
    setConnecting(true);
    setConnectError("");
    try {
      const res = await fetch("/api/repositories/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ghRepo.name, fullName: ghRepo.fullName, provider: "github", defaultBranch: ghRepo.defaultBranch }),
      });
      if (res.ok) {
        const data = await res.json();
        setRepos([data.repository, ...repos]);
        setShowConnectModal(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setConnectError(data.error || "Failed to connect repository");
      }
    } catch {
      setConnectError("Network error");
    }
    setConnecting(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    setConnectError("");
    try {
      const res = await fetch("/api/repositories/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRepo),
      });
      if (res.ok) {
        const data = await res.json();
        setRepos([data.repository, ...repos]);
        setShowConnectModal(false);
        setNewRepo({ name: "", fullName: "", provider: "github", defaultBranch: "main" });
      } else {
        const data = await res.json().catch(() => ({}));
        setConnectError(data.error || "Failed to connect repository");
      }
    } catch {
      setConnectError("Network error");
    }
    setConnecting(false);
  };

  const parseGithubUrl = (url: string) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      const fullName = `${match[1]}/${match[2]}`.replace(/\.git$/, "");
      const name = match[2].replace(/\.git$/, "");
      setNewRepo({ ...newRepo, name, fullName });
    }
  };

  const openEdit = (repo: Repo) => {
    setEditRepo(repo);
    setEditForm({ name: repo.name, fullName: repo.fullName, defaultBranch: repo.defaultBranch });
    setEditError("");
    setOpenMenu(null);
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Repositories</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage connected repositories and their database connections.</p>
        </div>
        <button onClick={() => { setShowConnectModal(true); setModalTab("github"); setGhConnected(false); setGhRepos([]); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
          <Plus className="h-4 w-4" /> Connect repository
        </button>
      </div>

      {loading ? <LoadingTableSkeleton rows={3} /> : repos.length === 0 ? (
        <EmptyState title="No repositories connected" description="Connect a repository to start reviewing migrations." action={<button onClick={() => { setShowConnectModal(true); setModalTab("github"); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors"><Plus className="h-4 w-4" /> Connect repository</button>} />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
          {repos.map((repo) => (
            <div key={repo.id} className="flex items-center gap-4 px-4 sm:px-5 py-4 hover:bg-[var(--bg)] transition-colors">
              <div className="h-9 w-9 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                <GitBranch className="h-4 w-4 text-[var(--text-secondary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{repo.fullName}</p>
                  <span className="text-xs text-[var(--text-tertiary)] font-mono">{repo.defaultBranch}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <DBConnectionStatus connected={!!repo.dbConnection} />
                  <span className="text-xs text-[var(--text-tertiary)]">{repo._count.migrationChecks} checks</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link href={`/checks?repo=${repo.id}`} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors" title="View checks">
                  <Shield className="h-4 w-4" />
                </Link>
                <Link href="/settings/repos" className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors" title="Settings">
                  <Settings className="h-4 w-4" />
                </Link>
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === repo.id ? null : repo.id); }} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors" title="More actions">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenu === repo.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg z-10 py-1">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(repo); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteRepo(repo); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#B3261E] dark:text-[#F87171] hover:bg-[var(--bg)] transition-colors">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowConnectModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Connect repository</h2>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setModalTab("github")} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${modalTab === "github" ? "bg-brand text-white" : "bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
                <GithubIcon className="h-4 w-4 inline mr-1.5" />GitHub
              </button>
              <button onClick={() => setModalTab("manual")} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${modalTab === "manual" ? "bg-brand text-white" : "bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
                Manual
              </button>
            </div>
            {modalTab === "github" ? (
              <div className="space-y-3">
                {!ghConnected ? (
                  <div className="text-center py-6">
                    <GithubIcon className="h-10 w-10 mx-auto text-[var(--text-tertiary)] mb-3" />
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Connect your GitHub account to import repositories.</p>
                    <p className="text-xs text-[var(--text-tertiary)] mb-4">We only request read access to your repositories.</p>
                    <button onClick={connectGitHub} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#24292f] rounded-lg hover:bg-[#1c2128] transition-colors">
                      <GithubIcon className="h-4 w-4" /> Connect GitHub account
                    </button>
                  </div>
                ) : ghRepos.length === 0 && !ghError ? (
                  <div className="text-center py-8"><p className="text-sm text-[var(--text-secondary)]">No repositories found.</p></div>
                ) : ghError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 mx-auto text-[#B3261E] dark:text-[#F87171] mb-2" />
                    <p className="text-sm text-[var(--text-secondary)] mb-3">{ghError}</p>
                    <button onClick={connectGitHub} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#24292f] rounded-lg hover:bg-[#1c2128] transition-colors">
                      <GithubIcon className="h-4 w-4" /> Re-connect GitHub
                    </button>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {ghRepos.map((repo) => (
                      <div key={repo.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)] transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{repo.fullName}</p>
                          <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{repo.description || "No description"} {repo.private && "· Private"}</p>
                        </div>
                        <button onClick={() => handleImportFromGitHub(repo)} disabled={connecting} className="px-3 py-1.5 text-xs font-medium text-brand border border-brand rounded-lg hover:bg-brand hover:text-white transition-colors disabled:opacity-50">
                          Import
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {ghConnected && (
                  <button onClick={loadGitHubRepos} disabled={ghLoading} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                    <RefreshCw className={`h-3 w-3 ${ghLoading ? "animate-spin" : ""}`} /> Refresh
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-[var(--text-secondary)] space-y-1">
                      <p className="font-medium text-[var(--text-primary)]">How manual repositories work:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[var(--text-tertiary)]">
                        <li>Paste your repo URL or enter the owner/repo name</li>
                        <li>MigrateSafe scans for migration files on your default branch</li>
                        <li>Connect a read-only database for schema-aware analysis</li>
                        <li>Run checks by pasting SQL or uploading migration files</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Repository name</label>
                  <input value={newRepo.name} onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="acme-api" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full name or GitHub URL</label>
                  <input value={newRepo.fullName} onChange={(e) => { setNewRepo({ ...newRepo, fullName: e.target.value }); parseGithubUrl(e.target.value); }} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="acme-corp/acme-api or https://github.com/acme-corp/acme-api" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Provider</label>
                    <select value={newRepo.provider} onChange={(e) => setNewRepo({ ...newRepo, provider: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                      <option value="github">GitHub</option>
                      <option value="gitlab">GitLab</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Default branch</label>
                    <input value={newRepo.defaultBranch} onChange={(e) => setNewRepo({ ...newRepo, defaultBranch: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="main" />
                  </div>
                </div>
              </div>
            )}
            {connectError && <div className="mt-3 px-3 py-2 rounded-lg bg-[#B3261E]/10 text-[#B3261E] dark:text-[#F87171] text-sm">{connectError}</div>}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowConnectModal(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors">Cancel</button>
              {modalTab === "manual" && (
                <button onClick={handleConnect} disabled={!newRepo.name || !newRepo.fullName || connecting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Connect
                </button>
              )}
            </div>
          </div>
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
            <p className="text-xs text-[var(--text-tertiary)] mb-6">All migration checks, findings, audit entries, and database connections for this repository will be permanently deleted.</p>
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
