import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rzrroghnzintpxspwauf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { 
          error: "SUPABASE_SERVICE_ROLE_KEY is required. Please get it from Supabase Dashboard → Settings → API → service_role key (not anon key)" 
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { user_id, subscription } = body;

    if (!user_id || !subscription) {
      return NextResponse.json(
        { error: "user_id and subscription are required" },
        { status: 400 }
      );
    }
     console.log(subscription);
    // Extract FCM token from subscription object
    const fcmToken = subscription.token || subscription.fcmToken || (typeof subscription === 'string' ? subscription : null);
    
    if (!fcmToken) {
      return NextResponse.json(
        { error: "FCM token is required" },
        { status: 400 }
      );
    }

    // Check if subscription already exists for this user and token
    // First, get all subscriptions for this user
    const { data: userSubscriptions } = await supabase
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", user_id);

    // Find existing subscription with matching FCM token
    const existing = userSubscriptions?.find((sub: any) => {
      const subData = sub.subscription;
      if (typeof subData === 'object' && subData !== null) {
        const token = subData.token || subData.fcmToken;
        return token === fcmToken;
      }
      return false;
    });

    if (existing) {
      // Update existing subscription
      const { error } = await supabase
        .from("push_subscriptions")
        .update({
          subscription: subscription as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "Subscription updated",
        id: existing.id,
      });
    } else {
      // Insert new subscription
      const { data, error } = await supabase
        .from("push_subscriptions")
        .insert({
          user_id,
          subscription: subscription as any,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "Subscription saved",
        id: data.id,
      });
    }
  } catch (error: any) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, subscription_endpoint, fcm_token } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // If FCM token is provided, delete only that specific subscription
    const token = fcm_token || subscription_endpoint;
    if (token) {
      // Get all subscriptions for this user
      const { data: userSubscriptions } = await supabase
        .from("push_subscriptions")
        .select("id, subscription")
        .eq("user_id", user_id);

      // Find the subscription with matching FCM token
      const subscriptionToDelete = userSubscriptions?.find((sub: any) => {
        const subData = sub.subscription;
        if (typeof subData === 'object' && subData !== null) {
          const subToken = subData.token || subData.fcmToken;
          return subToken === token;
        }
        return false;
      });

      if (subscriptionToDelete) {
        // Delete only the specific subscription
        const { error } = await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", subscriptionToDelete.id);

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: "Subscription removed",
        });
      } else {
        return NextResponse.json({
          success: true,
          message: "Subscription not found",
        });
      }
    } else {
      // If no token provided, delete all subscriptions for this user
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user_id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "All subscriptions removed",
      });
    }
  } catch (error: any) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove subscription" },
      { status: 500 }
    );
  }
}

