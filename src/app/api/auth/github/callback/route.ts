import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getGitHubUser, getUserEmails } from "@/lib/github";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const redirectTo = cookieStore.get("gh-oauth-redirect")?.value || "/dashboard";

  if (error) {
    return NextResponse.redirect(new URL(`/auth/signin?error=github_auth_denied`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/auth/signin?error=missing_code", request.url));
  }

  const savedState = cookieStore.get("gh-oauth-state")?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/auth/signin?error=invalid_state", request.url));
  }

  cookieStore.delete("gh-oauth-state");
  cookieStore.delete("gh-oauth-redirect");

  try {
    const token = await exchangeCodeForToken(code);
    const ghUser = await getGitHubUser(token);
    const emails = await getUserEmails(token);
    const primaryEmail = emails.find((e: any) => e.primary)?.email || ghUser.email;

    if (!primaryEmail) {
      return NextResponse.redirect(new URL("/auth/signin?error=no_email", request.url));
    }

    const { data: existingByGithub } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("githubId", String(ghUser.id))
      .single();

    let user = null;

    if (existingByGithub) {
      const { data: updated } = await supabaseAdmin
        .from("users")
        .update({ githubToken: token, avatar: ghUser.avatar_url })
        .eq("id", existingByGithub.id)
        .select()
        .single();
      user = updated;
    } else {
      const { data: existingByEmail } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", primaryEmail)
        .single();

      if (existingByEmail) {
        const { data: updated } = await supabaseAdmin
          .from("users")
          .update({
            githubId: String(ghUser.id),
            githubToken: token,
            name: existingByEmail.name || ghUser.name || ghUser.login,
            avatar: ghUser.avatar_url,
            emailVerified: true,
          })
          .eq("id", existingByEmail.id)
          .select()
          .single();
        user = updated;
      } else {
        const randomPassword = `gh-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: primaryEmail,
          password: randomPassword,
          email_confirm: true,
          user_metadata: { name: ghUser.name || ghUser.login, role: "member" },
        });

        if (authError) {
          console.error("GitHub auth user creation error:", authError);
          return NextResponse.redirect(new URL("/auth/signin?error=account_creation_failed", request.url));
        }

        const { data: created } = await supabaseAdmin
          .from("users")
          .insert({
            id: authData.user.id,
            email: primaryEmail,
            name: ghUser.name || ghUser.login,
            password: "",
            role: "member",
            emailVerified: true,
            githubId: String(ghUser.id),
            githubToken: token,
            avatar: ghUser.avatar_url,
          })
          .select()
          .single();
        user = created;

        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        await supabaseAdmin.from("subscriptions").insert({
          userId: authData.user.id,
          plan: "free",
          analysesIncluded: 50,
          periodEnd: periodEnd.toISOString(),
        });
      }
    }

    if (!user) throw new Error("Failed to create/link user");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://migratesafe.vercel.app";
    const fullRedirect = redirectTo.startsWith("http") ? redirectTo : `${appUrl}${redirectTo}`;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: primaryEmail,
      options: {
        redirectTo: fullRedirect,
      },
    });

    if (linkError || !linkData) {
      console.error("Failed to generate sign-in link:", linkError);
      return NextResponse.redirect(new URL("/auth/signin?error=session_failed", request.url));
    }

    return NextResponse.redirect(linkData.properties.action_link);
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    return NextResponse.redirect(new URL("/auth/signin?error=github_auth_failed", request.url));
  }
}
