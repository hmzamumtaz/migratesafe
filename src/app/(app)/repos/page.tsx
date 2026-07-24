"use client";

import { useEffect, useState } from "react";
import { DBConnectionStatus } from "@/components/design-system/verdict-badge";
import { LoadingTableSkeleton, EmptyState } from "@/components/design-system/states";
import { timeAgo } from "@/lib/utils";
import { GitBranch, Plus, Settings, Shield, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { GithubIcon } from "@/components/ui/github-icon";

interface Repo { id: string; name: string; fullName: string; provider: string; defaultBranch: string; dbConnection: { status: string } | null; checksEnabled: boolean; lastCheckAt: string | null; createdAt: string; _count: { migrationChecks: number }; }

interface GitHubRepo { id: number; name: string; fullName: string; private: boolean; defaultBranch: string; description: string | null; url: string; }

export default function ReposPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"manual" | "github">("github");
  const [newRepo, setNewRepo] = useState({ name: "", fullName: "", provider: "github" });
  const [connecting, setConnecting] = useState(false);
  const [ghRepos, setGhRepos] = useState<GitHubRepo[]>([]);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghConnected, setGhConnected] = useState(false);

  useEffect(() => {
    fetch("/api/repositories").then((r) => r.json()).then((d) => { setRepos(d.repositories || []); setLoading(false); });
  }, []);

  const loadGitHubRepos = async () => {
    setGhLoading(true);
    try {
      const res = await fetch("/api/repositories/github");
      if (res.ok) {
        const data = await res.json();
        setGhRepos(data.repos || []);
        setGhConnected(true);
      } else {
        setGhConnected(false);
      }
    } catch {
      setGhConnected(false);
    }
    setGhLoading(false);
  };

  const handleImportFromGitHub = async (ghRepo: GitHubRepo) => {
    setConnecting(true);
    try {
      const res = await fetch("/api/repositories/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ghRepo.name,
          fullName: ghRepo.fullName,
          provider: "github",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRepos([data.repository, ...repos]);
        setShowModal(false);
      }
    } catch { }
    setConnecting(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    const res = await fetch("/api/repositories/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRepo),
    });
    if (res.ok) {
      const data = await res.json();
      setRepos([data.repository, ...repos]);
      setShowModal(false);
      setNewRepo({ name: "", fullName: "", provider: "github" });
    }
    setConnecting(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Repositories</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage connected repositories and their database connections.</p>
        </div>
        <button onClick={() => { setShowModal(true); setModalTab("github"); loadGitHubRepos(); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
          <Plus className="h-4 w-4" /> Connect repository
        </button>
      </div>

      {loading ? <LoadingTableSkeleton rows={3} /> : repos.length === 0 ? (
        <EmptyState title="No repositories connected" description="Connect a repository to start reviewing migrations." action={<button onClick={() => { setShowModal(true); setModalTab("github"); loadGitHubRepos(); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors"><Plus className="h-4 w-4" /> Connect repository</button>} />
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
              <div className="flex items-center gap-2">
                <Link href={`/checks?repo=${repo.id}`} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors">
                  <Shield className="h-4 w-4" />
                </Link>
                <Link href="/settings/repos" className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors">
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
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
                  <div className="text-center py-8">
                    <GithubIcon className="h-10 w-10 mx-auto text-[var(--text-tertiary)] mb-3" />
                    <p className="text-sm text-[var(--text-secondary)] mb-4">Connect your GitHub account to import repositories.</p>
                    <button onClick={loadGitHubRepos} disabled={ghLoading} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                      {ghLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GithubIcon className="h-4 w-4" />}
                      Load repositories
                    </button>
                  </div>
                ) : ghRepos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[var(--text-secondary)]">No repositories found. Make sure you have access to repositories.</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {ghRepos.map((repo) => (
                      <div key={repo.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)] transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{repo.fullName}</p>
                          <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{repo.description || "No description"}</p>
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
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Repository name</label>
                  <input value={newRepo.name} onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="acme-api" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full name (owner/repo)</label>
                  <input value={newRepo.fullName} onChange={(e) => setNewRepo({ ...newRepo, fullName: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="acme-corp/acme-api" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Provider</label>
                  <select value={newRepo.provider} onChange={(e) => setNewRepo({ ...newRepo, provider: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                    <option value="github">GitHub</option>
                    <option value="gitlab">GitLab</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors">Cancel</button>
              {modalTab === "manual" && (
                <button onClick={handleConnect} disabled={!newRepo.name || !newRepo.fullName || connecting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
