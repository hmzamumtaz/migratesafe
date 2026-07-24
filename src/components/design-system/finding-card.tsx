"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { SeverityTag } from "./verdict-badge";
import { SQLBlock } from "./sql-block";
import type { Finding } from "@/lib/migratesafe-api";

const categoryLabels: Record<string, string> = {
  "breaking-change": "Breaking Change",
  "lock-risk": "Lock Risk",
  "data-loss": "Data Loss",
  "performance": "Performance",
};

const categoryColors: Record<string, string> = {
  "breaking-change": "text-[#B3261E] dark:text-[#F87171]",
  "lock-risk": "text-[#C77700] dark:text-[#F59E0B]",
  "data-loss": "text-[#B3261E] dark:text-[#F87171]",
  "performance": "text-[#1F5FAD] dark:text-[#60A5FA]",
};

export function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(finding.severity === "critical");

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all",
        finding.severity === "critical" && "border-l-2 border-l-[#B3261E] dark:border-l-[#F87171]",
        finding.severity === "warning" && "border-l-2 border-l-[#C77700] dark:border-l-[#F59E0B]",
        finding.severity === "info" && "border-l-2 border-l-blue-500"
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-[var(--bg)] transition-colors"
      >
        <span className="mt-0.5 text-[var(--text-tertiary)]">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <SeverityTag severity={finding.severity} />
            <span className={cn("text-xs font-medium", categoryColors[finding.category])}>
              {categoryLabels[finding.category]}
            </span>
            {finding.affectedTable && (
              <span className="text-xs text-[var(--text-tertiary)] font-mono">{finding.affectedTable}</span>
            )}
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{finding.title}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{finding.explanation}</p>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-slide-in">
          <div>
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1.5">Offending SQL</p>
            <SQLBlock code={finding.offendingSql} variant="diff" />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1.5">Explanation</p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{finding.explanation}</p>
          </div>
          {finding.estimatedImpact && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--bg)]">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Estimated impact:</span>
              <span className="text-xs font-medium text-[var(--text-primary)]">{finding.estimatedImpact}</span>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1.5">Suggested fix</p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">{finding.suggestedFix}</p>
            {finding.suggestedFixSql && (
              <SQLBlock code={finding.suggestedFixSql} title="Suggested SQL" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
