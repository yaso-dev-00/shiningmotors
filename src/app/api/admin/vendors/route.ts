import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getUserClient(req?: NextRequest) {
  let token: string | undefined;
  if (req) {
    token = req.headers.get("authorization")?.replace("Bearer ", "");
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

export async function GET(req: NextRequest) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // Fetch all vendor registrations
    const { data: vendors, error: vendorsError } = await auth.supabase
      .from("vendor_registrations")
      .select(`
        *,
        profiles:user_id(
          full_name,
          username,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    if (vendorsError) throw vendorsError;

    // Fetch all update requests
    const { data: updateRequests, error: requestsError } = await auth.supabase
      .from("vendor_update_requests")
      .select(`
        *,
        vendor_registration:vendor_registrations(
          business_name,
          personal_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (requestsError && requestsError.code !== "PGRST116") {
      throw requestsError;
    }

    return NextResponse.json({
      data: {
        vendors: vendors || [],
        updateRequests: updateRequests || [],
      }
    }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/admin/vendors error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
