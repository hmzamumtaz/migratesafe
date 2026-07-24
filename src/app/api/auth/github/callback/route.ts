import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getGitHubUser, getUserEmails } from "@/lib/github";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/auth/signin?error=github_auth_denied`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/auth/signin?error=missing_code", request.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("gh-oauth-state")?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/auth/signin?error=invalid_state", request.url));
  }

  cookieStore.delete("gh-oauth-state");

  try {
    const token = await exchangeCodeForToken(code);
    const ghUser = await getGitHubUser(token);
    const emails = await getUserEmails(token);
    const primaryEmail = emails.find((e: any) => e.primary)?.email || ghUser.email;

    if (!primaryEmail) {
      return NextResponse.redirect(new URL("/auth/signin?error=no_email", request.url));
    }

    let user = null;

    const { data: existingByGithub } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("githubId", String(ghUser.id))
      .single();

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
        const { data: created } = await supabaseAdmin
          .from("users")
          .insert({
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
      }
    }

    if (!user) throw new Error("Failed to create/link user");

    let supabaseResponse = NextResponse.redirect(new URL("/dashboard", request.url));

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

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: primaryEmail,
    });

    if (signInError) {
      console.error("GitHub auth sign-in error:", signInError);
    }

    return supabaseResponse;
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    return NextResponse.redirect(new URL("/auth/signin?error=github_auth_failed", request.url));
  }
}
