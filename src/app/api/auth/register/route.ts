import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, name, role } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
    }

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const tempPassword = `ms-${Date.now()}-${Math.random().toString(36).slice(2)}!`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, role: role || "member" },
    });

    if (authError) {
      console.error("Auth user creation error:", authError);
      return NextResponse.json({ error: authError.message || "Failed to create account" }, { status: 500 });
    }

    const authUser = authData.user;

    const { error: customError } = await supabaseAdmin.from("users").insert({
      id: authUser.id,
      email: email.toLowerCase(),
      name,
      password: "",
      role: role || "member",
      emailVerified: true,
    });

    if (customError) {
      console.error("Custom user creation error:", customError);
    }

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await supabaseAdmin.from("subscriptions").insert({
      userId: authUser.id,
      plan: "free",
      analysesIncluded: 50,
      periodEnd: periodEnd.toISOString(),
    });

    return NextResponse.json({
      message: "Account created successfully.",
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
