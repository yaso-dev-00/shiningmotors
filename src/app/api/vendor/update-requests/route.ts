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

export async function POST(req: NextRequest) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await req.json();
    const {
      vendor_registration_id,
      request_type,
      requested_changes,
      current_data,
      requested_by,
    } = body;

    if (!vendor_registration_id || !request_type || !requested_by) {
      return NextResponse.json(
        { error: "Missing required fields: vendor_registration_id, request_type, requested_by" },
        { status: 400 }
      );
    }

    const { data: reg, error: regError } = await auth.supabase
      .from("vendor_registrations")
      .select("id, user_id")
      .eq("id", vendor_registration_id)
      .single();

    if (regError || !reg) {
      return NextResponse.json({ error: "Vendor registration not found" }, { status: 404 });
    }
    if (reg.user_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await auth.supabase
      .from("vendor_update_requests")
      .insert({
        vendor_registration_id,
        request_type,
        requested_changes: requested_changes ?? {},
        current_data: current_data ?? {},
        requested_by,
      })
      .select(
        `
        *,
        vendor_registration:vendor_registrations(business_name, personal_name, email)
      `
      )
      .single();

    if (error) throw error;

    if (data?.vendor_registration) {
      try {
        await auth.supabase.functions.invoke("send-vendor-email", {
          body: {
            vendorEmail: (data.vendor_registration as { email: string }).email,
            vendorName: (data.vendor_registration as { personal_name: string }).personal_name,
            businessName: (data.vendor_registration as { business_name?: string | null }).business_name ?? undefined,
            emailType: "processing",
            requestType: data.request_type,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send processing email:", emailErr);
      }
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: unknown) {
    console.error("POST /api/vendor/update-requests error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to create update request" },
      { status: 500 }
    );
  }
}
