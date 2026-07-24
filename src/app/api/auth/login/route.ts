import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { signToken, setSessionCookie } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rateLimit = checkRateLimit(`login:${ip}`, 5, 60000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.emailVerified) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await supabase.from("otps").insert({
        email: user.email,
        code,
        type: "verify",
        expiresAt: expiresAt.toISOString(),
      });

      const { sendOTPEmail } = await import("@/lib/email");
      await sendOTPEmail(user.email, user.name, code);

      return NextResponse.json({
        error: "Please verify your email first",
        requiresVerification: true,
        email: user.email,
      }, { status: 403 });
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    const { count } = await supabase
      .from("audit_entries")
      .select("*", { count: "exact", head: true })
      .eq("userId", user.id);

    if ((count || 0) === 0) {
      await sendWelcomeEmail(user.email, user.name);
      await supabase.from("audit_entries").insert({
        userId: user.id,
        action: "login",
        details: `${user.name} logged in for the first time`,
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
