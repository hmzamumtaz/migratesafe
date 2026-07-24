import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { sendOTPEmail } from "@/lib/email";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rateLimit = checkRateLimit(`register:${ip}`, 3, 300000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const { email, name, password, role } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Email, name, and password are required" }, { status: 400 });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: user } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: role || "member",
      })
      .select()
      .single();

    if (!user) throw new Error("Failed to create user");

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await supabase.from("subscriptions").insert({
      userId: user.id,
      plan: "free",
      analysesIncluded: 50,
      periodEnd: periodEnd.toISOString(),
    });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await supabase.from("otps").insert({
      email: email.toLowerCase(),
      code,
      type: "verify",
      expiresAt: expiresAt.toISOString(),
    });

    await sendOTPEmail(email.toLowerCase(), name, code);

    return NextResponse.json({
      message: "Account created. Please check your email for the verification code.",
      userId: user.id,
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
