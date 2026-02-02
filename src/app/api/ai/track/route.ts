import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createAuthenticatedServerClient(accessToken);
    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { interaction_type, item_type, item_id, metadata } = body;

    // @ts-ignore - AI tables not in TypeScript types yet
    const { error } = await supabase.from("user_interactions").insert({
      user_id: user.id,
      interaction_type,
      item_type,
      item_id,
      metadata: metadata || {},
    });

    if (error) {
      console.error("Error tracking interaction:", error);
      return NextResponse.json({ error: "Failed to track interaction" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in track API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

