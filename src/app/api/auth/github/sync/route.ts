import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://migratesafe.vercel.app";

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/auth/signin?error=${errorDescription || error}`
    );
  }

  const supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, ...options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options as any);
          });
        },
      },
    }
  );

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("GitHub OAuth code exchange error:", exchangeError);
      return NextResponse.redirect(
        `${appUrl}/auth/signin?error=github_session_failed`
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/auth/signin?error=no_session`);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const providerToken = session?.provider_token || null;

  try {
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, githubId")
      .eq("id", user.id)
      .single();

    if (!existingUser) {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await supabaseAdmin.from("users").insert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email!.split("@")[0],
        password: "",
        role: "member",
        emailVerified: true,
        avatar: user.user_metadata?.avatar_url || null,
      });

      await supabaseAdmin.from("subscriptions").insert({
        userId: user.id,
        plan: "free",
        analysesIncluded: 50,
        periodEnd: periodEnd.toISOString(),
      });
    }

    const updateData: Record<string, any> = {};

    if (providerToken) {
      updateData.githubToken = providerToken;
    }

    if (user.user_metadata?.avatar_url) {
      updateData.avatar = user.user_metadata.avatar_url;
    }

    if (user.user_metadata?.login) {
      updateData.githubId = String(user.user_metadata.login);
    }

    if (Object.keys(updateData).length > 0) {
      await supabaseAdmin
        .from("users")
        .update(updateData)
        .eq("id", user.id);
    }
  } catch (err) {
    console.error("GitHub sync error:", err);
  }

  return NextResponse.redirect(`${appUrl}/repos`);
}
