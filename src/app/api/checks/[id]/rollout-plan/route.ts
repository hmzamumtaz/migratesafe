import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: check } = await supabase
    .from("migration_checks")
    .select("*, repository:repositories(name)")
    .eq("id", id)
    .single();

  if (!check) return NextResponse.json({ error: "Check not found" }, { status: 404 });

  const plan = {
    checkId: check.id,
    prTitle: check.prTitle,
    repository: check.repository?.name || "unknown",
    phases: [
      {
        step: 1,
        name: "Staging Validation",
        description: "Run migration against staging database and verify all tests pass",
        duration: "10-15 minutes",
        rollbackRisk: "low",
      },
      {
        step: 2,
        name: "Database Backup",
        description: "Create full database backup before applying migration",
        duration: "5-20 minutes (depending on DB size)",
        rollbackRisk: "low",
      },
      {
        step: 3,
        name: "Migration Execution",
        description: `Apply migration for PR #${check.prNumber} in a maintenance window`,
        duration: "1-5 minutes",
        rollbackRisk: check.verdict === "dangerous" ? "high" : check.verdict === "caution" ? "medium" : "low",
      },
      {
        step: 4,
        name: "Post-Migration Validation",
        description: "Verify data integrity, run smoke tests, check application health",
        duration: "5-10 minutes",
        rollbackRisk: "low",
      },
      {
        step: 5,
        name: "Monitoring Period",
        description: "Monitor error rates, latency, and database metrics for 30 minutes",
        duration: "30 minutes",
        rollbackRisk: "low",
      },
    ],
    estimatedDowntime: check.verdict === "dangerous" ? "5-15 minutes" : "1-5 minutes",
    totalDuration: "1-2 hours",
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ plan });
}
