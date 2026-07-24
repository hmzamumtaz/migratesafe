"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, GitBranch, Database, Check, ArrowRight, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const STEPS = ["Connect Repository", "Connect Database", "Enable Checks", "All Set"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoFullName, setRepoFullName] = useState("");
  const [provider, setProvider] = useState("github");
  const [repoId, setRepoId] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<"idle" | "testing" | "connected" | "error">("idle");
  const [dbConfig, setDbConfig] = useState({ host: "", port: "5432", database: "", user: "", dialect: "postgres" });
  const [checksEnabled, setChecksEnabled] = useState(true);
  const [blockDangerous, setBlockDangerous] = useState(true);

  const handleConnectRepo = async () => {
    setRepoLoading(true);
    try {
      const res = await fetch("/api/repositories/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: repoName || "my-app", fullName: repoFullName || "acme-corp/my-app", provider }),
      });
      const data = await res.json();
      if (data.repository) {
        setRepoId(data.repository.id);
        setStep(1);
      }
    } catch { /* empty */ }
    setRepoLoading(false);
  };

  const handleConnectDb = async () => {
    setDbStatus("testing");
    try {
      const res = await fetch(`/api/repositories/${repoId}/database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dialect: dbConfig.dialect, host: dbConfig.host, port: dbConfig.port, database: dbConfig.database, user: dbConfig.user }),
      });
      if (res.ok) setDbStatus("connected");
      else setDbStatus("error");
    } catch { setDbStatus("error"); }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-brand flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">MigrateSafe</span>
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Set up MigrateSafe</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">Connect your repository and database to start reviewing migrations.</p>

        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${i < step ? "bg-[#1E7A46] text-white" : i === step ? "bg-brand text-white" : "bg-[var(--border)] text-[var(--text-tertiary)]"}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < step ? "bg-[#1E7A46]" : "bg-[var(--border)]"}`} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4 animate-slide-in">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connect your repository</h2>
            <p className="text-sm text-[var(--text-secondary)]">We need read-only access to detect migration files in your PRs.</p>
            <div className="space-y-3">
              <button onClick={() => { setProvider("github"); handleConnectRepo(); }} disabled={repoLoading} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors disabled:opacity-50">
                {repoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GithubIcon className="h-4 w-4" />}
                {repoLoading ? "Connecting..." : "Connect with GitHub"}
              </button>
              <button onClick={() => { setProvider("gitlab"); handleConnectRepo(); }} disabled={repoLoading} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors disabled:opacity-50">
                {repoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
                {repoLoading ? "Connecting..." : "Connect with GitLab"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Repository name</label>
                <input value={repoName} onChange={(e) => setRepoName(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="my-app" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Full name (owner/repo)</label>
                <input value={repoFullName} onChange={(e) => setRepoFullName(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="acme-corp/my-app" />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-slide-in">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connect database (read-only)</h2>
            <div className="p-4 rounded-lg border border-[#1E7A46]/30 bg-[#1E7A46]/5">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#1E7A46] dark:text-[#34D27B] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Read-only connection</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">MigrateSafe uses a read-only connection and only reads your schema structure and table sizes — never your data rows.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Host</label>
                <input value={dbConfig.host} onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="db.example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Port</label>
                <input value={dbConfig.port} onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="5432" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Database</label>
              <input value={dbConfig.database} onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="acme_production" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">User</label>
                <input value={dbConfig.user} onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-[var(--text-tertiary)]" placeholder="readonly_user" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Dialect</label>
                <select value={dbConfig.dialect} onChange={(e) => setDbConfig({ ...dbConfig, dialect: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleConnectDb} disabled={dbStatus === "testing"} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                {dbStatus === "testing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                {dbStatus === "testing" ? "Testing connection..." : "Test & connect"}
              </button>
              <button onClick={() => setStep(2)} className="px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors">
                Skip
              </button>
            </div>
            {dbStatus === "connected" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1E7A46]/10 text-[#1E7A46] dark:text-[#34D27B] text-sm animate-slide-in">
                <Check className="h-4 w-4" /> Connected successfully
              </div>
            )}
            {dbStatus === "error" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#B3261E]/10 text-[#B3261E] dark:text-[#F87171] text-sm animate-slide-in">
                <AlertTriangle className="h-4 w-4" /> Connection failed — check your credentials
              </div>
            )}
            {dbStatus === "connected" && (
              <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-slide-in">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Enable migration checks</h2>
            <p className="text-sm text-[var(--text-secondary)]">Choose which PRs get analyzed and how strict the checks are.</p>
            <div className="space-y-3">
              <button onClick={() => setChecksEnabled(!checksEnabled)} className="w-full flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg)] transition-colors">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Enable automatic checks</p>
                  <p className="text-xs text-[var(--text-secondary)]">Analyze every PR that modifies migration files</p>
                </div>
                <div className={`h-5 w-9 rounded-full relative cursor-pointer transition-colors ${checksEnabled ? "bg-brand" : "bg-[var(--border)]"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white absolute top-0.5 transition-all ${checksEnabled ? "right-0.5" : "left-0.5"}`} />
                </div>
              </button>
              <button onClick={() => setBlockDangerous(!blockDangerous)} className="w-full flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg)] transition-colors">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Block merge on Dangerous</p>
                  <p className="text-xs text-[var(--text-secondary)]">Require override before merging PRs with a Dangerous verdict</p>
                </div>
                <div className={`h-5 w-9 rounded-full relative cursor-pointer transition-colors ${blockDangerous ? "bg-brand" : "bg-[var(--border)]"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white absolute top-0.5 transition-all ${blockDangerous ? "right-0.5" : "left-0.5"}`} />
                </div>
              </button>
            </div>
            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
              Save & continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8 animate-slide-in">
            <div className="h-16 w-16 rounded-2xl bg-[#1E7A46]/10 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-[#1E7A46] dark:text-[#34D27B]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">You&apos;re protected.</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-sm mx-auto">
              MigrateSafe will review every migration in your connected repositories. Open a PR with a migration to see your first report.
            </p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {step > 0 && step < 3 && (
          <button onClick={() => setStep(step - 1)} className="mt-6 flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}
      </div>
    </div>
  );
}
