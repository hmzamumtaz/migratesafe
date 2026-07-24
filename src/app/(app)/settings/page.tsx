"use client";

import Link from "next/link";
import { GitBranch, Users, Shield, Database, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const sections = [
    { href: "/settings/repos", icon: <GitBranch className="h-5 w-5" />, title: "Repositories & Database", desc: "Manage connected repos and read-only DB connections" },
    { href: "/settings/team", icon: <Users className="h-5 w-5" />, title: "Team & Notifications", desc: "Invite teammates, roles, and alert preferences" },
    { href: "/account", icon: <Shield className="h-5 w-5" />, title: "Account Settings", desc: "Profile, security, API tokens, and theme" },
    { href: "/billing", icon: <Database className="h-5 w-5" />, title: "Billing & Usage", desc: "Plan, usage, invoices, and payment" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your MigrateSafe configuration.</p>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg)] transition-colors">
            <div className="h-10 w-10 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)]">{s.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">{s.title}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{s.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
