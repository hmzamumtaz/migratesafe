import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { data: checks } = await supabase
    .from("migration_checks")
    .select("*")
    .eq("repositoryId", id)
    .order("createdAt", { ascending: false });

  return NextResponse.json({ checks: checks || [] });
}
