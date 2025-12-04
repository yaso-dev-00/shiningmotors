import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  enablePushNotifications: () => void;
  pushNotificationsEnabled: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // During Next.js build/SSR, return a default context instead of throwing
    if (typeof window === 'undefined') {
      return {
        notifications: [],
        unreadCount: 0,
        markAsRead: async () => {},
        markAllAsRead: async () => {},
        enablePushNotifications: async () => {},
        pushNotificationsEnabled: false,
      } as NotificationContextType;
    }
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] =
    useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      if (!user) {
        setNotifications([]);
        return;
      }

      // Directly query the notifications table for now
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications((data || []).map(n => ({ ...n, read: n.read ?? false })));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user]);

  const setupRealtimeSubscription = useCallback(async () => {
    if (!user) return;

    // Clean up existing channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);

          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });

          // Send push notification if user has push notifications enabled
          try {
            if (user && user.id === newNotification.user_id) {
              // Check if user has push notifications enabled and preferences allow it
              const [subscriptionsResult, profileResult] = await Promise.all([
                supabase
                  .from("push_subscriptions")
                  .select("id")
                  .eq("user_id", user.id)
                  .limit(1),
                supabase
                  .from("profiles")
                  .select("notification_preferences")
                  .eq("id", user.id)
                  .single()
              ]);

              const subscriptions = subscriptionsResult.data;
              const profile = profileResult.data;
              const preferences = profile?.notification_preferences as any;

              // Check if user has subscriptions and preferences allow this notification type
              if (subscriptions && subscriptions.length > 0) {
                const notificationType = newNotification.type;
                let shouldSend = true;

                // Check preferences
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

                if (shouldSend) {
                  // Determine URL based on notification type
                  let url = '/';
                  const data = newNotification.data as any;
                  
                  if (newNotification.type === 'post_like' || newNotification.type === 'post_comment') {
                    url = `/social/post/${data?.post_id || ''}`;
                  } else if (newNotification.type === 'new_post') {
                    url = `/social/post/${data?.post_id || ''}`;
                  } else if (newNotification.type === 'new_follower') {
                    url = `/profile/${data?.follower_id || ''}`;
                  } else if (newNotification.type === 'order_created' || newNotification.type === 'order_status' || newNotification.type === 'vendor_new_order') {
                    url = `/shop/orders${data?.order_id ? `/${data.order_id}` : ''}`;
                  } else if (newNotification.type === 'payment_success' || newNotification.type === 'payment_failed') {
                    url = `/shop/orders${data?.order_id ? `/${data.order_id}` : ''}`;
                  } else if (newNotification.type === 'event_registration_confirmed' || 
                             newNotification.type === 'event_registration_pending' || 
                             newNotification.type === 'event_registration_rejected' ||
                             newNotification.type === 'event_created' ||
                             newNotification.type === 'event_updated' ||
                             newNotification.type === 'event_cancelled') {
                    url = `/events${data?.event_id ? `/${data.event_id}` : ''}`;
                  } else if (newNotification.type === 'service_booking_confirmed' || 
                             newNotification.type === 'service_booking_pending' || 
                             newNotification.type === 'service_booking_rejected' ||
                             newNotification.type === 'vendor_new_booking') {
                    url = `/myServiceBookings${data?.service_id ? `?service=${data.service_id}` : ''}`;
                  } else if (newNotification.type === 'product_restock' || 
                             newNotification.type === 'price_drop' || 
                             newNotification.type === 'new_product') {
                    url = `/shop/product/${data?.product_id || ''}`;
                  } else if (newNotification.type === 'event_reminder') {
                    url = `/events${data?.event_id ? `/${data.event_id}` : ''}`;
                  } else if (newNotification.type === 'service_booking_reminder') {
                    url = `/myServiceBookings${data?.service_id ? `?service=${data.service_id}` : ''}`;
                  } else if (newNotification.type === 'abandoned_cart') {
                    url = '/shop/cart';
                  } else if (data?.url) {
                    url = data.url;
                  }

                  // Send push notification via API
                  await fetch('/api/push/send', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      user_id: user.id,
                      notification: {
                        title: newNotification.title,
                        message: newNotification.message,
                        type: newNotification.type,
                        data: newNotification.data,
                        url: url,
                      }
                    })
                  }).catch(err => {
                    console.error('Failed to send push notification:', err);
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error sending push notification:', error);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [user, toast]);

  // Fetch notifications and setup real-time subscription when user changes
  useEffect(() => {
    if (!user) {
      // User logged out - clear notifications and cleanup
      setNotifications([]);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // User logged in - fetch notifications immediately
    fetchNotifications();
    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchNotifications, setupRealtimeSubscription]);

  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const enablePushNotifications = async () => {
    try {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        setPushNotificationsEnabled(permission === "granted");

        if (permission === "granted") {
          toast({
            title: "Push notifications enabled",
            description: "You'll receive notifications for product updates!",
          });
        }
      }
    } catch (error) {
      console.error("Error enabling push notifications:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        enablePushNotifications,
        pushNotificationsEnabled,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
