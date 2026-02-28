import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

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

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

export async function GET(req: NextRequest) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const { data, error } = await auth.supabase
      .from("sim_garages")
      .select("*, services:sim_garage_services(count)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(
      { data: data || [] },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("GET /api/vendor/sim-garages error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to fetch sim garages" },
      { status: 500 }
    );
  }
}
