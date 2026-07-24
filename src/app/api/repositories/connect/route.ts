import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, fullName, provider, defaultBranch } = body;

    if (!name || !fullName || !provider) {
      return NextResponse.json({ error: "Name, fullName, and provider are required" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("repositories")
      .select("id")
      .eq("fullName", fullName)
      .eq("userId", session.userId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Repository already connected" }, { status: 409 });
    }

    const { data: repo, error: insertError } = await supabaseAdmin
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

    if (insertError) {
      console.error("Repository insert error:", insertError);
      return NextResponse.json({ error: insertError.message || "Failed to create repository" }, { status: 500 });
    }

    if (!repo) {
      return NextResponse.json({ error: "Failed to create repository" }, { status: 500 });
    }

    await supabaseAdmin.from("audit_entries").insert({
      userId: session.userId,
      repositoryId: repo.id,
      action: "repository-connected",
      details: `Connected repository ${fullName} via ${provider}`,
    });

    return NextResponse.json({ repository: repo });
  } catch (error) {
    console.error("Connect repository error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
