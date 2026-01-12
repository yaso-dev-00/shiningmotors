import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Post ID is required" },
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

    // Get user from token - this validates the token
    let user;
    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !authUser) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired token" },
          { status: 401 }
        );
      }
      user = authUser;
    } catch (error: any) {
      // Handle token expiration/invalidation errors
      if (error?.status === 403 || error?.code === 'bad_jwt') {
        return NextResponse.json(
          { success: false, error: "Token expired. Please refresh your session." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Verify the user owns the post
    const { data: post, error: checkError } = await supabase
      .from("posts")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (checkError || !post) {
      return NextResponse.json(
        { success: false, error: "Post not found or unauthorized" },
        { status: 403 }
      );
    }

    // Delete related records first to avoid foreign key constraint violations
    // 1. Delete saved_post records
    await supabase.from("saved_post").delete().eq("post_id", id);

    // 2. Delete likes
    await supabase.from("likes").delete().eq("post_id", id);

    // 3. Delete comments and their replies
    const { data: comments } = await supabase
      .from("comments")
      .select("id")
      .eq("post_id", id);

    if (comments && comments.length > 0) {
      const commentIds = comments.map((c) => c.id);
      // Delete replies to these comments
      await supabase.from("comments").delete().in("parent_id", commentIds);
      // Delete the comments themselves
      await supabase.from("comments").delete().eq("post_id", id);
    }

    // 4. Now delete the post itself
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    // Note: We removed unstable_cache, so revalidateTag is not needed
    // React Query on client side will handle cache invalidation

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/social/posts/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete post",
      },
      { status: 500 }
    );
  }
}

