import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { exchangeCodeForToken, getGitHubUser, getUserEmails } from "@/lib/github";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const redirectTo = cookieStore.get("gh-oauth-redirect")?.value || "/repos";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://migratesafe.vercel.app";

  if (error) {
    return NextResponse.redirect(`${appUrl}/auth/signin?error=github_auth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/auth/signin?error=missing_code`);
  }

  const savedState = cookieStore.get("gh-oauth-state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${appUrl}/auth/signin?error=invalid_state`);
  }

  cookieStore.delete("gh-oauth-state");
  cookieStore.delete("gh-oauth-redirect");

  try {
    const token = await exchangeCodeForToken(code);
    const ghUser = await getGitHubUser(token);
    const emails = await getUserEmails(token);
    const primaryEmail = emails.find((e: any) => e.primary)?.email || ghUser.email;

    if (!primaryEmail) {
      return NextResponse.redirect(`${appUrl}/auth/signin?error=no_email`);
    }

    let userId: string;

    const { data: existingByGithub } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("githubId", String(ghUser.id))
      .single();

    if (existingByGithub) {
      userId = existingByGithub.id;
      await supabaseAdmin
        .from("users")
        .update({ githubToken: token, avatar: ghUser.avatar_url })
        .eq("id", userId);
    } else {
      const { data: existingByEmail } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", primaryEmail)
        .single();

      if (existingByEmail) {
        userId = existingByEmail.id;
        await supabaseAdmin
          .from("users")
          .update({
            githubId: String(ghUser.id),
            githubToken: token,
            name: existingByEmail.name || ghUser.name || ghUser.login,
            avatar: ghUser.avatar_url,
            emailVerified: true,
          })
          .eq("id", userId);
      } else {
        const randomPassword = `gh-${Date.now()}-${Math.random().toString(36).slice(2)}!`;
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: primaryEmail,
          password: randomPassword,
          email_confirm: true,
          user_metadata: { name: ghUser.name || ghUser.login, role: "member" },
        });

        if (authError) {
          console.error("GitHub auth user creation error:", authError);
          return NextResponse.redirect(`${appUrl}/auth/signin?error=account_creation_failed`);
        }

        userId = authData.user.id;

        await supabaseAdmin.from("users").insert({
          id: userId,
          email: primaryEmail,
          name: ghUser.name || ghUser.login,
          password: "",
          role: "member",
          emailVerified: true,
          githubId: String(ghUser.id),
          githubToken: token,
          avatar: ghUser.avatar_url,
        });

        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        await supabaseAdmin.from("subscriptions").insert({
          userId,
          plan: "free",
          analysesIncluded: 50,
          periodEnd: periodEnd.toISOString(),
        });
      }
    }

    const signInPassword = `gh-sess-${Date.now()}-${Math.random().toString(36).slice(2)}!`;
    await supabaseAdmin.auth.admin.updateUserById(userId, { password: signInPassword });

    const supabaseResponse = NextResponse.redirect(`${appUrl}${redirectTo}`);
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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: primaryEmail,
      password: signInPassword,
    });

    if (signInError) {
      console.error("GitHub session creation error:", signInError);
      return NextResponse.redirect(`${appUrl}/auth/signin?email=${encodeURIComponent(primaryEmail)}&gh=connected&redirect=${encodeURIComponent(redirectTo)}`);
    }

    return supabaseResponse;
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    return NextResponse.redirect(`${appUrl}/auth/signin?error=github_auth_failed`);
  }
}
