import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getUserClient(req?: NextRequest) {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get("authorization");
    token = authHeader?.replace("Bearer ", "");
  }

  if (!token) {
    try {
      const headersList = await headers();
      const authHeader = headersList.get("authorization");
      token = authHeader?.replace("Bearer ", "");
    } catch {
      // ignore
    }
  }

  const supabase = await createAuthenticatedServerClient(token);

  if (token) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) {
        return { error: "Unauthorized", status: 401 } as const;
      }
      return { supabase, userId: user.id } as const;
    } catch {
      // fall through
    }
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return { error: "Unauthorized", status: 401 } as const;
  }
  return { supabase, userId: data.user.id } as const;
}

export async function GET(req: NextRequest) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const supabase = await auth.supabase;
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("seller_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      { data: data || [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/vendor/vehicles error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}
