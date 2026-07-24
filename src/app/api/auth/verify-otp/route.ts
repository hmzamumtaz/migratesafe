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
    const { email, code, name, role } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.toLowerCase(),
      token: code,
      type: "email",
    });

    if (verifyError || !data.session) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    const authUser = data.user;
    if (!authUser) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
    const metaName = authUser.user_metadata?.name || name || "";
    const metaRole = authUser.user_metadata?.role || role || "member";

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, emailVerified")
      .eq("email", email.toLowerCase())
      .single();

    let appUser = existingUser;

    if (!existingUser) {
      const { data: newUser } = await supabaseAdmin
        .from("users")
        .insert({
          email: email.toLowerCase(),
          name: metaName,
          role: metaRole,
          emailVerified: true,
          password: "",
        })
        .select("id, email, name, role, emailVerified")
        .single();

      appUser = newUser;

      if (newUser) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        await supabaseAdmin.from("subscriptions").insert({
          userId: newUser.id,
          plan: "free",
          analysesIncluded: 50,
          periodEnd: periodEnd.toISOString(),
        });
      }
    } else if (!existingUser.emailVerified) {
      const { data: updated } = await supabaseAdmin
        .from("users")
        .update({ emailVerified: true })
        .eq("id", existingUser.id)
        .select("id, email, name, role, emailVerified")
        .single();
      appUser = updated;
    }

    return supabaseResponse;
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
