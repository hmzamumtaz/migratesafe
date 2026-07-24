import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getGitHubUser, getUserEmails } from "@/lib/github";
import { supabase } from "@/lib/supabase";
import { signToken, setSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";
import { hashSync } from "bcryptjs";
import crypto from "crypto";

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

    const { data: existingByGithub } = await supabase
      .from("users")
      .select("*")
      .eq("githubId", String(ghUser.id))
      .single();

    if (existingByGithub) {
      const { data: updated } = await supabase
        .from("users")
        .update({ githubToken: token, avatar: ghUser.avatar_url })
        .eq("id", existingByGithub.id)
        .select()
        .single();
      user = updated;
    } else {
      const { data: existingByEmail } = await supabase
        .from("users")
        .select("*")
        .eq("email", primaryEmail)
        .single();

      if (existingByEmail) {
        const { data: updated } = await supabase
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
        const randomPassword = crypto.randomBytes(32).toString("hex");
        const { data: created } = await supabase
          .from("users")
          .insert({
            email: primaryEmail,
            name: ghUser.name || ghUser.login,
            password: hashSync(randomPassword, 12),
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

    const jwt = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(jwt);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    return NextResponse.redirect(new URL("/auth/signin?error=github_auth_failed", request.url));
  }
}
