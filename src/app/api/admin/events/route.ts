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

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

// GET - Fetch events by organizer (admin viewing their events)
export async function GET(req: NextRequest) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // Admin can see their own events
    const { data, error } = await auth.supabase
      .from("events")
      .select("*")
      .eq("organizer_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      { data: data || [] },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("GET /api/admin/events error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to fetch events" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// DELETE - Delete an event
export async function DELETE(req: NextRequest) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Verify the event belongs to the user before deleting
    const { data: event, error: fetchError } = await auth.supabase
      .from("events")
      .select("organizer_id")
      .eq("id", id)
      .single();

    if (fetchError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    if (event.organizer_id !== auth.userId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this event" },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // Delete the event
    const { error: deleteError } = await auth.supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json(
      { success: true, message: "Event deleted successfully" },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("DELETE /api/admin/events error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to delete event" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
