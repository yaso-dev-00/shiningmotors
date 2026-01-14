import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

async function getUserClient(req?: NextRequest) {
  // Try to get token from Authorization header first
  let token: string | undefined;
  
  if (req) {
    const authHeader = req.headers.get("authorization");
    token = authHeader?.replace("Bearer ", "");
  }
  
  // If no token in request, try to get from Next.js headers
  if (!token) {
    try {
      const headersList = await headers();
      const authHeader = headersList.get("authorization");
      token = authHeader?.replace("Bearer ", "");
    } catch (e) {
      // Headers might not be available in all contexts
    }
  }
  
  // Create authenticated client with token
  const supabase = await createAuthenticatedServerClient(token);
  
  // Verify user
  if (token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return { error: "Unauthorized", status: 401 } as const;
      }
      return { supabase, userId: user.id } as const;
    } catch (e) {
      // If token validation fails, fall through to cookie-based auth
    }
  }
  
  // Fallback to session-based auth (cookies)
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return { error: "Unauthorized", status: 401 } as const;
  }
  return { supabase, userId: data.user.id } as const;
}

// DELETE: Delete a specific message
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUserClient(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase, userId } = auth;
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    // First, verify the user owns the message
    const { data: message, error: fetchError } = await supabase
      .from("messages")
      .select("id, sender_id, content, message_type")
      .eq("id", id)
      .single();

    if (fetchError || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Message not found",
        },
        { status: 404 }
      );
    }

    // Verify the user is the sender
    if (message.sender_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: You can only delete your own messages",
        },
        { status: 403 }
      );
    }

    // If it's a media message, delete from storage
    if (["image", "video"].includes(message.message_type || "")) {
      const publicUrl = message.content;
      if (publicUrl) {
        try {
          const urlParts = publicUrl.split("/");
          const folder = "message-media";
          const filePathIndex = urlParts.findIndex((part) => part === folder);
          
          if (filePathIndex !== -1) {
            const filePath = urlParts.slice(filePathIndex + 1).join("/");
            await supabase.storage.from(folder).remove([filePath]);
          }
        } catch (storageError) {
          // Log but don't fail the request if storage deletion fails
          console.error("Error deleting media from storage:", storageError);
        }
      }
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from("messages")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting message:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: deleteError.message || "Failed to delete message",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/messenger/messages/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete message",
      },
      { status: 500 }
    );
  }
}

