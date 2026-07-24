import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: check } = await supabase
    .from("migration_checks")
    .select("*, repository:repositories(name, fullName)")
    .eq("id", id)
    .single();

  if (!check) return NextResponse.json({ error: "Check not found" }, { status: 404 });

  return NextResponse.json({ check });
}
