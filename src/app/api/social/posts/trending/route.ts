import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const POSTS_PER_PAGE = 10;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0");
    const userId = searchParams.get("userId") || "";

    // Query database directly - React Query handles client-side caching
    const supabase = createServerClient();
    const offset = page * POSTS_PER_PAGE;
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        profile:user_id (
          id,
          username,
          avatar_url,
          full_name
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + POSTS_PER_PAGE - 1);
    
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error("Error fetching trending posts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch trending posts",
        data: [],
      },
      { status: 500 }
    );
  }
}

