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

const NO_CACHE = { "Cache-Control": "no-store", Pragma: "no-cache", Expires: "0" };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getUserClient(_req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Service ID required" }, { status: 400 });
  try {
    const { data, error } = await auth.supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    return NextResponse.json(data, { status: 200, headers: NO_CACHE });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: (e as Error)?.message || "Failed to fetch service" },
      { status: 500, headers: NO_CACHE }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Service ID required" }, { status: 400 });
  }
  try {
    const supabase = auth.supabase;
    const { data: service, error: fetchError } = await supabase
      .from("services")
      .select("id, vendor_id")
      .eq("id", id)
      .single();

    if (fetchError || !service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    if (service.vendor_id !== auth.userId) {
      return NextResponse.json(
        { error: "You can only delete your own services" },
        { status: 403 }
      );
    }

    // Check for any bookings (completed or not)
    const { data: bookings, error: countError } = await supabase
      .from("service_bookings")
      .select("id, status")
      .eq("service_id", id)
      .limit(1);

    if (countError) {
      console.error("Error checking service bookings:", countError);
      return NextResponse.json(
        { error: "Failed to check bookings" },
        { status: 500 }
      );
    }

    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete service with booking history. Please disable it instead.",
          canDisable: true 
        },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting service:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete service" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("DELETE /api/vendor/services/[id] error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to delete service" },
      { status: 500 }
    );
  }
}
