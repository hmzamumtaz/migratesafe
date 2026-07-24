import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: repo } = await supabase
    .from("repositories")
    .select("*")
    .eq("id", id)
    .eq("userId", session.userId)
    .single();

  if (!repo) return NextResponse.json({ error: "Repository not found" }, { status: 404 });

  const { dialect, host, port, database, user, schema } = await req.json();

  if (!dialect || !host || !port || !database || !user) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("database_connections")
    .select("id")
    .eq("repositoryId", id)
    .single();

  let dbConn;
  if (existing) {
    const { data } = await supabase
      .from("database_connections")
      .update({ dialect, host, port: parseInt(port), database, schemaName: schema || "public", user, status: "connected" })
      .eq("repositoryId", id)
      .select()
      .single();
    dbConn = data;
  } else {
    const { data } = await supabase
      .from("database_connections")
      .insert({ repositoryId: id, dialect, host, port: parseInt(port), database, schemaName: schema || "public", user, status: "connected" })
      .select()
      .single();
    dbConn = data;
  }

  await supabase.from("repositories").update({ dbConnected: true }).eq("id", id);

  await supabase.from("audit_entries").insert({
    userId: session.userId,
    repositoryId: id,
    action: "database-connected",
    details: `Connected read-only database (${dialect}) for ${repo.name}`,
  });

  return NextResponse.json({ connection: dbConn ? { ...dbConn, totalSizeBytes: Number(dbConn.totalSizeBytes) } : null });
}
