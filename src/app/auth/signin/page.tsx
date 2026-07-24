"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, ArrowRight, Loader2, Check } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ghMessage, setGhMessage] = useState("");
  const [ghRedirect, setGhRedirect] = useState("/repos");

  useEffect(() => {
    const gh = searchParams.get("gh");
    const emailParam = searchParams.get("email");
    const redirectParam = searchParams.get("redirect");
    const errorParam = searchParams.get("error");

    if (gh === "connected" && emailParam) {
      setEmail(emailParam);
      setGhMessage("GitHub connected! Sign in with your password to continue.");
      setGhRedirect(redirectParam || "/repos");
    }

    if (errorParam) {
      const errors: Record<string, string> = {
        github_auth_denied: "GitHub authorization was denied.",
        missing_code: "Missing authorization code.",
        invalid_state: "Invalid OAuth state. Please try again.",
        no_email: "No email found from GitHub account.",
        github_auth_failed: "GitHub authentication failed.",
        account_creation_failed: "Failed to create account.",
        session_failed: "Failed to create session.",
      };
      setError(errors[errorParam] || "An error occurred.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabaseBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      router.push(ghRedirect);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <div className="h-9 w-9 rounded-lg bg-brand flex items-center justify-center">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-[var(--text-primary)]">MigrateSafe</span>
      </div>

      <h1 className="text-xl font-bold text-[var(--text-primary)] text-center mb-1">Welcome back</h1>
      <p className="text-sm text-[var(--text-secondary)] text-center mb-6">Sign in to your MigrateSafe account.</p>

      {ghMessage && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-[#1F5FAD]/10 text-brand text-sm flex items-center gap-2">
          <Check className="h-4 w-4 flex-shrink-0" />
          {ghMessage}
        </div>
      )}

      {error && <div className="mb-4 px-3 py-2 rounded-lg bg-[#B3261E]/10 text-[#B3261E] dark:text-[#F87171] text-sm">{error}</div>}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors placeholder:text-[var(--text-tertiary)]" placeholder="you@company.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors placeholder:text-[var(--text-tertiary)]" placeholder="Your password" />
        </div>
        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-tertiary)]">or</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <button onClick={() => { window.location.href = "/api/auth/github?redirect=/repos"; }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors">
        <GithubIcon className="h-4 w-4" /> Sign in with GitHub
      </button>

      <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
        Don&apos;t have an account? <Link href="/auth/signup" className="text-brand hover:underline">Sign up</Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
