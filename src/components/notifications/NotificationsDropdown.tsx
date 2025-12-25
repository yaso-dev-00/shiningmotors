import React from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Package, 
  Tag, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  ShoppingCart, 
  Calendar, 
  Hammer, 
  Settings,
  Mail,
  MessageSquare,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { usePostModal } from '@/contexts/PostModalProvider';

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

interface NotificationsDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const router = useRouter();
  const { openPost } = usePostModal();
  
  // Show only recent 5 notifications in dropdown
  const recentNotifications = notifications.slice(0, 5);
  
  const getIcon = (type: string) => {
    switch (type) {
      // Social notifications
      case 'post_like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'post_comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'new_post':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'new_follower':
        return <UserPlus className="h-4 w-4 text-pink-500" />;
      
      // Order notifications
      case 'order_created':
      case 'order_status':
      case 'vendor_new_order':
        return <ShoppingCart className="h-4 w-4 text-orange-500" />;
      case 'payment_success':
      case 'payment_failed':
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      
      // Product notifications
      case 'product_purchase':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'product_update':
        return <Tag className="h-4 w-4 text-blue-500" />;
      case 'product_restock':
      case 'price_drop':
      case 'new_product':
        return <Package className="h-4 w-4 text-teal-500" />;
      
      // Event notifications
      case 'event_registration_confirmed':
      case 'event_registration_pending':
      case 'event_registration_rejected':
      case 'event_created':
      case 'event_updated':
      case 'event_cancelled':
      case 'event_reminder':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      
      // Service notifications
      case 'service_booking_confirmed':
      case 'service_booking_pending':
      case 'service_booking_rejected':
      case 'service_booking_cancelled':
      case 'service_booking_completed':
      case 'service_booking_updated':
      case 'service_booking_reminder':
      case 'vendor_new_booking':
        return <Hammer className="h-4 w-4 text-indigo-500" />;
      
      // Security & Account notifications (Settings icon)
      case 'profile_updated':
      case 'password_changed':
      case 'new_device_login':
      case 'suspicious_activity':
        return <Settings className="h-4 w-4 text-gray-600" />;
      
      // Message notifications
      case 'message':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-500" />;
      
      // System notifications
      case 'maintenance_notice':
      case 'feature_update':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getNotificationUrl = (notification: Notification): string => {
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
               notification.type === 'service_booking_reminder' ||
               notification.type === 'service_booking_cancelled' ||
               notification.type === 'service_booking_completed' ||
               notification.type === 'service_booking_updated') {
      url = `/myServiceBookings${data?.service_id ? `?service=${data.service_id}` : ''}`;
    } else if (notification.type === 'product_restock' || 
               notification.type === 'price_drop' || 
               notification.type === 'new_product' ||
               notification.type === 'product_purchase' ||
               notification.type === 'product_update') {
      url = `/shop/product/${data?.product_id || ''}`;
    } else if (notification.type === 'abandoned_cart') {
      url = '/shop/cart';
    } else if (notification.type === 'profile_updated' || 
               notification.type === 'password_changed' ||
               notification.type === 'new_device_login' ||
               notification.type === 'suspicious_activity') {
      url = '/settings';
    } else if (notification.type === 'message') {
      url = `/messenger${data?.user_id ? `/${data.user_id}` : ''}`;
    } else if (data?.url) {
      url = data.url;
    }

    return url;
  };
  
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    const data = notification.data as any;
    
    // Handle post-related notifications with global modal
    if (notification.type === 'post_like' || 
        notification.type === 'post_comment' || 
        notification.type === 'new_post') {
      const postId = data?.post_id;
      if (postId) {
        // For comment notifications, pass commentId to scroll to that comment
        const commentId = notification.type === 'post_comment' ? data?.comment_id : undefined;
        openPost(postId, commentId);
        return;
      }
    }
    
    // For other notification types, navigate normally
    const url = getNotificationUrl(notification);
    router.push(url as any);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <ScrollArea className="h-80">
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.read ? 'bg-muted/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer flex items-center justify-between"
          onClick={() => router.push('/settings')}
        >
          <span className="text-sm">Notification Settings</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};