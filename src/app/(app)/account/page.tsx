"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/theme-provider";
import { ArrowLeft, Sun, Moon, Trash2, GitBranch, Loader2, Check, User, Mail, Shield, Calendar } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { LoadingCardSkeleton } from "@/components/design-system/states";

interface UserProfile { id: string; email: string; name: string; role: string; avatar: string | null; githubId: string | null; createdAt: string; }

export default function AccountPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [showDelete, setShowDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/profile").then((r) => {
      if (!r.ok) { router.push("/auth/signin"); return; }
      return r.json();
    }).then((d) => {
      if (d?.user) {
        setUser(d.user);
        setName(d.user.name);
        setEmail(d.user.email);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
      } else {
        setUser(data.user);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setError("Network error");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/auth/profile", { method: "DELETE" });
      if (res.ok) {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/auth/signin";
      }
    } catch { }
    setDeleteLoading(false);
  };

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl"><LoadingCardSkeleton /></div>;
  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profile</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your account details and preferences.</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="p-5 flex items-center gap-4 border-b border-[var(--border)]">
          <div className="h-16 w-16 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full" />
            ) : (
              <User className="h-8 w-8 text-brand" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{user.name}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-brand/10 text-brand capitalize">{user.role.replace("_", " ")}</span>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-4">Personal information</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
              <div className="flex items-center gap-2">
                <input value={email} disabled className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-tertiary)] cursor-not-allowed" />
                <span className="text-xs text-[var(--text-tertiary)]">Verified</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Role</label>
                <div className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] capitalize flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[var(--text-tertiary)]" />
                  {user.role.replace("_", " ")}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Member since</label>
                <div className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--text-tertiary)]" />
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            {error && <div className="px-3 py-2 rounded-lg bg-[#B3261E]/10 text-[#B3261E] dark:text-[#F87171] text-sm">{error}</div>}
            <button onClick={handleSave} disabled={saving || name === user.name} className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
              {saved ? "Saved!" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
        <div className="p-5">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-4">Connected accounts</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]">
              <GithubIcon className="h-5 w-5 text-[var(--text-secondary)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">GitHub</p>
                <p className="text-xs text-[var(--text-tertiary)]">{user.githubId ? "Connected" : "Not connected"}</p>
              </div>
              {!user.githubId && (
                <button onClick={() => { window.location.href = "/api/auth/github?redirect=/account"; }} className="px-3 py-1 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors">
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-4">Appearance</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Theme</p>
              <p className="text-xs text-[var(--text-tertiary)]">Switch between light and dark mode</p>
            </div>
            <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#B3261E]/20 bg-[var(--surface)] p-5">
        <p className="text-xs font-medium text-[#B3261E] uppercase tracking-wide mb-2">Danger zone</p>
        <p className="text-sm text-[var(--text-secondary)] mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button onClick={() => setShowDelete(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[#B3261E]/30 text-[#B3261E] dark:text-[#F87171] hover:bg-[#B3261E]/5 transition-colors">
          <Trash2 className="h-4 w-4" /> Delete account
        </button>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDelete(false)}>
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-[#B3261E]/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-[#B3261E] dark:text-[#F87171]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Delete account</h2>
                <p className="text-sm text-[var(--text-secondary)]">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Are you sure you want to delete <span className="font-medium text-[var(--text-primary)]">{user.email}</span>?</p>
            <p className="text-xs text-[var(--text-tertiary)] mb-6">All repositories, checks, findings, and audit entries will be permanently deleted.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#B3261E] rounded-lg hover:bg-[#8B1A14] transition-colors disabled:opacity-50">
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
