import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PushSubscriptionData {
  user_id: string;
  subscription: PushSubscription;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports notifications and service workers
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribeUser();
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications to receive updates.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive"
      });
      return false;
    }
  };

  const subscribeUser = async () => {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // You'll need to get this from your push service (e.g., Firebase, OneSignal)
          process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLdaKMKqSCb8s6PjL8-l8A9_-cOYfaA3X0VJxGNNj8F_5n6DktpXboo'
        )
      });

      setSubscription(subscription);

      // Save subscription to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.functions.invoke('save-push-subscription', {
          body: {
            user_id: user.id,
            subscription: subscription.toJSON()
          }
        });
      }

      toast({
        title: "Success",
        description: "Push notifications enabled successfully!",
      });

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Error",
        description: "Failed to enable push notifications.",
        variant: "destructive"
      });
      return null;
    }
  };

  const unsubscribe = async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        setSubscription(null);
        
        // Remove subscription from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.functions.invoke('remove-push-subscription', {
            body: { user_id: user.id }
          });
        }

        toast({
          title: "Success",
          description: "Push notifications disabled.",
        });
      } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        toast({
          title: "Error",
          description: "Failed to disable push notifications.",
          variant: "destructive"
        });
      }
    }
  };

  const sendTestNotification = async () => {
    if (permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from Shining Motors!',
        icon: '/logo.jpg',
        tag: 'test'
      });
    }
  };

  return {
    permission,
    subscription,
    isSupported,
    requestPermission,
    unsubscribe,
    sendTestNotification
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}