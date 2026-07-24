import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: repos } = await supabase
    .from("repositories")
    .select("*, dbConnection:database_connections(*), migrationChecks:migration_checks(count)")
    .eq("userId", session.userId)
    .order("createdAt", { ascending: false });

  const serialized = (repos || []).map((r: any) => ({
    ...r,
    dbConnection: r.dbConnection
      ? { ...r.dbConnection, totalSizeBytes: Number(r.dbConnection.totalSizeBytes) }
      : null,
    _count: { migrationChecks: r.migrationChecks?.[0]?.count || 0 },
    migrationChecks: undefined,
  }));

  return NextResponse.json({ repositories: serialized });
}
