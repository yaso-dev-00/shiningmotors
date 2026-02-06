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

// This endpoint can be called by Supabase webhooks when a notification is created
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    
    // Handle Supabase webhook format
    const record = body.record || body;
    const eventType = body.type || body.eventType || 'INSERT';

    if (eventType !== 'INSERT' || !record) {
      return NextResponse.json({ success: true, message: 'Not a new notification' });
    }

    const notification = {
      id: record.id,
      user_id: record.user_id,
      type: record.type,
      title: record.title,
      message: record.message,
      data: record.data,
    };

    // Determine URL based on notification type
    let url = '/';
    const data = notification.data as any;
    
    if (notification.type === 'post_like' || notification.type === 'post_comment') {
      url = `/social/post/${data?.post_id || ''}`;
    } else if (notification.type === 'new_post') {
      url = `/social/post/${data?.post_id || ''}`;
    } else if (notification.type === 'new_follower') {
      url = `/profile/${data?.follower_id || ''}`;
    } else if (notification.type === 'order_created' || notification.type === 'order_status' || notification.type === 'vendor_new_order') {
      url = `/shop/orders${data?.order_id ? `/${data.order_id}` : ''}`;
    } else if (notification.type === 'payment_success' || notification.type === 'payment_failed') {
      url = `/shop/orders${data?.order_id ? `/${data.order_id}` : ''}`;
    } else if (notification.type === 'event_registration_confirmed' || 
               notification.type === 'event_registration_pending' || 
               notification.type === 'event_registration_rejected' ||
               notification.type === 'event_created' ||
               notification.type === 'event_updated' ||
               notification.type === 'event_cancelled') {
      url = `/events${data?.event_id ? `/${data.event_id}` : ''}`;
    } else if (notification.type === 'service_booking_confirmed' || 
               notification.type === 'service_booking_pending' || 
               notification.type === 'service_booking_rejected' ||
               notification.type === 'vendor_new_booking') {
      url = `/myServiceBookings${data?.service_id ? `?service=${data.service_id}` : ''}`;
    } else if (notification.type === 'product_restock' || 
               notification.type === 'price_drop' || 
               notification.type === 'new_product') {
      url = `/shop/product/${data?.product_id || ''}`;
    } else if (notification.type === 'event_reminder') {
      url = `/events${data?.event_id ? `/${data.event_id}` : ''}`;
    } else if (notification.type === 'service_booking_reminder') {
      url = `/myServiceBookings${data?.service_id ? `?service=${data.service_id}` : ''}`;
    } else if (notification.type === 'abandoned_cart') {
      url = '/shop/cart';
    } else if (data?.url) {
      url = data.url;
    }

    // Send push notification
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: notification.user_id,
        notification: {
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          url: url,
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send push notification');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in push notification webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

