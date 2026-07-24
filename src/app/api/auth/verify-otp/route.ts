import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { signToken, setSessionCookie } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const { data: otp } = await supabase
      .from("otps")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .eq("type", "verify")
      .eq("used", false)
      .gt("expiresAt", new Date().toISOString())
      .order("createdAt", { ascending: false })
      .limit(1)
      .single();

    if (!otp) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    await supabase.from("otps").update({ used: true }).eq("id", otp.id);

    const { data: user } = await supabase
      .from("users")
      .update({ emailVerified: true })
      .eq("email", email.toLowerCase())
      .select()
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);
    await sendWelcomeEmail(user.email, user.name);

    await supabase.from("audit_entries").insert({
      userId: user.id,
      action: "email-verified",
      details: `${user.name} verified their email address`,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
