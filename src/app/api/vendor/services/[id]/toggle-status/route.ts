import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUserClient(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const { is_disabled } = await request.json();

    if (typeof is_disabled !== "boolean") {
      return NextResponse.json(
        { error: "is_disabled must be a boolean" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: service, error: fetchError } = await auth.supabase
      .from("services")
      .select("vendor_id")
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
        { error: "You can only modify your own services" },
        { status: 403 }
      );
    }

    // Update status
    const { error: updateError } = await auth.supabase
      .from("services")
      .update({ is_disabled })
      .eq("id", id)
      .eq("vendor_id", auth.userId);

    if (updateError) {
      console.error("Error updating service status:", updateError);
      return NextResponse.json(
        { error: "Failed to update service status" },
        { status: 500 }
      );
    }

    // Revalidate cache
    revalidatePath("/vendor/service-management");
    revalidatePath("/services");

    return NextResponse.json({ 
      success: true,
      message: is_disabled ? "Service disabled successfully" : "Service enabled successfully"
    });
  } catch (error) {
    console.error("Error in toggle-status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
