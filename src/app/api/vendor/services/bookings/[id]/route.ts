import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_STATUSES = ["pending", "confirmed", "completed", "cancelled"];

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id: idParam } = await params;
  const bookingId = idParam ? Number(idParam) : NaN;
  if (Number.isNaN(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const status = body?.status?.toLowerCase?.();
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Valid status required: pending, confirmed, completed, cancelled" },
      { status: 400 }
    );
  }
  try {
    const { data: booking, error: fetchError } = await auth.supabase
      .from("service_bookings")
      .select("id, vendor_id")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.vendor_id !== auth.userId) {
      return NextResponse.json(
        { error: "You can only update bookings for your own services" },
        { status: 403 }
      );
    }

    const { data: updated, error: updateError } = await auth.supabase
      .from("service_bookings")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating service booking:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updated, success: true });
  } catch (err: unknown) {
    console.error("PATCH /api/vendor/services/bookings/[id] error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to update booking" },
      { status: 500 }
    );
  }
}
