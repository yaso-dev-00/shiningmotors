import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Lazy initialization to avoid build-time errors
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rzrroghnzintpxspwauf.supabase.co";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  }

  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// This endpoint can be called by a cron job or scheduled task
// to send reminder notifications (event reminders, service booking reminders, etc.)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, secret } = body;

    // Verify secret to prevent unauthorized access
    const expectedSecret = process.env.CRON_SECRET || "your-secret-key-change-this";
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let result;
    let notificationsSent = 0;

    const supabase = getSupabaseClient();

    switch (type) {
      case "event_reminders":
        // Send event reminders (24 hours before event)
        const { data: eventResult, error: eventError } = await supabase.rpc(
          "send_event_reminders"
        );
        if (eventError) throw eventError;
        result = eventResult;
        notificationsSent = result?.[0]?.notifications_sent || 0;
        break;

      case "service_booking_reminders":
        // Send service booking reminders (24 hours before booking)
        const { data: serviceResult, error: serviceError } = await supabase.rpc(
          "send_service_booking_reminders"
        );
        if (serviceError) throw serviceError;
        result = serviceResult;
        notificationsSent = result?.[0]?.notifications_sent || 0;
        break;

      case "abandoned_cart":
        // Send abandoned cart reminders (24 hours after last cart update)
        const { data: cartResult, error: cartError } = await supabase.rpc(
          "send_abandoned_cart_reminders"
        );
        if (cartError) throw cartError;
        result = cartResult;
        notificationsSent = result?.[0]?.notifications_sent || 0;
        break;

      case "all":
        // Send all reminder types
        const [eventRes, serviceRes, cartRes] = await Promise.all([
          supabase.rpc("send_event_reminders"),
          supabase.rpc("send_service_booking_reminders"),
          supabase.rpc("send_abandoned_cart_reminders"),
        ]);

        if (eventRes.error) throw eventRes.error;
        if (serviceRes.error) throw serviceRes.error;
        if (cartRes.error) throw cartRes.error;

        notificationsSent =
          (eventRes.data?.[0]?.notifications_sent || 0) +
          (serviceRes.data?.[0]?.notifications_sent || 0) +
          (cartRes.data?.[0]?.notifications_sent || 0);

        result = {
          event_reminders: eventRes.data?.[0]?.notifications_sent || 0,
          service_booking_reminders: serviceRes.data?.[0]?.notifications_sent || 0,
          abandoned_cart: cartRes.data?.[0]?.notifications_sent || 0,
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid reminder type. Use: event_reminders, service_booking_reminders, abandoned_cart, or all" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      notifications_sent: notificationsSent,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error sending reminder notifications:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send reminder notifications" },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    message: "Reminder notifications API",
    available_types: [
      "event_reminders",
      "service_booking_reminders",
      "abandoned_cart",
      "all",
    ],
    usage: "POST with { type: 'event_reminders', secret: 'your-secret' }",
  });
}




