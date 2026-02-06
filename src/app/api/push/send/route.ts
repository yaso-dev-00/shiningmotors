import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { messaging } from "@/lib/firebase-admin";
import { Message } from "firebase-admin/messaging";

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

interface PushNotificationPayload {
  title: string;
  message: string;
  type: string;
  data?: any;
  url?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { user_id, notification } = body;

    if (!user_id || !notification) {
      return NextResponse.json(
        { error: "user_id and notification are required" },
        { status: 400 }
      );
    }

    if (!messaging) {
      console.warn("Firebase Admin not initialized, skipping push notification");
      return NextResponse.json({
        success: true,
        message: "Push notifications not configured",
        sent: 0,
      });
    }

    // Check user's notification preferences (skip for test notifications)
    const notificationType = notification.type;
    let shouldSend = true;
    
    if (notificationType !== 'test') {
      const { data: profile } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", user_id)
        .single();

      const preferences = profile?.notification_preferences as any;
      
      if (preferences) {
        // Social notifications
        if (notificationType === 'post_like' && preferences.push_likes === false) {
          shouldSend = false;
        } else if (notificationType === 'post_comment' && preferences.push_comments === false) {
          shouldSend = false;
        } else if (notificationType === 'new_post' && preferences.push_new_posts === false) {
          shouldSend = false;
        } else if (notificationType === 'new_follower' && preferences.push_followers === false) {
          shouldSend = false;
        }
        // Order notifications
        else if ((notificationType === 'order_created' || notificationType === 'payment_success' || notificationType === 'payment_failed') && preferences.push_orders === false) {
          shouldSend = false;
        } else if (notificationType === 'order_status' && preferences.push_order_status === false) {
          shouldSend = false;
        }
        // Event notifications
        else if ((notificationType === 'event_registration_confirmed' || 
                 notificationType === 'event_registration_pending' || 
                 notificationType === 'event_registration_rejected' ||
                 notificationType === 'event_created' ||
                 notificationType === 'event_updated' ||
                 notificationType === 'event_cancelled') && preferences.push_events === false) {
          shouldSend = false;
        }
        // Service notifications
        else if ((notificationType === 'service_booking_confirmed' || 
                 notificationType === 'service_booking_pending' || 
                 notificationType === 'service_booking_rejected' ||
                 notificationType === 'vendor_new_booking') && preferences.push_services === false) {
          shouldSend = false;
        }
        // Product notifications
        else if ((notificationType === 'product_restock' || 
                 notificationType === 'price_drop' || 
                 notificationType === 'new_product') && preferences.push_products === false) {
          shouldSend = false;
        }
        // Reminder notifications (use appropriate preference)
        else if (notificationType === 'event_reminder' && preferences.push_events === false) {
          shouldSend = false;
        } else if (notificationType === 'service_booking_reminder' && preferences.push_services === false) {
          shouldSend = false;
        } else if (notificationType === 'abandoned_cart' && preferences.push_promotional === false) {
          shouldSend = false;
        }
        // Security notifications
        else if ((notificationType === 'profile_updated' || 
                 notificationType === 'password_changed' || 
                 notificationType === 'new_device_login' ||
                 notificationType === 'suspicious_activity') && preferences.push_security === false) {
          shouldSend = false;
        }
        // Promotional notifications
        else if ((notificationType === 'special_offer' || 
                 notificationType === 'abandoned_cart' ||
                 notificationType === 'maintenance_notice' ||
                 notificationType === 'feature_update') && preferences.push_promotional === false) {
          shouldSend = false;
        }
      }

      if (!shouldSend) {
        return NextResponse.json({
          success: true,
          message: "Notification type disabled by user preferences",
          sent: 0,
        });
      }
    }

    // Get all FCM tokens for the user
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", user_id);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No subscriptions found",
        sent: 0,
      });
    }

    // Extract FCM tokens from subscriptions
    const fcmTokens = subscriptions
      .map((sub) => {
        const subData = sub.subscription as any;
        // FCM token can be stored directly or in subscription.token or subscription.fcmToken
        const token = subData?.token || subData?.fcmToken || (typeof subData === 'string' ? subData : null);
        if (!token) {
          console.warn(`No token found in subscription ${sub.id}:`, JSON.stringify(subData));
        }
        return token;
      })
      .filter((token): token is string => !!token && typeof token === 'string');

    console.log(`Found ${fcmTokens.length} valid FCM tokens out of ${subscriptions.length} subscriptions`);

    if (fcmTokens.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No valid FCM tokens found in subscriptions",
        sent: 0,
        error: "Please ensure push notifications are enabled and subscription is saved correctly",
      });
    }

    const defaultTag = `notification_${notification.type || 'general'}_${Date.now()}`;

    const dataPayload: Record<string, string> = {
      type: notification.type || "general",
      url: notification.url || '/',
      title: notification.title || "New Notification",
      message: notification.message || "",
      tag:
        (notification.data && typeof notification.data === 'object'
          ? (notification.data as any).tag
          : undefined) || defaultTag,
    };

    if (notification.data && typeof notification.data === 'object') {
      Object.entries(notification.data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        dataPayload[key] =
          typeof value === 'string'
            ? value
            : Array.isArray(value) || typeof value === 'object'
              ? JSON.stringify(value)
              : String(value);
      });
    }

    // Base message structure (without token, will be added per subscription)
    const baseMessage: Partial<Message> & {
      data: Record<string, string>;
      webpush?: {
        fcmOptions: { link: string };
      };
    } = {
      data: dataPayload,
      webpush: {
        fcmOptions: {
          link: notification.url || '/',
        },
      },
    };

    const results = await Promise.allSettled(
      subscriptions.map(async (sub, index) => {
        try {
          const token = fcmTokens[index];
          if (!token) {
            console.error(`No token found for subscription ${sub.id} at index ${index}`);
            return { id: sub.id, success: false, error: 'No token found' };
          }

          // Send to single token
          const messageToSend: Message = {
            ...baseMessage,
            token: token,
          };

          if (!messaging) {
            throw new Error('Firebase messaging not initialized');
          }

          console.log(`Sending notification to token ${token.substring(0, 20)}...`);
          console.log(messageToSend);
          const response = await messaging.send(messageToSend);
          console.log(`Successfully sent notification: ${response}`);

          return { id: sub.id, success: true };
        } catch (error: any) {
          console.error(`Error sending to subscription ${sub.id}:`, error);
          
          // If token is invalid, remove it
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered' ||
              error.code === 'messaging/invalid-argument') {
            console.log(`Removing invalid token for subscription ${sub.id}`);
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }
          return { id: sub.id, success: false, error: error.message || error.code || 'Unknown error' };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - successful;
    const errors = results
      .filter((r) => r.status === "fulfilled" && !r.value.success)
      .map((r) => r.status === "fulfilled" ? r.value : null)
      .filter(Boolean);

    if (successful === 0 && failed > 0) {
      console.error("All notifications failed:", errors);
      return NextResponse.json({
        success: false,
        sent: 0,
        failed,
        total: subscriptions.length,
        errors: errors,
        message: "Failed to send notifications. Check server logs for details.",
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
      ...(errors.length > 0 && { errors: errors }),
    });
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send push notification" },
      { status: 500 }
    );
  }
}

// Batch send notifications to multiple users
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { user_ids, notification } = body;

    if (!user_ids || !Array.isArray(user_ids) || !notification) {
      return NextResponse.json(
        { error: "user_ids array and notification are required" },
        { status: 400 }
      );
    }

    if (!messaging) {
      console.warn("Firebase Admin not initialized, skipping push notification");
      return NextResponse.json({
        success: true,
        message: "Push notifications not configured",
        sent: 0,
      });
    }

    // Get all push subscriptions for the users
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, subscription")
      .in("user_id", user_ids);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No subscriptions found",
        sent: 0,
      });
    }

    // Get user preferences for all users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, notification_preferences")
      .in("id", user_ids);

    const preferencesMap = new Map();
    if (profiles) {
      profiles.forEach((profile) => {
        preferencesMap.set(profile.id, profile.notification_preferences);
      });
    }

    // Filter subscriptions based on preferences
    const notificationType = notification.type;
    const validSubscriptions = subscriptions.filter((sub) => {
      const preferences = preferencesMap.get(sub.user_id) as any;
      if (!preferences) return true; // Default to enabled if no preferences
      
      if (notificationType === 'post_like' && preferences.push_likes === false) {
        return false;
      } else if (notificationType === 'post_comment' && preferences.push_comments === false) {
        return false;
      } else if (notificationType === 'new_post' && preferences.push_new_posts === false) {
        return false;
      }
      return true;
    });

    if (validSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No valid subscriptions after preference filtering",
        sent: 0,
      });
    }

    const payload: PushNotificationPayload = {
      title: notification.title || "New Notification",
      message: notification.message || "",
      type: notification.type || "general",
      data: notification.data || {},
      url: notification.url,
    };

    const batchDefaultTag = `notification_${payload.type || 'general'}_${Date.now()}`;

    const batchDataPayload: Record<string, string> = {
      type: payload.type || "general",
      url: payload.url || '/',
      title: payload.title || "New Notification",
      message: payload.message || "",
      tag:
        (payload.data && typeof payload.data === 'object'
          ? (payload.data as any).tag
          : undefined) || batchDefaultTag,
    };

    if (payload.data && typeof payload.data === 'object') {
      Object.entries(payload.data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        batchDataPayload[key] =
          typeof value === 'string'
            ? value
            : Array.isArray(value) || typeof value === 'object'
              ? JSON.stringify(value)
              : String(value);
      });
    }

    // Extract FCM tokens
    const fcmTokensMap = new Map<string, string>();
    validSubscriptions.forEach((sub) => {
      const subData = sub.subscription as any;
      const token = subData.token || subData.fcmToken || (typeof subData === 'string' ? subData : null);
      if (token) {
        fcmTokensMap.set(sub.id, token);
      }
    });

    // Base message structure for batch sending
    const baseBatchMessage: Partial<Message> & {
      data: Record<string, string>;
      webpush?: {
        fcmOptions: { link: string };
      };
    } = {
      data: batchDataPayload,
      webpush: {
        fcmOptions: {
          link: notification.url || '/',
        },
      },
    };

    const results = await Promise.allSettled(
      validSubscriptions.map(async (sub) => {
        try {
          const token = fcmTokensMap.get(sub.id);
          if (!token) {
            return { id: sub.id, user_id: sub.user_id, success: false, error: 'No token found' };
          }

          if (!messaging) {
            throw new Error('Firebase messaging not initialized');
          }

          await messaging.send({
            ...baseBatchMessage,
            token: token,
          } as Message);

          return { id: sub.id, user_id: sub.user_id, success: true };
        } catch (error: any) {
          // If token is invalid, remove it
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered') {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }
          return {
            id: sub.id,
            user_id: sub.user_id,
            success: false,
            error: error.message,
          };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: validSubscriptions.length,
    });
  } catch (error: any) {
    console.error("Error sending batch push notifications:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send push notifications" },
      { status: 500 }
    );
  }
}

