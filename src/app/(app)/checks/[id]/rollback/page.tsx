"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { SQLBlock } from "@/components/design-system/sql-block";
import { LoadingCardSkeleton, ErrorState } from "@/components/design-system/states";
import { ArrowLeft, AlertTriangle, Shield } from "lucide-react";

export default function RollbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [rollback, setRollback] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/checks/${id}/rollback`).then((r) => r.json()).then((d) => { setRollback(d.rollback); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 space-y-4"><LoadingCardSkeleton /><LoadingCardSkeleton /></div>;
  if (!rollback) return <ErrorState title="Rollback not available" onRetry={() => window.location.reload()} />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
      <Link href={`/checks/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to check
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Rollback Script</h1>
        <p className="text-sm text-[var(--text-secondary)]">The validated reverse migration for this change.</p>
      </div>

      {rollback.reversible ? (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-[#1E7A46]/20 bg-[#1E7A46]/5">
          <Shield className="h-5 w-5 text-[#1E7A46] dark:text-[#34D27B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#1E7A46] dark:text-[#34D27B]">Fully reversible</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">This rollback fully reverses the change with no data loss.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-[#B3261E]/20 bg-[#B3261E]/5">
          <AlertTriangle className="h-5 w-5 text-[#B3261E] dark:text-[#F87171] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#B3261E] dark:text-[#F87171]">Partially destructive</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{rollback.destructiveWarning}</p>
          </div>
        </div>
      )}

      <SQLBlock code={rollback.sql} title="rollback.sql" />

      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1.5">Notes</p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{rollback.notes}</p>
      </div>
    </div>
  );
}
