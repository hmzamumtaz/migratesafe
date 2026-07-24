"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, GitBranch, ArrowRight, Loader2 } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification) {
          setSuccess("Verification code sent to your email");
          setStep("otp");
          setLoading(false);
          return;
        }
        setError(data.error);
        setLoading(false);
        return;
      }

      if (data.user.role === "admin" && data.user.email === "hamza.mumtaz1@gmail.com") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-lg bg-brand flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[var(--text-primary)]">MigrateSafe</span>
        </div>

        {step === "form" ? (
          <>
            <h1 className="text-xl font-bold text-[var(--text-primary)] text-center mb-1">Welcome back</h1>
            <p className="text-sm text-[var(--text-secondary)] text-center mb-6">Sign in to your MigrateSafe account.</p>

            <div className="space-y-3 mb-6">
              <button onClick={() => window.location.href = '/api/auth/github'} className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors">
                <GithubIcon className="h-4 w-4" />
                Continue with GitHub
              </button>
              <button disabled className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors opacity-50">
                <GitBranch className="h-4 w-4" />
                Continue with GitLab
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
              <div className="relative flex justify-center"><span className="bg-[var(--bg)] px-3 text-xs text-[var(--text-tertiary)]">or sign in with email</span></div>
            </div>

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
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-[var(--text-primary)] text-center mb-1">Verify your email</h1>
            <p className="text-sm text-[var(--text-secondary)] text-center mb-6">We sent a 6-digit code to <strong>{email}</strong></p>

            {success && <div className="mb-4 px-3 py-2 rounded-lg bg-[#1E7A46]/10 text-[#1E7A46] dark:text-[#34D27B] text-sm">{success}</div>}
            {error && <div className="mb-4 px-3 py-2 rounded-lg bg-[#B3261E]/10 text-[#B3261E] dark:text-[#F87171] text-sm">{error}</div>}

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Verification code</label>
                <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required maxLength={6} className="w-full px-3 py-3 text-center text-2xl font-mono tracking-[0.3em] rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors placeholder:text-[var(--text-tertiary)] placeholder:text-base placeholder:tracking-normal placeholder:font-sans" placeholder="000000" />
              </div>
              <button type="submit" disabled={loading || otpCode.length < 6} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & sign in"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <button onClick={() => { setStep("form"); setError(""); }} className="mt-4 w-full text-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Back to sign in
            </button>
          </>
        )}

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          Don&apos;t have an account? <Link href="/auth/signup" className="text-brand hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
