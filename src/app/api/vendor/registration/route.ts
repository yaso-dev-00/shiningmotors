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
    const { data: regRows, error: regError } = await auth.supabase
      .from("vendor_registrations")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (regError) throw regError;

    const registration = regRows && regRows.length > 0 ? regRows[0] : null;

    if (!registration) {
      return NextResponse.json(
        { data: { registration: null, updateRequests: [] } },
        { status: 200 }
      );
    }

    const { data: updateRequests, error: reqError } = await auth.supabase
      .from("vendor_update_requests")
      .select("*")
      .eq("vendor_registration_id", registration.id)
      .order("created_at", { ascending: false });

    if (reqError) throw reqError;

    return NextResponse.json(
      { data: { registration, updateRequests: updateRequests || [] } },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("GET /api/vendor/registration error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to fetch registration" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await getUserClient(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  
  try {
    const body = await req.json();
    
    const { data, error } = await auth.supabase
      .from("vendor_registrations")
      .insert({
        user_id: auth.userId,
        personal_name: body.personal_name,
        mobile: body.mobile,
        email: body.email,
        whatsapp_number: body.whatsapp_number || null,
        categories: body.categories,
        category_specific_details: body.category_specific_details,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        step: "1",
      })
      .select()
      .single();

    if (error) throw error;

    // Send email notification via Supabase Edge Function (non-blocking)
    try {
      await auth.supabase.functions.invoke("send-vendor-email", {
        body: {
          vendorEmail: body.email,
          vendorName: body.personal_name,
          businessName: "not verified",
          emailType: 'step one',
          requestType: "registration",
        },
      });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: unknown) {
    console.error("POST /api/vendor/registration error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to create registration" },
      { status: 500 }
    );
  }
}
