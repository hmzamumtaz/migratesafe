import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabase
    .from("users")
    .select("githubToken")
    .eq("id", session.userId)
    .single();

  if (!user?.githubToken) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
  }

  const { getUserRepos } = await import("@/lib/github");
  try {
    const repos = await getUserRepos(user.githubToken);
    return NextResponse.json({ repos });
  } catch (err) {
    console.error("Failed to fetch GitHub repos:", err);
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 });
  }
}
