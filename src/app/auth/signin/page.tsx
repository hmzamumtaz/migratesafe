"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setSuccess("Verification code sent to your email");
      setStep("otp");
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
      const supabase = getSupabaseBrowser();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email",
      });

      if (verifyError) {
        setError("Invalid or expired verification code");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
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

        {step === "email" ? (
          <>
            <h1 className="text-xl font-bold text-[var(--text-primary)] text-center mb-1">Welcome back</h1>
            <p className="text-sm text-[var(--text-secondary)] text-center mb-6">Sign in to your MigrateSafe account.</p>

            {error && <div className="mb-4 px-3 py-2 rounded-lg bg-[#B3261E]/10 text-[#B3261E] dark:text-[#F87171] text-sm">{error}</div>}

            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors placeholder:text-[var(--text-tertiary)]" placeholder="you@company.com" />
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send verification code"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-[var(--text-primary)] text-center mb-1">Check your email</h1>
            <p className="text-sm text-[var(--text-secondary)] text-center mb-6">We sent a 6-digit code to <strong>{email}</strong></p>

            {success && <div className="mb-4 px-3 py-2 rounded-lg bg-[#1E7A46]/10 text-[#1E7A46] dark:text-[#34D27B] text-sm">{success}</div>}
            {error && <div className="mb-4 px-3 py-2 rounded-lg bg-[#B3261E]/10 text-[#B3261E] dark:text-[#F87171] text-sm">{error}</div>}

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Verification code</label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} required maxLength={6} className="w-full px-3 py-3 text-center text-2xl font-mono tracking-[0.3em] rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors placeholder:text-[var(--text-tertiary)] placeholder:text-base placeholder:tracking-normal placeholder:font-sans" placeholder="000000" />
              </div>
              <button type="submit" disabled={loading || otpCode.length < 6} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & sign in"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <button onClick={() => { setStep("email"); setError(""); setSuccess(""); setOtpCode(""); }} className="mt-4 w-full text-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Use a different email
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
