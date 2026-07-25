"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, ArrowRight, Loader2, Check, Mail, KeyRound } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [mode, setMode] = useState<"otp" | "password">("otp");
  const [ghRedirect, setGhRedirect] = useState("/repos");

  useEffect(() => {
    const gh = searchParams.get("gh");
    const emailParam = searchParams.get("email");
    const redirectParam = searchParams.get("redirect");
    const errorParam = searchParams.get("error");
    const otpSentParam = searchParams.get("otp_sent");

    if (emailParam) setEmail(emailParam);
    if (redirectParam) setGhRedirect(redirectParam);

    if (gh === "connected" && emailParam) {
      setSuccess("GitHub connected! Enter the verification code sent to your email to sign in.");
      setMode("otp");
      setOtpSent(true);
    }

    if (otpSentParam === "true" && emailParam) {
      setSuccess("Verification code sent! Check your inbox and enter the code below.");
      setMode("otp");
      setOtpSent(true);
    }

    if (errorParam) {
      const errors: Record<string, string> = {
        github_auth_denied: "GitHub authorization was denied.",
        missing_code: "Missing authorization code.",
        invalid_state: "Invalid OAuth state. Please try again.",
        no_email: "No email found from GitHub account.",
        github_auth_failed: "GitHub authentication failed.",
        account_creation_failed: "Failed to create account.",
        session_creation_failed: "Failed to create session. Please try signing in with email.",
      };
      setError(errors[errorParam] || "An error occurred.");
    }
  }, [searchParams]);

  const sendOtp = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const supabase = getSupabaseBrowser();
      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) {
        setError(otpError.message || "Failed to send verification code. Try again in a few minutes.");
      } else {
        setOtpSent(true);
        setSuccess("Verification code sent! Check your inbox.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseBrowser();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (verifyError) {
        setError("Invalid or expired code. Please try again.");
      } else {
        router.push(ghRedirect);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("Invalid email or password");
      } else {
        router.push(ghRedirect);
        router.refresh();
      }
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

      {success && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-[#1E7A46]/10 text-[#1E7A46] dark:text-[#34D27B] text-sm flex items-center gap-2">
          <Check className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && <div className="mb-4 px-3 py-2 rounded-lg bg-[#B3261E]/10 text-[#B3261E] dark:text-[#F87171] text-sm">{error}</div>}

      <div className="flex gap-2 mb-4">
        <button onClick={() => { setMode("otp"); setError(""); }} className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${mode === "otp" ? "bg-brand text-white" : "bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
          <Mail className="h-4 w-4 inline mr-1.5" /> Email code
        </button>
        <button onClick={() => { setMode("password"); setError(""); }} className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${mode === "password" ? "bg-brand text-white" : "bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
          <KeyRound className="h-4 w-4 inline mr-1.5" /> Password
        </button>
      </div>

      {mode === "otp" ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={otpSent} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors placeholder:text-[var(--text-tertiary)] disabled:opacity-50" placeholder="you@company.com" />
          </div>
          {!otpSent ? (
            <button onClick={sendOtp} disabled={loading || !email} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send verification code
            </button>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Verification code</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors placeholder:text-[var(--text-tertiary)] text-center text-lg tracking-[0.5em] font-mono" placeholder="000000" autoFocus />
              </div>
              <button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
              <button onClick={() => { setOtpSent(false); setOtp(""); setSuccess(""); }} className="w-full text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                Use a different email
              </button>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
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
      )}

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-tertiary)]">or</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <button onClick={async () => {
        setLoading(true);
        setError("");
        try {
          const supabase = getSupabaseBrowser();
          const { error: ghError } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
              redirectTo: `${window.location.origin}/api/auth/github/sync`,
            },
          });
          if (ghError) setError(ghError.message);
        } catch {
          setError("Failed to start GitHub sign-in.");
        }
        setLoading(false);
      }} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GithubIcon className="h-4 w-4" />} Sign in with GitHub
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
