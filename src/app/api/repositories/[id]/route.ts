import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const { data: repo } = await supabase
    .from("repositories")
    .select("id, userId")
    .eq("id", id)
    .single();

  if (!repo) return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  if (repo.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allowed = ["name", "fullName", "defaultBranch", "checksEnabled", "blockOnDanger"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("repositories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("audit_entries").insert({
    userId: session.userId,
    repositoryId: id,
    action: "repository-updated",
    details: `Updated repository: ${Object.keys(updates).join(", ")}`,
  });

  return NextResponse.json({ repository: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: repo } = await supabase
    .from("repositories")
    .select("id, userId, fullName")
    .eq("id", id)
    .single();

  if (!repo) return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  if (repo.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await supabase.from("findings").delete().in("checkId",
    (await supabase.from("migration_checks").select("id").eq("repositoryId", id)).data?.map((c: any) => c.id) || []
  );
  await supabase.from("audit_entries").delete().eq("repositoryId", id);
  await supabase.from("migration_checks").delete().eq("repositoryId", id);
  await supabase.from("database_connections").delete().eq("repositoryId", id);
  await supabase.from("repositories").delete().eq("id", id);

  await supabase.from("audit_entries").insert({
    userId: session.userId,
    repositoryId: null,
    action: "repository-deleted",
    details: `Deleted repository ${repo.fullName}`,
  });

  return NextResponse.json({ success: true });
}
