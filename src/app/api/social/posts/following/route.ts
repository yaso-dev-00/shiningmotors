import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const POSTS_PER_PAGE = 10;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0");
    const userId = searchParams.get("userId") || "";

    if (!userId) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Query database directly - React Query handles client-side caching
    const supabase = createServerClient();
    const offset = page * POSTS_PER_PAGE;
    
    // First get the list of users being followed
    const { data: followsData, error: followsError } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", userId);
    
    if (followsError) throw followsError;
    
    const followingIds = (followsData || []).map((follow) => follow.following_id);
    
    if (followingIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      }, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      });
    }
    
    // Then get posts from those users
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
      .in("user_id", followingIds)
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
    console.error("Error fetching following posts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch following posts",
        data: [],
      },
      { status: 500 }
    );
  }
}

