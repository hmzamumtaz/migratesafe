import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { PLAN_LIMITS } from "@/lib/billing";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-signature");
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (secret && signature) {
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(body);
    const digest = hmac.digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = JSON.parse(body);
  const eventName = event.meta?.event_name;
  const data = event.data;

  try {
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        const attrs = data.attributes;
        const userId = attrs.custom_data?.userId;
        if (!userId) break;

        const planName = attrs.product_name?.toLowerCase().includes("team")
          ? "team"
          : attrs.product_name?.toLowerCase().includes("pro")
          ? "pro"
          : "free";

        const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.free;

        const { data: existing } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("userId", userId)
          .single();

        if (existing) {
          await supabase.from("subscriptions").update({
            plan: planName,
            lemonsqueezySubscriptionId: data.id,
            lemonsqueezyCustomerId: String(attrs.customer_id),
            periodStart: new Date().toISOString(),
            periodEnd: attrs.renew_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            analysesIncluded: limits.analyses,
            seatCount: limits.seats,
          }).eq("userId", userId);
        } else {
          await supabase.from("subscriptions").insert({
            userId,
            plan: planName,
            lemonsqueezySubscriptionId: data.id,
            lemonsqueezyCustomerId: String(attrs.customer_id),
            periodStart: new Date().toISOString(),
            periodEnd: attrs.renew_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            analysesIncluded: limits.analyses,
            seatCount: limits.seats,
          });
        }
        break;
      }

      case "subscription_deleted": {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("lemonsqueezySubscriptionId", data.id)
          .single();

        if (sub) {
          await supabase.from("subscriptions").update({
            plan: "free",
            lemonsqueezySubscriptionId: null,
            analysesIncluded: PLAN_LIMITS.free.analyses,
            seatCount: PLAN_LIMITS.free.seats,
          }).eq("id", sub.id);
        }
        break;
      }

      case "subscription_payment_success": {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("lemonsqueezySubscriptionId", data.id)
          .single();

        if (sub) {
          await supabase.from("subscriptions").update({
            periodStart: new Date().toISOString(),
            analysesUsed: 0,
          }).eq("id", sub.id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
