import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      content,
      media_urls,
      category,
      tags,
      location,
      user_tag,
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get auth token from headers
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create authenticated Supabase client
    const supabase = await createAuthenticatedServerClient(token);

    // Verify token is valid by getting user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Verify user_id matches authenticated user
    if (authUser.id !== user_id) {
      return NextResponse.json(
        { success: false, error: "User ID mismatch" },
        { status: 403 }
      );
    }

    // Insert the post
    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id,
        content,
        media_urls,
        category,
        tags,
        location,
        user_tag,
      })
      .select("*, profile:user_id(id, avatar_url, username, full_name)")
      .single();

    if (error) {
      console.error("Error creating post:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Revalidate paths to ensure fresh data on next request
    // Note: We removed unstable_cache, so revalidateTag is not needed
    // React Query on client side will handle caching

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error in POST /api/social/posts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create post",
      },
      { status: 500 }
    );
  }
}

