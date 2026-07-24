const LEMON_SQUEEZY_API = "https://api.lemonsqueezy.com/v1";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export interface LemonSqueezyCheckout {
  id: string;
  attributes: {
    url: string;
    status: string;
  };
}

export interface LemonSqueezySubscription {
  id: string;
  attributes: {
    status: string;
    renews_at: string | null;
    ends_at: string | null;
    created_at: string;
    updated_at: string;
    product_name: string;
    variant_name: string;
    card_brand: string | null;
    card_last_four: string | null;
  };
}

export async function createCheckout(
  variantId: number,
  email: string,
  customData: Record<string, any> = {}
): Promise<LemonSqueezyCheckout> {
  const res = await fetch(`${LEMON_SQUEEZY_API}/checkouts`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email,
            custom: customData,
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: String(process.env.LEMON_SQUEEZY_STORE_ID || "1") } },
          variant: { data: { type: "variants", id: String(variantId) } },
        },
      },
    }),
  });

  const data = await res.json();
  if (data.errors) throw new Error(data.errors.map((e: any) => e.detail).join(", "));
  return data.data;
}

export async function getSubscription(subscriptionId: string): Promise<LemonSqueezySubscription> {
  const res = await fetch(`${LEMON_SQUEEZY_API}/subscriptions/${subscriptionId}`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (data.errors) throw new Error(data.errors.map((e: any) => e.detail).join(", "));
  return data.data;
}

export async function cancelSubscription(subscriptionId: string): Promise<LemonSqueezySubscription> {
  const res = await fetch(`${LEMON_SQUEEZY_API}/subscriptions/${subscriptionId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  const data = await res.json();
  if (data.errors) throw new Error(data.errors.map((e: any) => e.detail).join(", "));
  return data.data;
}

export async function updateSubscription(
  subscriptionId: string,
  variantId: number
): Promise<LemonSqueezySubscription> {
  const res = await fetch(`${LEMON_SQUEEZY_API}/subscriptions/${subscriptionId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({
      data: {
        type: "subscriptions",
        id: subscriptionId,
        attributes: {
          variant_id: variantId,
        },
      },
    }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(data.errors.map((e: any) => e.detail).join(", "));
  return data.data;
}

export function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const digest = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export const PLAN_LIMITS: Record<string, { analyses: number; seats: number }> = {
  free: { analyses: 50, seats: 1 },
  pro: { analyses: 200, seats: 1 },
  team: { analyses: 1000, seats: 5 },
  enterprise: { analyses: 999999, seats: 999 },
};

export const PLAN_VARIANT_IDS: Record<string, number> = {
  pro: Number(process.env.LEMON_SQUEEZY_PRO_VARIANT_ID || 0),
  team: Number(process.env.LEMON_SQUEEZY_TEAM_VARIANT_ID || 0),
};
