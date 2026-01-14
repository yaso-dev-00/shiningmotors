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

// GET: Fetch messages between two users
export async function GET(req: NextRequest) {
  try {
    const auth = await getUserClient(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase, userId } = auth;
    const searchParams = req.nextUrl.searchParams;
    const user1 = searchParams.get("user1");
    const user2 = searchParams.get("user2");

    if (!user1 || !user2) {
      return NextResponse.json(
        {
          success: false,
          error: "Both user1 and user2 parameters are required",
          data: [],
        },
        { status: 400 }
      );
    }

    // Verify the authenticated user is one of the participants
    if (userId !== user1 && userId !== user2) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: You can only access your own conversations",
          data: [],
        },
        { status: 403 }
      );
    }

    // Fetch messages between the two users
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to fetch messages",
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
    console.error("Error in GET /api/messenger/messages:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch messages",
        data: [],
      },
      { status: 500 }
    );
  }
}

// POST: Send a new message
export async function POST(req: NextRequest) {
  try {
    const auth = await getUserClient(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase, userId } = auth;
    const body = await req.json();
    const { sender_id, receiver_id, content, message_type } = body;

    // Validate required fields
    if (!sender_id || !receiver_id || !content || !message_type) {
      return NextResponse.json(
        {
          success: false,
          error: "sender_id, receiver_id, content, and message_type are required",
        },
        { status: 400 }
      );
    }

    // Verify sender is the authenticated user
    if (sender_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: You can only send messages as yourself",
        },
        { status: 403 }
      );
    }

    // Insert the message
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id,
          receiver_id,
          content,
          message_type: message_type as "video" | "image" | "text" | "post",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to send message",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error in POST /api/messenger/messages:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to send message",
      },
      { status: 500 }
    );
  }
}

