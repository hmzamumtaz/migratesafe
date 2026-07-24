"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/theme-provider";
import { useState } from "react";

const mobileNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/repos", label: "Repos" },
  { href: "/checks", label: "Checks" },
  { href: "/audit", label: "Audit" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
];

export function MobileHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-brand flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold">MigrateSafe</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg)]">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={() => setOpen(!open)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg)]">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>
      {open && (
        <nav className="fixed inset-0 top-14 z-40 bg-[var(--surface)] border-b border-[var(--border)] p-4 space-y-1 animate-slide-in">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-2.5 rounded-lg text-sm font-medium",
                pathname.startsWith(item.href)
                  ? "bg-brand/10 text-brand"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
