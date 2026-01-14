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

// GET: Fetch conversations for authenticated user
export async function GET(req: NextRequest) {
  try {
    const auth = await getUserClient(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase, userId } = auth;

    // Call the RPC function to fetch conversations
    const { data, error } = await (supabase as any).rpc(
      "fetch_user_conversations_with_last_seen",
      {
        current_user_id: userId,
      }
    );

    if (error) {
      console.error("Error fetching conversations:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to fetch conversations",
          data: [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data || [],
      },
      {
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in GET /api/messenger/conversations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch conversations",
        data: [],
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete conversation between two users
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getUserClient(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase, userId } = auth;
    const body = await req.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    // Delete all messages between the authenticated user and the conversation partner
    const { error } = await supabase
      .from("messages")
      .delete()
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${userId})`
      );

    if (error) {
      console.error("Error deleting conversation:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to delete conversation",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/messenger/conversations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete conversation",
      },
      { status: 500 }
    );
  }
}

