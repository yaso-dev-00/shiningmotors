import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";
import { headers } from "next/headers";
import { buildShopAnalytics } from "@/lib/shop-analytics-server";

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
    const analytics = await buildShopAnalytics(auth.supabase, auth.userId);
    return NextResponse.json({ data: analytics }, { status: 200, headers: NO_CACHE });
  } catch (err: unknown) {
    console.error("GET /api/vendor/shop/analytics error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to fetch shop analytics" },
      { status: 500 }
    );
  }
}
