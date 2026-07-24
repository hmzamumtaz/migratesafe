"use client";

import { useEffect, useState } from "react";
import { LoadingCardSkeleton } from "@/components/design-system/states";
import { CreditCard, Check, AlertTriangle, ArrowUpRight, Loader2 } from "lucide-react";

interface Usage {
  plan: string;
  analysesUsed: number;
  analysesIncluded: number;
  periodEnd: string;
}

const PLANS = [
  {
    name: "Free",
    id: "free",
    price: "$0",
    period: "forever",
    analyses: 50,
    features: ["50 analyses/month", "1 user", "Basic risk detection", "GitHub integration"],
  },
  {
    name: "Pro",
    id: "pro",
    price: "$39",
    period: "/month",
    analyses: 200,
    features: ["200 analyses/month", "1 user", "AI-powered analysis", "Rollout plans", "Priority support"],
  },
  {
    name: "Team",
    id: "team",
    price: "$149",
    period: "/month",
    analyses: 1000,
    features: ["1,000 analyses/month", "5 users", "AI-powered analysis", "Rollout plans", "Audit log", "Priority support"],
  },
];

export default function BillingPage() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => { setUsage(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Failed to create checkout. Please try again.");
    }
    setUpgrading(null);
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Failed to open subscription management.");
    }
  };

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 space-y-6"><LoadingCardSkeleton /><LoadingCardSkeleton /></div>;

  const usagePercent = usage ? Math.round((usage.analysesUsed / usage.analysesIncluded) * 100) : 0;
  const nearLimit = usagePercent >= 80;
  const currentPlan = usage?.plan || "free";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Billing & Usage</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your plan, usage, and payment.</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Current plan</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1 capitalize">{currentPlan} plan</p>
          </div>
          {currentPlan !== "free" && (
            <button onClick={handleManageSubscription} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors">
              <CreditCard className="h-4 w-4" /> Manage subscription
            </button>
          )}
        </div>
      </div>

      {usage && (
        <div className={`rounded-xl border bg-[var(--surface)] p-5 ${nearLimit ? "border-[#C77700]/30" : "border-[var(--border)]"}`}>
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-3">Usage this period</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{usage.analysesUsed}</span>
            <span className="text-sm text-[var(--text-tertiary)]">of {usage.analysesIncluded} analyses</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden mb-3">
            <div className={`h-full rounded-full transition-all ${nearLimit ? "bg-[#C77700]" : "bg-brand"}`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">{usagePercent}% used</p>
          {nearLimit && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-[#C77700]/10 text-[#C77700] dark:text-[#F59E0B] text-xs">
              <AlertTriangle className="h-3.5 w-3.5" />
              {usagePercent >= 100 ? "You've reached your limit. Upgrade to continue." : "Approaching your analysis limit."}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isDowngrade =
            (currentPlan === "team" && plan.id !== "team") ||
            (currentPlan === "pro" && plan.id === "free");
          const showUpgrade = !isCurrent && !isDowngrade && plan.id !== "free";

          return (
            <div key={plan.id} className={`rounded-xl border bg-[var(--surface)] p-5 flex flex-col ${isCurrent ? "border-brand" : "border-[var(--border)]"}`}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-[var(--text-primary)]">{plan.price}</span>
                  <span className="text-sm text-[var(--text-tertiary)]">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Check className="h-4 w-4 text-[#1E7A46] dark:text-[#34D27B] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="px-4 py-2.5 text-sm font-medium text-center rounded-lg bg-brand/10 text-brand">Current plan</div>
              ) : showUpgrade ? (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={!!upgrading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
                >
                  {upgrading === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Upgrade <ArrowUpRight className="h-4 w-4" /></>}
                </button>
              ) : (
                <div className="px-4 py-2.5 text-sm font-medium text-center rounded-lg border border-[var(--border)] text-[var(--text-tertiary)]">Included</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-4">All plans include</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {["AI-powered risk analysis", "Zero-downtime rollout plans", "Validated rollback scripts", "GitHub & GitLab integration", "Read-only database access", "Audit log"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Check className="h-4 w-4 text-[#1E7A46] dark:text-[#34D27B] flex-shrink-0" />{f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
