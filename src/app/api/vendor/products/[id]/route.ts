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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getUserClient(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }
  try {
    const { data: product, error: productError } = await auth.supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("seller_id", auth.userId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { data: posts } = await auth.supabase
      .from("posts")
      .select("id, content, media_urls")
      .eq("product_id", id)
      .limit(1);

    const existingPost = posts && posts.length > 0 ? posts[0] : null;

    return NextResponse.json(
      { data: { product, existingPost } },
      { status: 200, headers: NO_CACHE }
    );
  } catch (err: unknown) {
    console.error("GET /api/vendor/products/[id] error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getUserClient(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  try {
    const supabase = auth.supabase;
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, seller_id")
      .eq("id", id)
      .single();
    if (fetchError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (product.seller_id !== auth.userId) {
      return NextResponse.json({ error: "You can only delete your own products" }, { status: 403 });
    }

    // Check if product is in any orders
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("id")
      .eq("product_id", id)
      .limit(1);

    if (orderItems && orderItems.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete product with order history. Please disable it instead.",
          canDisable: true 
        },
        { status: 400 }
      );
    }

    const { data: post } = await supabase.from("posts").select("id").eq("product_id", id).maybeSingle();
    const existingPost = post as { id: string } | null;
    const { error: productError } = await supabase.from("products").delete().eq("id", id);
    if (productError) throw productError;
    if (existingPost) {
      await supabase.from("saved_post").delete().eq("post_id", existingPost.id);
      await supabase.from("likes").delete().eq("post_id", existingPost.id);
      const { data: comments } = await supabase.from("comments").select("id").eq("post_id", existingPost.id);
      if (comments && comments.length > 0) {
        const commentIds = comments.map((c: { id: string }) => c.id);
        await supabase.from("comments").delete().in("parent_id", commentIds);
        await supabase.from("comments").delete().eq("post_id", existingPost.id);
      }
      await supabase.from("posts").delete().eq("id", existingPost.id);
    }
    return NextResponse.json({ success: true }, { status: 200, headers: NO_CACHE });
  } catch (err: unknown) {
    console.error("DELETE /api/vendor/products/[id] error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
