import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("userId", session.userId)
    .single();

  if (!sub) return NextResponse.json({ error: "No subscription" }, { status: 404 });

  return NextResponse.json({
    plan: sub.plan,
    analysesUsed: sub.analysesUsed,
    analysesIncluded: sub.analysesIncluded,
    periodStart: sub.periodStart,
    periodEnd: sub.periodEnd,
    overageRate: sub.plan === "free" ? 0 : 0.15,
  });
}
