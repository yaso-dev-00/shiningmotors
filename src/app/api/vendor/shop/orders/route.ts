import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getUserClient(req?: NextRequest) {
  let token: string | undefined;
  if (req) token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    try {
      const headersList = await headers();
      token = headersList.get("authorization")?.replace("Bearer ", "");
    } catch {
      // ignore
    }
  }
  const supabase = await createAuthenticatedServerClient(token);
  if (token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return { error: "Unauthorized", status: 401 } as const;
      return { supabase, userId: user.id } as const;
    } catch {
      // fall through
    }
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return { error: "Unauthorized", status: 401 } as const;
  return { supabase, userId: data.user.id } as const;
}

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

export async function GET(req: NextRequest) {
  const auth = await getUserClient(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { data: orderItems, error } = await auth.supabase
      .from("order_items")
      .select(`
        *,
        order:orders!inner(
          id,
          total,
          status,
          created_at,
          updated_at,
          user_id,
          shipping_address,
          profiles:user_id(full_name, username)
        ),
        product:products!inner(id, name, price, category, seller_id, images)
      `)
      .eq("product.seller_id", auth.userId)
      .order("created_at", { ascending: false, referencedTable: "orders" });

    if (error) throw error;

    const ordersMap = new Map<string, { order: unknown; items: unknown[] }>();
    for (const item of orderItems || []) {
      const order = (item as { order: { id: string }; product: unknown; quantity: number; price: number; id: string }).order;
      const orderId = order.id;
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, { order: (item as { order: unknown }).order, items: [] });
      }
      const rec = ordersMap.get(orderId)!;
      rec.items.push({
        id: (item as { id: string }).id,
        product: (item as { product: unknown }).product,
        quantity: (item as { quantity: number }).quantity,
        price: (item as { price: number }).price,
      });
    }
    const orders = Array.from(ordersMap.values()).map(({ order, items }) => ({ ...(order as Record<string, unknown>), items }));
    return NextResponse.json({ data: orders }, { status: 200, headers: NO_CACHE });
  } catch (err: unknown) {
    console.error("GET /api/vendor/shop/orders error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
