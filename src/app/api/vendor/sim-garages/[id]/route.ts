import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getUserClient(req?: NextRequest) {
  let token: string | undefined;
  if (req) token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    try {
      const h = await headers();
      token = h.get("authorization")?.replace("Bearer ", "");
    } catch {}
  }
  const supabase = await createAuthenticatedServerClient(token);
  if (token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return { error: "Unauthorized", status: 401 } as const;
      return { supabase, userId: user.id } as const;
    } catch {}
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
  if (!id) return NextResponse.json({ error: "Garage ID required" }, { status: 400 });
  try {
    const { data, error } = await auth.supabase
      .from("sim_garages")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Garage not found" }, { status: 404 });
    return NextResponse.json(data, { status: 200, headers: NO_CACHE });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: (e as Error)?.message || "Failed to fetch garage" },
      { status: 500, headers: NO_CACHE }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getUserClient(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Garage ID required" }, { status: 400 });
  try {
    const { error } = await auth.supabase.from("sim_garages").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200, headers: NO_CACHE });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: (e as Error)?.message || "Failed to delete garage" },
      { status: 500 }
    );
  }
}
