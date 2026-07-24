import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("lemonsqueezySubscriptionId")
    .eq("userId", session.userId)
    .single();

  if (!subscription?.lemonsqueezySubscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.lemonsqueezySubscriptionId}/manage`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json();
    if (data.errors) throw new Error(data.errors.map((e: any) => e.detail).join(", "));
    return NextResponse.json({ url: data.data?.attributes?.urls?.update_payment_method });
  } catch (err) {
    console.error("Portal creation failed:", err);
    return NextResponse.json({ error: "Failed to open portal" }, { status: 500 });
  }
}
