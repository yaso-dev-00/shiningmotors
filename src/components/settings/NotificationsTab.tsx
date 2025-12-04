import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, MessageSquare, Settings, Check, CheckCheck, X, Heart, MessageCircle, UserPlus, ShoppingCart, Calendar, Hammer, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  push_likes: boolean;
  push_comments: boolean;
  push_new_posts: boolean;
  push_orders: boolean;
  push_order_status: boolean;
  push_events: boolean;
  push_services: boolean;
  push_followers: boolean;
  push_products: boolean;
  push_security: boolean;
  push_promotional: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

const NotificationsTab = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { 
    permission, 
    isSupported, 
    requestPermission,
    subscribeUser,
    unsubscribe,
    sendTestNotification 
  } = usePushNotifications();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_likes: true,
    push_comments: true,
    push_new_posts: true,
    push_orders: true,
    push_order_status: true,
    push_events: true,
    push_services: true,
    push_followers: true,
    push_products: true,
    push_security: true,
    push_promotional: false,
    email_notifications: true,
    sms_notifications: true,
  });
  const [pushNotifications, setPushNotifications] = useState(false);

  useEffect(() => {
    // Reset state when user changes
    setPushNotifications(false);
    loadPreferences();
    checkPushNotificationStatus();
  }, [user]);

  useEffect(() => {
    // Update when permission changes
    if (permission === 'granted') {
      checkPushNotificationStatus();
    } else {
      setPushNotifications(false);
    }
  }, [permission]);

  const checkPushNotificationStatus = async () => {
    if (!user || permission !== 'granted') {
      setPushNotifications(false);
      return;
    }

    try {
      // Check if user has an active subscription
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      setPushNotifications(!!(subscriptions && subscriptions.length > 0));
    } catch (error) {
      console.error('Error checking push notification status:', error);
      setPushNotifications(false);
    }
  };

  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (profile?.notification_preferences) {
        const prefs = profile.notification_preferences as Partial<NotificationPreferences>;
        setPreferences({
          push_likes: prefs.push_likes ?? true,
          push_comments: prefs.push_comments ?? true,
          push_new_posts: prefs.push_new_posts ?? true,
          push_orders: prefs.push_orders ?? true,
          push_order_status: prefs.push_order_status ?? true,
          push_events: prefs.push_events ?? true,
          push_services: prefs.push_services ?? true,
          push_followers: prefs.push_followers ?? true,
          push_products: prefs.push_products ?? true,
          push_security: prefs.push_security ?? true,
          push_promotional: prefs.push_promotional ?? false,
          email_notifications: prefs.email_notifications ?? true,
          sms_notifications: prefs.sms_notifications ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          notification_preferences: newPreferences as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setPreferences(newPreferences);
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences.",
        variant: "destructive"
      });
    }
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (granted) {
          setPushNotifications(true);
          await checkPushNotificationStatus();
        }
      } else {
        // Permission already granted, just subscribe
        const token = await subscribeUser();
        if (token) {
          setPushNotifications(true);
        }
      }
    } else {
      // Disable push notifications
      await unsubscribe();
      setPushNotifications(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post_like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'post_comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'new_post':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'new_follower':
        return <UserPlus className="h-4 w-4 text-pink-500" />;
      case 'order_created':
      case 'order_status':
      case 'vendor_new_order':
        return <ShoppingCart className="h-4 w-4 text-orange-500" />;
      case 'event_registration_confirmed':
      case 'event_registration_pending':
      case 'event_registration_rejected':
      case 'event_created':
      case 'event_updated':
      case 'event_cancelled':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'service_booking_confirmed':
      case 'service_booking_pending':
      case 'service_booking_rejected':
      case 'vendor_new_booking':
        return <Hammer className="h-4 w-4 text-indigo-500" />;
      case 'product_purchase':
      case 'product_update':
      case 'product_restock':
      case 'price_drop':
      case 'new_product':
        return <ShoppingCart className="h-4 w-4 text-teal-500" />;
      case 'payment_success':
      case 'payment_failed':
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'post_like':
        return 'bg-red-100 text-red-800';
      case 'post_comment':
        return 'bg-blue-100 text-blue-800';
      case 'new_post':
        return 'bg-green-100 text-green-800';
      case 'new_follower':
        return 'bg-pink-100 text-pink-800';
      case 'order_created':
      case 'order_status':
      case 'vendor_new_order':
        return 'bg-orange-100 text-orange-800';
      case 'event_registration_confirmed':
      case 'event_registration_pending':
      case 'event_registration_rejected':
      case 'event_created':
      case 'event_updated':
      case 'event_cancelled':
        return 'bg-purple-100 text-purple-800';
      case 'service_booking_confirmed':
      case 'service_booking_pending':
      case 'service_booking_rejected':
      case 'vendor_new_booking':
        return 'bg-indigo-100 text-indigo-800';
      case 'product_purchase':
      case 'product_update':
      case 'product_restock':
      case 'price_drop':
      case 'new_product':
        return 'bg-teal-100 text-teal-800';
      case 'payment_success':
        return 'bg-green-100 text-green-800';
      case 'payment_failed':
        return 'bg-red-100 text-red-800';
      case 'message':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationUrl = (notification: any): string => {
    const data = notification.data as any;
    let url = '/';

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
               notification.type === 'event_cancelled' ||
               notification.type === 'event_reminder') {
      url = `/events${data?.event_id ? `/${data.event_id}` : ''}`;
    } else if (notification.type === 'service_booking_confirmed' || 
               notification.type === 'service_booking_pending' || 
               notification.type === 'service_booking_rejected' ||
               notification.type === 'vendor_new_booking' ||
               notification.type === 'service_booking_reminder') {
      url = `/myServiceBookings${data?.service_id ? `?service=${data.service_id}` : ''}`;
    } else if (notification.type === 'product_restock' || 
               notification.type === 'price_drop' || 
               notification.type === 'new_product') {
      url = `/shop/product/${data?.product_id || ''}`;
    } else if (notification.type === 'abandoned_cart') {
      url = '/shop/cart';
    } else if (data?.url) {
      url = data.url;
    }

    return url;
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to related page
    const url = getNotificationUrl(notification);
    router.push(url as any);
  };

  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          
          {/* Push Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Push Notifications</div>
                <div className="text-sm text-muted-foreground">
                  {isSupported 
                    ? "Receive browser push notifications" 
                    : "Not supported in this browser"
                  }
                </div>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={handlePushNotificationToggle}
                disabled={!isSupported}
              />
            </div>

            {pushNotifications && permission === 'granted' && (
              <div className="ml-6 space-y-3 border-l-2 pl-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      Push notifications for likes
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Get notified when someone likes your post
                    </div>
                  </div>
                  <Switch
                    checked={preferences.push_likes}
                    onCheckedChange={(checked) => handlePreferenceChange('push_likes', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      Push notifications for comments
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Get notified when someone comments on your post
                    </div>
                  </div>
                  <Switch
                    checked={preferences.push_comments}
                    onCheckedChange={(checked) => handlePreferenceChange('push_comments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-green-500" />
                      Push notifications for new posts
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Get notified when users you follow post new content
                    </div>
                  </div>
                  <Switch
                    checked={preferences.push_new_posts}
                    onCheckedChange={(checked) => handlePreferenceChange('push_new_posts', checked)}
                  />
                </div>

                <Separator className="my-3" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-orange-500" />
                      Push notifications for orders
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Get notified when you place new orders
                    </div>
                  </div>
                  <Switch
                    checked={preferences.push_orders}
                    onCheckedChange={(checked) => handlePreferenceChange('push_orders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-blue-500" />
                      Push notifications for order status
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Get notified when your order status changes
                    </div>
                  </div>
                  <Switch
                    checked={preferences.push_order_status}
                    onCheckedChange={(checked) => handlePreferenceChange('push_order_status', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      Push notifications for events
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Get notified about event registrations and updates
                    </div>
                  </div>
                  <Switch
                    checked={preferences.push_events}
                    onCheckedChange={(checked) => handlePreferenceChange('push_events', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Hammer className="h-4 w-4 text-indigo-500" />
                      Push notifications for services
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Get notified about service booking updates
                    </div>
                  </div>
                  <Switch
                    checked={preferences.push_services}
                    onCheckedChange={(checked) => handlePreferenceChange('push_services', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-pink-500" />
                      Push notifications for followers
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Get notified when someone follows you
                    </div>
                  </div>
                  <Switch
                    checked={preferences.push_followers}
                    onCheckedChange={(checked) => handlePreferenceChange('push_followers', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-teal-500" />
                      Push notifications for products
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Get notified about product updates and restocks
                    </div>
                  </div>
                  <Switch
                    checked={preferences.push_products}
                    onCheckedChange={(checked) => handlePreferenceChange('push_products', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Settings className="h-4 w-4 text-red-500" />
                      Push notifications for security
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Get notified about account security alerts
                    </div>
                  </div>
                  <Switch
                    checked={preferences.push_security}
                    onCheckedChange={(checked) => handlePreferenceChange('push_security', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Bell className="h-4 w-4 text-yellow-500" />
                      Push notifications for promotions
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Get notified about special offers and promotions
                    </div>
                  </div>
                  <Switch
                    checked={preferences.push_promotional}
                    onCheckedChange={(checked) => handlePreferenceChange('push_promotional', checked)}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendTestNotification}
                  >
                    Send Test Notification
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Email Notifications</div>
              <div className="text-sm text-muted-foreground">
                Receive notifications via email
              </div>
            </div>
            <Switch
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
            />
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">SMS Notifications</div>
              <div className="text-sm text-muted-foreground">
                Receive notifications via SMS (requires mobile number)
              </div>
            </div>
            <Switch
              checked={preferences.sms_notifications}
              onCheckedChange={(checked) => handlePreferenceChange('sms_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* All Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>
              View all your notifications and manage them
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read ({unreadCount})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications yet</p>
              <p className="text-sm text-gray-400">
                You'll see notifications here when you have them
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer hover:shadow-md ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
                      : 'bg-white border-blue-200 shadow-sm hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getNotificationTypeColor(notification.type)}`}
                          >
                            {notification.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true 
                            })}
                          </span>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      
                      {notification.data && Object.keys(notification.data).length > 0 && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                            className="text-xs h-7"
                          >
                            <ExternalLink className="h-3 w-3 mr-1.5" />
                            View details
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;