import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let supabaseResponse = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, ...options }) => {
            req.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options as any);
          });
        },
      },
    }
  );

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
    });

    if (otpError) {
      console.error("OTP send error:", otpError);
      return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Verification code sent to your email",
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
