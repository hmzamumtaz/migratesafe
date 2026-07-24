import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { createCheckout, PLAN_VARIANT_IDS } from "@/lib/billing";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await request.json();
  if (!plan || !PLAN_VARIANT_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", session.userId)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const checkout = await createCheckout(PLAN_VARIANT_IDS[plan], user.email, {
      userId: session.userId,
      plan,
    });
    return NextResponse.json({ url: checkout.attributes.url });
  } catch (err) {
    console.error("Checkout creation failed:", err);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
