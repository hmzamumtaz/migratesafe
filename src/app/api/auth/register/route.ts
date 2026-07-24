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
    const { email, name, role } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
    }

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        data: { name, role: role || "member" },
      },
    });

    if (otpError) {
      console.error("OTP send error:", otpError);
      return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Verification code sent to your email",
      email: email.toLowerCase(),
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
