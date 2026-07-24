"use client";

import { VerdictBadge } from "@/components/design-system/verdict-badge";
import type { Verdict } from "@/lib/migratesafe-api";
import { Shield, AlertTriangle, Check, ExternalLink } from "lucide-react";

interface PRCommentProps {
  prNumber: number;
  prTitle: string;
  repo: string;
  verdict: Verdict;
  summary: string;
  findingsCount: number;
  checkUrl: string;
}

const verdictEmoji: Record<Verdict, string> = {
  safe: "✅",
  caution: "⚠️",
  dangerous: "🚨",
};

const verdictBorder: Record<Verdict, string> = {
  safe: "border-[#1E7A46]",
  caution: "border-[#C77700]",
  dangerous: "border-[#B3261E]",
};

export function PRCommentPreview({ prNumber, prTitle, repo, verdict, summary, findingsCount, checkUrl }: PRCommentProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg)]">
        <p className="text-xs font-medium text-[var(--text-tertiary)]">Preview — how this appears as a GitHub PR comment</p>
      </div>
      <div className="p-4">
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <div className={`border-l-4 ${verdictBorder[verdict]} px-4 py-3 bg-[var(--bg)]`}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-brand" />
              <span className="text-sm font-bold text-[var(--text-primary)]">MigrateSafe</span>
              <VerdictBadge verdict={verdict} size="sm" />
            </div>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-2">
              {verdictEmoji[verdict]} <strong>{summary}</strong>
            </p>
            {findingsCount > 0 && (
              <p className="text-xs text-[var(--text-secondary)]">
                {findingsCount} finding{findingsCount !== 1 ? "s" : ""} detected.{" "}
                <a href={checkUrl} className="text-brand hover:underline inline-flex items-center gap-0.5">
                  View full report <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            )}
            {verdict === "safe" && (
              <p className="text-xs text-[#1E7A46] dark:text-[#34D27B]">
                No issues found. This migration is safe to merge.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
