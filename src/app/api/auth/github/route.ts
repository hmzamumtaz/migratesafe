import { NextResponse } from "next/server";
import { getGitHubAuthURL } from "@/lib/github";
import { cookies } from "next/headers";
import { signToken } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(32).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set("gh-oauth-state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const url = getGitHubAuthURL(state);
  return NextResponse.redirect(url);
}
