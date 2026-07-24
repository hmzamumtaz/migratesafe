"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingTableSkeleton } from "@/components/design-system/states";
import { ArrowLeft, UserPlus, Mail, Bell, Settings } from "lucide-react";

interface TeamMemberType { id: string; name: string; email: string; role: string; }

const roleColors: Record<string, string> = {
  admin: "bg-brand/10 text-brand",
  member: "bg-[#1E7A46]/10 text-[#1E7A46] dark:text-[#34D27B]",
  viewer: "bg-[var(--bg)] text-[var(--text-secondary)]",
};

export default function SettingsTeamPage() {
  const [members, setMembers] = useState<TeamMemberType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invited, setInvited] = useState(false);

  useEffect(() => {
    fetch("/api/team").then((r) => r.json()).then((d) => { setMembers(d.members || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setInvited(true);
    setTimeout(() => { setInvited(false); setShowInvite(false); setInviteEmail(""); }, 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to settings
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Team & Notifications</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage team members and alert preferences.</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
          <UserPlus className="h-4 w-4" /> Invite
        </button>
      </div>

      {loading ? <LoadingTableSkeleton rows={4} /> : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--border)] text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Team members ({members.length})</div>
          <div className="divide-y divide-[var(--border)]">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-4 py-3">
                <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center text-sm font-bold text-brand">
                  {m.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{m.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{m.email}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${roleColors[m.role] || roleColors.viewer}`}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[var(--border)] text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Notification preferences</div>
        <div className="divide-y divide-[var(--border)]">
          {[
            { icon: <Bell className="h-4 w-4" />, title: "PR comment on every check", desc: "MigrateSafe comments on PRs with the verdict summary", enabled: true },
            { icon: <Mail className="h-4 w-4" />, title: "Email on Dangerous verdict", desc: "Immediate email when a dangerous migration is detected", enabled: true },
            { icon: <Settings className="h-4 w-4" />, title: "Weekly digest", desc: "Summary of all checks run this week", enabled: false },
          ].map((n) => (
            <div key={n.title} className="flex items-center gap-4 px-4 py-3">
              <div className="text-[var(--text-tertiary)]">{n.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{n.desc}</p>
              </div>
              <div className={`h-5 w-9 rounded-full relative cursor-pointer transition-colors ${n.enabled ? "bg-brand" : "bg-[var(--border)]"}`}>
                <div className={`h-4 w-4 rounded-full bg-white absolute top-0.5 transition-all ${n.enabled ? "right-0.5" : "left-0.5"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Invite team member</h2>
            {invited ? (
              <div className="px-3 py-2 rounded-lg bg-[#1E7A46]/10 text-[#1E7A46] dark:text-[#34D27B] text-sm">Invitation sent to {inviteEmail}</div>
            ) : (
              <>
                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="colleague@company.com" />
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors">Cancel</button>
                  <button onClick={handleInvite} disabled={!inviteEmail.trim()} className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">Send invite</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
