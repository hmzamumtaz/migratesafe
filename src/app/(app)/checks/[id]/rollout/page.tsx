"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { SQLBlock } from "@/components/design-system/sql-block";
import { LoadingCardSkeleton, ErrorState } from "@/components/design-system/states";
import { ArrowLeft, Check, Clock, Copy, Loader2 } from "lucide-react";

export default function RolloutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/checks/${id}/rollout-plan`).then((r) => r.json()).then((d) => { setPlan(d.plan); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 space-y-4">{[1, 2, 3, 4].map((i) => <LoadingCardSkeleton key={i} />)}</div>;
  if (!plan) return <ErrorState title="Plan not available" onRetry={() => window.location.reload()} />;

  const allSql = plan.steps.map((s: any) => s.sql).join("\n\n");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
      <Link href={`/checks/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to check
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Safe Rollout Plan</h1>
        <p className="text-sm text-[var(--text-secondary)]">A zero-downtime sequence to apply this change safely.</p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
          <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-secondary)]">Estimated total:</span>
          <span className="font-medium text-[var(--text-primary)]">{plan.estimatedTotalTime}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E7A46]/10 border border-[#1E7A46]/20">
          <Check className="h-4 w-4 text-[#1E7A46] dark:text-[#34D27B]" />
          <span className="font-medium text-[#1E7A46] dark:text-[#34D27B]">Zero downtime</span>
        </div>
      </div>

      <div className="space-y-0">
        {plan.steps.map((step: any, i: number) => (
          <div key={step.order} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{step.order}</div>
              {i < plan.steps.length - 1 && <div className="w-0.5 flex-1 bg-brand/20 my-1" />}
            </div>
            <div className="pb-8 flex-1">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{step.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">{step.description}</p>
              <SQLBlock code={step.sql} title={`Step ${step.order}`} className="mb-2" />
              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-[#1E7A46]/5 border border-[#1E7A46]/10">
                <Check className="h-4 w-4 text-[#1E7A46] dark:text-[#34D27B] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{step.whySafe}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--border)]">
        <button onClick={() => navigator.clipboard.writeText(allSql)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
          <Copy className="h-4 w-4" /> Copy all SQL
        </button>
      </div>
    </div>
  );
}
