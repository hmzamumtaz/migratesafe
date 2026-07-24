import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*, user:users(id, name, email, avatar)")
    .order("joinedAt", { ascending: false });

  const { data: currentUser } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", session.userId)
    .single();

  const members = [
    { id: session.userId, name: currentUser?.name, email: currentUser?.email, role: "admin", joinedAt: new Date() },
    ...(teamMembers || []).map((tm: any) => ({
      id: tm.user?.id,
      name: tm.user?.name,
      email: tm.user?.email,
      role: tm.role,
      joinedAt: tm.joinedAt,
    })),
  ];

  return NextResponse.json({ members });
}
