import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { generateRollbackScript } from "@/lib/ai-analysis";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: check } = await supabase
    .from("migration_checks")
    .select("sqlContent")
    .eq("id", id)
    .single();

  if (!check?.sqlContent) return NextResponse.json({ error: "Rollback not available" }, { status: 404 });

  const rollback = generateRollbackScript(check.sqlContent);
  return NextResponse.json({ rollback: { ...rollback, checkId: id } });
}
