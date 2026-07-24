import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, fullName, provider, defaultBranch } = await req.json();

  if (!name || !fullName || !provider) {
    return NextResponse.json({ error: "Name, fullName, and provider are required" }, { status: 400 });
  }

  const { data: repo } = await supabase
    .from("repositories")
    .insert({
      name,
      fullName,
      provider,
      defaultBranch: defaultBranch || "main",
      userId: session.userId,
    })
    .select()
    .single();

  if (!repo) throw new Error("Failed to create repository");

  await supabase.from("audit_entries").insert({
    userId: session.userId,
    repositoryId: repo.id,
    action: "repository-connected",
    details: `Connected repository ${fullName} via ${provider}`,
  });

  return NextResponse.json({ repository: repo });
}
