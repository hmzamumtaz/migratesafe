import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { reason } = await req.json();

  if (!reason) return NextResponse.json({ error: "Reason is required" }, { status: 400 });

  const { data: check } = await supabase
    .from("migration_checks")
    .select("*, repository:repositories(*)")
    .eq("id", id)
    .single();

  if (!check) return NextResponse.json({ error: "Check not found" }, { status: 404 });

  await supabase.from("migration_checks").update({
    verdict: "safe",
    aiAnalysis: `Overridden by ${session.name}: ${reason}`,
  }).eq("id", id);

  await supabase.from("audit_entries").insert({
    userId: session.userId,
    repositoryId: check.repositoryId,
    action: "verdict-overridden",
    details: `Overrode verdict on PR #${check.prNumber} "${check.prTitle}" — Reason: "${reason}"`,
    checkId: id,
  });

  return NextResponse.json({ message: "Verdict overridden" });
}
