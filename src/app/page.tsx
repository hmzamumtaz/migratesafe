"use client";

import Link from "next/link";
import {
  Shield, ArrowRight, Check, Database, GitBranch,
  GitPullRequest, Lock, AlertTriangle, Trash2, RotateCcw,
  Clock, Zap, Eye, ChevronDown, Server, FileCode,
  TrendingDown, Activity, BarChart3, Users, ArrowUpRight,
} from "lucide-react";
import { VerdictBadge } from "@/components/design-system/verdict-badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const STATISTICS = [
  { value: "12.4%", label: "of migrations contain risks", icon: AlertTriangle },
  { value: "$4.7M", label: "avg cost of a database incident", icon: TrendingDown },
  { value: "73%", label: "caused by schema changes", icon: Database },
  { value: "4.2hrs", label: "avg recovery time", icon: Clock },
];

const PROBLEMS = [
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Hidden table locks",
    description: "A single ALTER TABLE on a 4M-row table locks all writes for 40-90 seconds. Your app times out. Customers see errors. Nobody knew until it happened.",
    example: "ALTER TABLE orders ADD COLUMN status VARCHAR(50) NOT NULL;",
    impact: "Full table lock. All app writes timeout.",
    color: "text-[#C77700] dark:text-[#F59E0B]",
    bg: "bg-[#C77700]/8",
    border: "border-[#C77700]/15",
  },
  {
    icon: <Trash2 className="h-5 w-5" />,
    title: "Irreversible data loss",
    description: "DROP TABLE or TRUNCATE in production without a backup. The data is gone. No rollback can bring it back. The migration tool said 'success'.",
    example: "DROP TABLE legacy_payments;",
    impact: "Permanent data loss. No undo.",
    color: "text-[#B3261E] dark:text-[#F87171]",
    bg: "bg-[#B3261E]/8",
    border: "border-[#B3261E]/15",
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "Breaking deployed code",
    description: "You drop a column the app still queries. Deploy finishes. The next request hits a missing column error. The rollback race begins.",
    example: "ALTER TABLE payments DROP COLUMN old_reference;",
    impact: "Runtime errors in 5+ dependent services.",
    color: "text-[#B3261E] dark:text-[#F87171]",
    bg: "bg-[#B3261E]/8",
    border: "border-[#B3261E]/15",
  },
  {
    icon: <RotateCcw className="h-5 w-5" />,
    title: "Missing rollback paths",
    description: "The migration ran. It broke something. Now you need to roll back, but the migration has no reverse. The team scrambles to write one at 3 AM.",
    example: "-- No rollback provided",
    impact: "3 AM incident. Manual recovery.",
    color: "text-[#C77700] dark:text-[#F59E0B]",
    bg: "bg-[#C77700]/8",
    border: "border-[#C77700]/15",
  },
];

const SOLUTIONS = [
  {
    icon: <Eye className="h-5 w-5" />,
    title: "Catches what testing misses",
    description: "Your tests verify the migration runs. MigrateSafe asks whether it should. We analyze table sizes, lock duration, data dependencies, and rollback safety.",
  },
  {
    icon: <FileCode className="h-5 w-5" />,
    title: "Suggests the safe alternative",
    description: "Every risk comes with a concrete fix. NOT NULL without default becomes a two-step safe migration. DROP TABLE becomes a rename-to-archive pattern.",
  },
  {
    icon: <RotateCcw className="h-5 w-5" />,
    title: "Generates rollback scripts",
    description: "Every dangerous migration gets an auto-generated rollback. Know exactly how to undo the change before you deploy it.",
  },
  {
    icon: <Server className="h-5 w-5" />,
    title: "Zero-downtime rollout plans",
    description: "Step-by-step sequences that minimize lock time and avoid breaking changes. Backfill before constraint. Index concurrently. No downtime.",
  },
];

const STEPS = [
  { step: "1", icon: <GitBranch className="h-5 w-5" />, title: "Connect your repo", description: "One-click GitHub or GitLab integration. Read-only access to your migrations directory." },
  { step: "2", icon: <GitPullRequest className="h-5 w-5" />, title: "Open a PR with a migration", description: "MigrateSafe automatically detects schema changes and runs deep safety analysis." },
  { step: "3", icon: <Shield className="h-5 w-5" />, title: "Get a clear verdict", description: "Safe, Caution, or Dangerous — with plain-English explanations and concrete fixes." },
];

const COMPARISON = [
  { label: "Detects lock risks", traditional: false, migratesafe: true },
  { label: "Checks table size impact", traditional: false, migratesafe: true },
  { label: "Validates rollback safety", traditional: false, migratesafe: true },
  { label: "Suggests safe alternatives", traditional: false, migratesafe: true },
  { label: "Generates rollout plans", traditional: false, migratesafe: true },
  { label: "Blocks dangerous merges", traditional: false, migratesafe: true },
  { label: "Verifies migration runs", traditional: true, migratesafe: true },
];

function StatCard({ stat }: { stat: typeof STATISTICS[number] }) {
  return (
    <div className="text-center p-4">
      <stat.icon className="h-5 w-5 mx-auto mb-2 text-[var(--text-tertiary)]" />
      <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{stat.value}</p>
      <p className="text-xs text-[var(--text-tertiary)] mt-1">{stat.label}</p>
    </div>
  );
}

function ProblemCard({ problem, index }: { problem: typeof PROBLEMS[number]; index: number }) {
  return (
    <div className={`rounded-xl border ${problem.border} ${problem.bg} p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <span className={problem.color}>{problem.icon}</span>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{problem.title}</h3>
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{problem.description}</p>
      <div className="rounded-lg bg-[var(--bg)] border border-[var(--border)] p-3 mb-3">
        <code className="block text-xs font-mono text-[var(--text-primary)] leading-relaxed">{problem.example}</code>
      </div>
      <div className={`flex items-center gap-2 text-xs font-medium ${problem.color}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {problem.impact}
      </div>
    </div>
  );
}

function SampleReport() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-[var(--text-secondary)]">PR #482</span>
          <VerdictBadge verdict="dangerous" size="sm" />
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">order-service &middot; main</span>
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
          Add NOT NULL column to orders without default
        </p>
        <div className="rounded-lg bg-[var(--bg)] border border-[var(--border)] p-3 mb-3">
          <div className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-[#B3261E]/10 dark:bg-[#B3261E]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-3 w-3 text-[#B3261E] dark:text-[#F87171]" />
            </span>
            <div>
              <p className="text-xs font-medium text-[#B3261E] dark:text-[#F87171]">Critical — Lock Risk</p>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Adding NOT NULL to orders (4.2M rows) without a default will lock the table for 40–90 seconds
                and break all inserts from the deployed app version.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#1E7A46]/5 dark:bg-[#1E7A46]/8 rounded-lg p-3">
          <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">Suggested fix</p>
          <code className="block text-xs font-mono text-[var(--text-primary)] leading-relaxed">
            ALTER TABLE orders ADD COLUMN status VARCHAR(50);<br />
            <span className="text-[var(--text-tertiary)]">-- backfill in batches</span><br />
            ALTER TABLE orders ALTER COLUMN status SET NOT NULL;
          </code>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-brand flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">MigrateSafe</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/auth/signin" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/auth/signup" className="px-4 py-1.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#B3261E]/10 text-[#B3261E] dark:text-[#F87171]">
                  12.4% of migrations contain hidden risks
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] tracking-tight leading-[1.1] mb-5">
                Your migration tool says{" "}
                <span className="text-[#1E7A46] dark:text-[#34D27B]">&ldquo;success&rdquo;</span>
                <span className="text-[var(--text-tertiary)]">. But was it safe?</span>
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
                MigrateSafe catches breaking changes, table locks, data loss, and missing rollbacks in your
                database migrations — <strong className="text-[var(--text-primary)]">before they reach production</strong>.
                Works with your existing PR workflow.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20">
                  Start reviewing migrations free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
                  See how it works
                </a>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#1E7A46] dark:text-[#34D27B]" /> Free tier included</span>
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#1E7A46] dark:text-[#34D27B]" /> No credit card</span>
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#1E7A46] dark:text-[#34D27B]" /> 2-min setup</span>
              </div>
            </div>

            <div className="hidden lg:block">
              <SampleReport />
            </div>
          </div>
        </div>
      </section>

      {/* Problem statistics */}
      <section className="py-12 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATISTICS.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Problems section */}
      <section className="py-16 sm:py-20 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#B3261E]/10 text-[#B3261E] dark:text-[#F87171] mb-4 inline-block">
              The real-world risks
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
              These migration mistakes cause 3 AM incidents
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Every one of these has caused a production outage. Your migration tool verified the SQL was valid. Nobody checked if it was <em className="text-[var(--text-primary)]">safe</em>.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {PROBLEMS.map((problem, i) => (
              <ProblemCard key={problem.title} problem={problem} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-20 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Three steps. No pipeline changes.
            </h2>
            <p className="text-[var(--text-secondary)]">
              Works with your existing workflow. No CI/CD changes. No new dependencies.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((item) => (
              <div key={item.step}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-10 w-10 rounded-xl bg-brand text-white flex items-center justify-center text-sm font-bold">{item.step}</span>
                  <div className="text-[var(--text-tertiary)]">{item.icon}</div>
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we catch */}
      <section className="py-16 sm:py-20 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
              What MigrateSafe catches
            </h2>
            <p className="text-[var(--text-secondary)]">
              Deep analysis of every migration — not just syntax, but operational safety.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Lock className="h-5 w-5" />, title: "Table lock & downtime", desc: "Calculates actual lock duration based on table size. Flags writes that will timeout." },
              { icon: <Trash2 className="h-5 w-5" />, title: "Data loss risks", desc: "Detects DROP, TRUNCATE, and column removals. Checks for dependent views and queries." },
              { icon: <AlertTriangle className="h-5 w-5" />, title: "Breaking changes", desc: "Finds NOT NULL without default, column drops, type changes that break running code." },
              { icon: <RotateCcw className="h-5 w-5" />, title: "Missing rollbacks", desc: "Evaluates reversibility. Generates rollback scripts for every dangerous migration." },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="h-10 w-10 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] mb-3">{item.icon}</div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{item.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions section */}
      <section className="py-16 sm:py-20 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Not just alerts — actionable guidance
            </h2>
            <p className="text-[var(--text-secondary)]">
              Every finding includes a concrete fix, not just a warning label.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {SOLUTIONS.map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{item.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 sm:py-20 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Why not just run the migration?
            </h2>
            <p className="text-[var(--text-secondary)]">
              Existing tools verify a migration runs. MigrateSafe asks whether it <em>should</em>.
            </p>
          </div>
          <div className="max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="grid grid-cols-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide border-b border-[var(--border)]">
              <div className="px-5 py-3">Capability</div>
              <div className="px-5 py-3 text-center">CI/CD Pipeline</div>
              <div className="px-5 py-3 text-center text-brand">MigrateSafe</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.label} className={`grid grid-cols-3 text-sm ${i < COMPARISON.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
                <div className="px-5 py-3 text-[var(--text-primary)]">{row.label}</div>
                <div className="px-5 py-3 text-center">
                  {row.traditional ? (
                    <Check className="h-4 w-4 text-[#1E7A46] dark:text-[#34D27B] mx-auto" />
                  ) : (
                    <span className="text-[var(--text-tertiary)]">&mdash;</span>
                  )}
                </div>
                <div className="px-5 py-3 text-center">
                  <Check className="h-4 w-4 text-brand mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-12 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="flex items-start gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
              <div className="h-10 w-10 rounded-lg bg-[#1E7A46]/10 flex items-center justify-center text-[#1E7A46] dark:text-[#34D27B] flex-shrink-0">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Read-only. Always.</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  We analyze schema structure and table sizes — never your data rows. Our database connection is read-only and cannot modify or access any customer data.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
              <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand flex-shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Works with your stack</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Flyway, Liquibase, Prisma, Atlas, Django, Rails, Knex, TypeORM — whatever you use to manage migrations, MigrateSafe reviews them before deploy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-20 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 text-center">Simple, transparent pricing</h2>
          <p className="text-[var(--text-secondary)] mb-12 text-center max-w-lg mx-auto">Start free. Scale as your team grows.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { name: "Free", price: "$0", period: "forever", features: ["50 analyses/mo", "1 repo", "Community support"], cta: "Get started" },
              { name: "Pro", price: "$39", period: "/dev/mo", features: ["500 analyses/mo", "Unlimited repos", "Rollout plans", "Priority support"], cta: "Start free trial", featured: true },
              { name: "Team", price: "$149", period: "/dev/mo", features: ["2,000 analyses/mo", "Team management", "Audit log", "SSO"], cta: "Contact sales" },
              { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited", "On-prem option", "SLA", "Dedicated support"], cta: "Contact sales" },
            ].map((plan) => (
              <div key={plan.name} className={`p-5 rounded-xl border ${plan.featured ? "border-brand/30 bg-brand/5 ring-1 ring-brand/10" : "border-[var(--border)] bg-[var(--surface)]"}`}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-bold text-[var(--text-primary)]">{plan.price}</span>
                  {plan.period && <span className="text-xs text-[var(--text-tertiary)]">{plan.period}</span>}
                </div>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <Check className="h-3 w-3 text-[#1E7A46] dark:text-[#34D27B] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className={`block text-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${plan.featured ? "bg-brand text-white hover:bg-brand-dark" : "border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg)]"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Stop guessing. Start knowing.
            </h2>
            <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
              Every migration goes through a senior DBA review before it hits production.
              Free tier included. No credit card required.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20">
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Shield className="h-4 w-4" />
            <span>&copy; 2026 MigrateSafe</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[var(--text-tertiary)]">
            <span className="hover:text-[var(--text-secondary)] cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-[var(--text-secondary)] cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-[var(--text-secondary)] cursor-pointer transition-colors">Security</span>
            <span className="hover:text-[var(--text-secondary)] cursor-pointer transition-colors">Docs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return <LandingPage />;
}
