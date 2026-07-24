import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { analyzeMigration } from "@/lib/ai-analysis";
import { sendVerdictEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { sqlContent } = await req.json();

  if (!sqlContent) return NextResponse.json({ error: "SQL content is required" }, { status: 400 });

  const { data: check } = await supabase
    .from("migration_checks")
    .select("*, repository:repositories(*, user:users(*))")
    .eq("id", id)
    .single();

  if (!check) return NextResponse.json({ error: "Check not found" }, { status: 404 });

  await supabase.from("migration_checks").update({ status: "analyzing", sqlContent }).eq("id", id);

  const analysis = await analyzeMigration(sqlContent);

  await supabase.from("findings").delete().eq("checkId", id);

  if (analysis.findings.length > 0) {
    await supabase.from("findings").insert(
      analysis.findings.map((f) => ({ ...f, checkId: id }))
    );
  }

  await supabase.from("migration_checks").update({
    status: "complete",
    verdict: analysis.verdict,
    findingsCount: analysis.findings.length,
    aiAnalysis: analysis.summary,
    completedAt: new Date().toISOString(),
  }).eq("id", id);

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("userId", session.userId)
    .single();

  if (sub) {
    await supabase.from("subscriptions").update({
      analysesUsed: sub.analysesUsed + 1,
    }).eq("userId", session.userId);
  }

  const repo = check.repository as any;
  const user = repo?.user as any;
  if ((analysis.verdict === "dangerous" || analysis.verdict === "caution") && user) {
    sendVerdictEmail(user.email, user.name, check.prTitle, analysis.verdict, analysis.summary, repo.fullName, id).catch(console.error);
  }

  await supabase.from("audit_entries").insert({
    userId: session.userId,
    repositoryId: check.repositoryId,
    action: "verdict-issued",
    details: `${analysis.verdict.toUpperCase()} verdict on PR #${check.prNumber} "${check.prTitle}"`,
    checkId: id,
  });

  return NextResponse.json({
    verdict: analysis.verdict,
    summary: analysis.summary,
    findingsCount: analysis.findings.length,
  });
}
