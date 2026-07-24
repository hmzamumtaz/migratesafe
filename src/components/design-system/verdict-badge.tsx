"use client";

import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/migratesafe-api";

const verdictConfig: Record<Verdict, { label: string; bg: string; text: string; dot: string }> = {
  safe: {
    label: "Safe",
    bg: "bg-[#1E7A46]/10 dark:bg-[#1E7A46]/15",
    text: "text-[#1E7A46] dark:text-[#34D27B]",
    dot: "bg-[#1E7A46] dark:bg-[#34D27B]",
  },
  caution: {
    label: "Caution",
    bg: "bg-[#C77700]/10 dark:bg-[#C77700]/15",
    text: "text-[#C77700] dark:text-[#F59E0B]",
    dot: "bg-[#C77700] dark:bg-[#F59E0B]",
  },
  dangerous: {
    label: "Dangerous",
    bg: "bg-[#B3261E]/10 dark:bg-[#B3261E]/15",
    text: "text-[#B3261E] dark:text-[#F87171]",
    dot: "bg-[#B3261E] dark:bg-[#F87171]",
  },
};

export function VerdictBadge({ verdict, size = "md" }: { verdict: Verdict; size?: "sm" | "md" | "lg" }) {
  const c = verdictConfig[verdict];
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1.5",
    md: "px-3 py-1 text-sm gap-2",
    lg: "px-4 py-1.5 text-base gap-2",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full font-medium", c.bg, c.text, sizeClasses[size])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

export function SeverityTag({ severity }: { severity: "info" | "warning" | "critical" }) {
  const config = {
    info: { label: "Info", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    warning: { label: "Warning", cls: "bg-[#C77700]/10 text-[#C77700] dark:text-[#F59E0B]" },
    critical: { label: "Critical", cls: "bg-[#B3261E]/10 text-[#B3261E] dark:text-[#F87171]" },
  };
  const c = config[severity];
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", c.cls)}>
      {c.label}
    </span>
  );
}

export function StatusPill({ status }: { status: "queued" | "analyzing" | "complete" }) {
  const config = {
    queued: { label: "Queued", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", dot: "bg-gray-400" },
    analyzing: { label: "Analyzing", cls: "bg-brand-light text-brand dark:bg-brand/15 dark:text-blue-400", dot: "bg-brand animate-pulse-glow" },
    complete: { label: "Complete", cls: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400", dot: "bg-green-500" },
  };
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium gap-1.5", c.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

export function DBConnectionStatus({ connected, className }: { connected: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        connected ? "text-[#1E7A46] dark:text-[#34D27B]" : "text-[#B3261E] dark:text-[#F87171]",
        className
      )}
      title="MigrateSafe uses a read-only connection — we only read schema structure and table sizes, never your data rows."
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-[#1E7A46] dark:bg-[#34D27B]" : "bg-[#B3261E] dark:bg-[#F87171]")} />
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}
