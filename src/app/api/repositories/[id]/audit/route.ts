import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: entries } = await supabase
    .from("audit_entries")
    .select("*, user:users(name)")
    .eq("repositoryId", id)
    .order("createdAt", { ascending: false });

  return NextResponse.json({ entries: entries || [] });
}
