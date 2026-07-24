"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/theme-provider";
import { ArrowLeft, Sun, Moon, Trash2, GitBranch } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { LoadingCardSkeleton } from "@/components/design-system/states";

interface UserProfile { id: string; email: string; name: string; role: string; createdAt: string; }

export default function AccountPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) { router.push("/auth/signin"); return; }
      return r.json();
    }).then((d) => {
      if (d?.user) {
        setUser(d.user);
        setName(d.user.name);
      }
      setLoading(false);
    });
  }, [router]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl"><LoadingCardSkeleton /></div>;
  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Account Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your profile, security, and preferences.</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
        <div className="p-5">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-4">Profile</p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
              <input value={user.email} disabled className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-tertiary)] cursor-not-allowed" />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Contact support to change your email.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Role</label>
              <div className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] capitalize">{user.role}</div>
            </div>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
              {saved ? "Saved!" : "Save changes"}
            </button>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-4">Connected accounts</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]">
              <GithubIcon className="h-5 w-5 text-[var(--text-secondary)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">GitHub</p>
                <p className="text-xs text-[var(--text-tertiary)]">Not connected</p>
              </div>
              <button className="px-3 py-1 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors">Connect</button>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]">
              <GitBranch className="h-5 w-5 text-[var(--text-secondary)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">GitLab</p>
                <p className="text-xs text-[var(--text-tertiary)]">Not connected</p>
              </div>
              <button className="px-3 py-1 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors">Connect</button>
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-4">Security</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Two-factor authentication</p>
                <p className="text-xs text-[var(--text-tertiary)]">Add an extra layer of security</p>
              </div>
              <button className="px-3 py-1 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors">Enable</button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">API tokens</p>
                <p className="text-xs text-[var(--text-tertiary)]">For CLI and programmatic access</p>
              </div>
              <button className="px-3 py-1 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors">Manage</button>
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

        <div className="p-5">
          <p className="text-xs font-medium text-[#B3261E] uppercase tracking-wide mb-4">Danger zone</p>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[#B3261E]/30 text-[#B3261E] dark:text-[#F87171] hover:bg-[#B3261E]/5 transition-colors">
            <Trash2 className="h-4 w-4" /> Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
