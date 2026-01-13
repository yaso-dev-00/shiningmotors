import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type CartPayload =
  | { product_id: string; quantity?: number }
  | { itemId: string; quantity?: number }
  | { clearAll: true };

async function getUserClient(req?: NextRequest) {
  // Try to get token from Authorization header first (more reliable)
  let token: string | undefined;
  
  // Try from request headers first
  if (req) {
    const authHeader = req.headers.get("authorization");
    token = authHeader?.replace("Bearer ", "");
  }
  
  // If no token in request, try to get from Next.js headers
  if (!token) {
    try {
      const headersList = await headers();
      const authHeader = headersList.get("authorization");
      token = authHeader?.replace("Bearer ", "");
    } catch (e) {
      // Headers might not be available in all contexts
    }
  }
  
  // Create authenticated client with token (or it will try cookies)
  const supabase = await createAuthenticatedServerClient(token);
  
  // Verify user - if we have a token, use it directly
  if (token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return { error: "Unauthorized", status: 401 } as const;
      }
      return { supabase, userId: user.id } as const;
    } catch (e) {
      // If token validation fails, fall through to cookie-based auth
    }
  }
  
  // Fallback to session-based auth (cookies)
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return { error: "Unauthorized", status: 401 } as const;
  }
  return { supabase, userId: data.user.id } as const;
}

async function fetchCartWithProducts(supabase: Awaited<ReturnType<typeof createAuthenticatedServerClient>>, userId: string) {

  const { data: cartRows, error } = await supabase
    .from("cart_items")
    .select("id, product_id, quantity, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const items = cartRows ?? [];

  // Collect unique product ids
  const ids = Array.from(new Set(items.map((i) => i.product_id).filter(Boolean)));
  let productsMap: Record<string, any> = {};
  let simProductsMap: Record<string, any> = {};

  if (ids.length > 0) {
    // Fetch shop products
    const { data: products } = await supabase.from("products").select("*").in("id", ids);
    if (products) {
      for (const p of products) productsMap[p.id] = p;
    }

    // Fetch sim products
    const { data: simProducts } = await supabase.from("sim_products").select("*").in("id", ids);
    if (simProducts) {
      for (const p of simProducts) simProductsMap[p.id] = p;
    }
  }

  // Attach product details if available
  return items.map((item) => {
    const product = productsMap[item.product_id];
    const sim_product = simProductsMap[item.product_id];
    return { ...item, product, sim_product };
  });
}

export async function GET(req?: NextRequest) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await fetchCartWithProducts(auth.supabase, auth.userId);
    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as CartPayload;
    const productId = "product_id" in body ? body.product_id : null;
    const quantity = Math.max(1, ("quantity" in body && body.quantity) || 1);

    if (!productId) {
      return NextResponse.json({ error: "product_id is required" }, { status: 400 });
    }

    const supabase = await auth.supabase;
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", auth.userId)
      .eq("product_id", productId)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from("cart_items")
        .update({ quantity: (existing.quantity || 0) + quantity })
        .eq("id", existing.id)
        .eq("user_id", auth.userId);
    } else {
      await supabase
        .from("cart_items")
        .insert({ user_id: auth.userId, product_id: productId, quantity })
        .select()
        .single();
    }

    const data = await fetchCartWithProducts(auth.supabase, auth.userId);
    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json({ error: error?.message || "Failed to add to cart" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as CartPayload;
    if (!("itemId" in body) || body.quantity === undefined) {
      return NextResponse.json({ error: "itemId and quantity are required" }, { status: 400 });
    }

    const qty = Math.max(0, body.quantity || 0);
    const supabase = await auth.supabase;

    if (qty === 0) {
      await supabase.from("cart_items").delete().eq("id", body.itemId).eq("user_id", auth.userId);
    } else {
      await supabase
        .from("cart_items")
        .update({ quantity: qty })
        .eq("id", body.itemId)
        .eq("user_id", auth.userId);
    }

    const data = await fetchCartWithProducts(auth.supabase, auth.userId);
    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("PATCH /api/cart error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as CartPayload | undefined;
    const supabase = await auth.supabase;

    if (body && "itemId" in body && body.itemId) {
      await supabase.from("cart_items").delete().eq("id", body.itemId).eq("user_id", auth.userId);
    } else {
      await supabase.from("cart_items").delete().eq("user_id", auth.userId);
    }

    const data = await fetchCartWithProducts(auth.supabase, auth.userId);
    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("DELETE /api/cart error:", error);
    return NextResponse.json({ error: error?.message || "Failed to remove from cart" }, { status: 500 });
  }
}

