import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, avatar, githubId, createdAt")
      .eq("id", session.userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email } = body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined && email !== session.email) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
        session.userId,
        { email }
      );
      if (emailError) {
        return NextResponse.json({ error: "Failed to update email: " + emailError.message }, { status: 500 });
      }
      updates.email = email.toLowerCase();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", session.userId)
      .select("id, email, name, role, avatar, githubId, createdAt")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    const { data: repos } = await supabaseAdmin
      .from("repositories")
      .select("id")
      .eq("userId", userId);

    const repoIds = repos?.map((r: any) => r.id) || [];

    if (repoIds.length > 0) {
      const { data: checks } = await supabaseAdmin
        .from("migration_checks")
        .select("id")
        .in("repositoryId", repoIds);

      const checkIds = checks?.map((c: any) => c.id) || [];

      if (checkIds.length > 0) {
        await supabaseAdmin.from("findings").delete().in("checkId", checkIds);
      }

      await supabaseAdmin.from("audit_entries").delete().in("repositoryId", repoIds);
      await supabaseAdmin.from("database_connections").delete().in("repositoryId", repoIds);
      await supabaseAdmin.from("migration_checks").delete().in("repositoryId", repoIds);
      await supabaseAdmin.from("repositories").delete().in("id", repoIds);
    }

    await supabaseAdmin.from("team_members").delete().eq("userId", userId);
    await supabaseAdmin.from("team_members").delete().eq("invitedBy", userId);
    await supabaseAdmin.from("subscriptions").delete().eq("userId", userId);
    await supabaseAdmin.from("audit_entries").delete().eq("userId", userId);
    await supabaseAdmin.from("users").delete().eq("id", userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
