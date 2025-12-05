import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { messaging } from '@/lib/firebase-client';
import { getToken, onMessage } from 'firebase/messaging';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports notifications, service workers, and push manager
    const hasNotifications = 'Notification' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = hasServiceWorker && 'PushManager' in window;
    
    setIsSupported(hasNotifications && hasServiceWorker && hasPushManager);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check subscription status when user changes
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // User logged out - reset state
          setFcmToken(null);
          return;
        }

        // Check if user has an active subscription for this device
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_id', user.id);

        if (subscriptions && subscriptions.length > 0) {
          // Try to get current FCM token to match
          if (messaging && 'Notification' in window && Notification.permission === 'granted') {
            try {
              const registration = await navigator.serviceWorker.ready;
              const vapidKeyForCheck = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() || '';
              if (!vapidKeyForCheck) {
                console.warn('VAPID key not available for token check');
                return;
              }
              const currentToken = await getToken(messaging, {
                vapidKey: vapidKeyForCheck,
                serviceWorkerRegistration: registration,
              });
              
              if (currentToken) {
                // Check if this token exists in subscriptions
                const hasToken = subscriptions.some((sub: any) => {
                  const subData = sub.subscription;
                  return subData?.token === currentToken || subData?.fcmToken === currentToken;
                });
                
                if (hasToken) {
                  setFcmToken(currentToken);
                } else {
                  setFcmToken(null);
                }
              } else {
                setFcmToken(null);
              }
            } catch (error) {
              console.error('Error checking token:', error);
              setFcmToken(null);
            }
          } else {
            setFcmToken(null);
          }
        } else {
          setFcmToken(null);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        setFcmToken(null);
      }
    };

    checkSubscriptionStatus();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !messaging) return;

    const unsubscribe = onMessage(messaging, async (payload) => {
      console.log('[firebase] foreground message', payload);
      const title =
        payload.data?.title ||
        payload.notification?.title ||
        'New notification';
      const description =
        payload.data?.message ||
        payload.notification?.body ||
        '';

      // Show in-app toast
      toast({
        title,
        description,
      });

      // Show system notification using service worker (works on mobile PWA)
      if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration && registration.showNotification) {
            await registration.showNotification(title, {
              body: description,
              icon: payload.data?.icon || '/logo.jpg',
              badge: payload.data?.badge || '/logo.jpg',
              tag: payload.data?.tag || `notification_${Date.now()}`,
              data: payload.data || {},
              actions: payload.data?.actions || [
                {
                  action: 'view',
                  title: 'View',
                  icon: '/logo.jpg'
                },
                {
                  action: 'dismiss',
                  title: 'Dismiss'
                }
              ],
            } as NotificationOptions & { actions?: Array<{ action: string; title: string; icon?: string }> });
          }
        } catch (error) {
          console.error('Error showing notification via service worker:', error);
          // Fallback: try Notification constructor only if available (desktop browsers)
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification(title, {
                body: description,
                icon: payload.data?.icon || '/logo.jpg',
                tag: payload.data?.tag || 'notification',
                data: payload.data || {},
              });
            } catch (notifError) {
              console.error('Notification constructor also failed:', notifError);
            }
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [toast]);

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
      if (!messaging) {
        throw new Error('Firebase messaging not initialized. Please check Firebase configuration.');
      }

      // Check if service workers and push manager are supported
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers are not supported in this browser.');
      }
      
      if (!('PushManager' in window)) {
        throw new Error('Push notifications are not supported in this browser.');
      }

      // Check for existing service worker registration first
      let registration: ServiceWorkerRegistration | null = null;
      
      // Try to get existing registration
      if (navigator.serviceWorker.controller) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        registration = registrations.find(reg => 
          reg.active?.scriptURL.includes('firebase-messaging-sw.js') ||
          reg.active?.scriptURL.includes('firebase-messaging')
        ) || null;
      }

      // If no existing registration, register a new one
      if (!registration) {
        try {
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
          });
        } catch (error: any) {
          throw new Error(`Failed to register service worker: ${error.message}`);
        }
      }

      // Wait for service worker to be ready - this gives us the active registration
      const activeRegistration = await navigator.serviceWorker.ready;
      
      // Ensure we have a valid registration
      if (!activeRegistration) {
        throw new Error('Service worker registration failed. Please refresh the page and try again.');
      }
      
      // Wait for service worker to be active (not just installing)
      if (activeRegistration.installing) {
        await new Promise<void>((resolve) => {
          const installingWorker = activeRegistration.installing;
          if (installingWorker) {
            const stateChangeHandler = () => {
              if (installingWorker.state === 'activated' || installingWorker.state === 'redundant') {
                installingWorker.removeEventListener('statechange', stateChangeHandler);
                resolve();
              }
            };
            installingWorker.addEventListener('statechange', stateChangeHandler);
            // Timeout after 10 seconds
            setTimeout(() => {
              installingWorker.removeEventListener('statechange', stateChangeHandler);
              resolve();
            }, 10000);
          } else {
            resolve();
          }
        });
      }
      
      // Ensure registration has pushManager
      if (!activeRegistration.pushManager) {
        // Wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!activeRegistration.pushManager) {
          throw new Error('Service worker push manager is not available. Please ensure your browser supports push notifications and try again.');
        }
      }

      // Get FCM token
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey || vapidKey.trim().length === 0) {
        throw new Error('Firebase VAPID key not configured. Please set NEXT_PUBLIC_FIREBASE_VAPID_KEY in your environment variables.');
      }

      // Validate VAPID key format before passing to Firebase
      // Firebase will try to decode it internally, so we need to validate it first
      try {
        // Test if the key can be decoded (this will catch invalid base64)
        const testKey = vapidKey.trim();
        const base64Regex = /^[A-Za-z0-9_-]+$/;
        if (!base64Regex.test(testKey)) {
          throw new Error('VAPID key contains invalid characters');
        }
        // Try to decode it to ensure it's valid base64
        const padding = '='.repeat((4 - testKey.length % 4) % 4);
        const base64 = (testKey + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        window.atob(base64); // This will throw if invalid
      } catch (validationError: any) {
        const errorMsg = validationError.message?.includes('atob') || validationError.message?.includes('decoded')
          ? 'VAPID key is not a valid base64 string. Please check NEXT_PUBLIC_FIREBASE_VAPID_KEY in your Vercel environment variables.'
          : `Invalid VAPID key format: ${validationError.message}`;
        throw new Error(errorMsg);
      }

      // Ensure service worker is fully activated (especially important on mobile)
      if (activeRegistration.active) {
        // Wait a bit more for mobile browsers
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Verify pushManager is available
      if (!activeRegistration.pushManager) {
        throw new Error('Push Manager is not available. Your browser may not support push notifications.');
      }

      // Check if push subscription is supported (skip on mobile as FCM handles this)
      // This test can sometimes fail on mobile, so we'll skip it and let FCM handle it
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (!isMobile) {
        try {
          const subscription = await activeRegistration.pushManager.getSubscription();
          if (!subscription) {
            // Try to subscribe to verify push is working
            try {
              const vapidKeyArray = urlBase64ToUint8Array(vapidKey);
              const testSubscription = await activeRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: new Uint8Array(vapidKeyArray.buffer.slice(0)) as BufferSource,
              });
              // Unsubscribe immediately - we just wanted to test
              await testSubscription.unsubscribe();
            } catch (vapidError: any) {
              // If VAPID key is invalid, throw a more helpful error
              if (vapidError.message?.includes('VAPID') || vapidError.message?.includes('base64') || vapidError.message?.includes('atob')) {
                throw new Error(`Invalid VAPID key: ${vapidError.message}. Please check NEXT_PUBLIC_FIREBASE_VAPID_KEY in your Vercel environment variables.`);
              }
              throw vapidError;
            }
          }
        } catch (pushError: any) {
          console.error('Push subscription test failed:', pushError);
          if (pushError.message?.includes('not supported') || pushError.name === 'NotSupportedError') {
            throw new Error('Push notifications are not supported on this device or browser.');
          }
          // If it's a VAPID key error, re-throw it
          if (pushError.message?.includes('VAPID') || pushError.message?.includes('base64')) {
            throw pushError;
          }
          // Continue anyway - some browsers allow FCM without explicit subscription
        }
      }

      // Get token - explicitly pass the registration to ensure Firebase uses the correct one
      // On mobile, sometimes we need to retry
      let token: string | null = null;
      let retries = 3;
      
      while (!token && retries > 0) {
        try {
          console.log('getting token',vapidKey.trim());
          token = await getToken(messaging, {
            vapidKey: vapidKey.trim(), // Ensure trimmed key is passed
            serviceWorkerRegistration: activeRegistration,
          });
          
          if (token) break;
        } catch (tokenError: any) {
          console.error(`Token fetch attempt ${4 - retries} failed:`, tokenError);
          
          // Check for VAPID key decoding errors
          if (tokenError.message?.includes('atob') || 
              tokenError.message?.includes('decoded') || 
              tokenError.name === 'InvalidCharacterError' ||
              tokenError.message?.includes('not correctly encoded')) {
            throw new Error('Invalid VAPID key format. The NEXT_PUBLIC_FIREBASE_VAPID_KEY environment variable is not a valid base64 string. Please check your Vercel environment variables and ensure the key is correctly set.');
          }
          
          if (retries === 1) {
            // Last attempt failed
            if (tokenError.message?.includes('AbortError') || tokenError.message?.includes('push service error')) {
              throw new Error('Push service error. Please ensure you are using HTTPS and your device supports push notifications. Try refreshing the page and enabling notifications again.');
            }
            throw new Error(tokenError.message || 'Failed to get FCM token. Please try again.');
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        }
        retries--;
      }

      if (!token) {
        throw new Error('No FCM token available. Please check Firebase configuration and service worker.');
      }

      setFcmToken(token);

      // Save FCM token to database via Next.js API route
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            subscription: {
              token: token,
              fcmToken: token,
            }
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save subscription');
        }
      }

      toast({
        title: "Success",
        description: "Push notifications enabled successfully!",
      });

      return token;
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      
      let errorMessage = "Failed to enable push notifications.";
      if (error.message?.includes('Firebase') || error.message?.includes('VAPID')) {
        errorMessage = "Push notifications are not configured. Please contact the administrator or check Firebase configuration.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  };

  const unsubscribe = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFcmToken(null);
        return;
      }

      // Get current token if we have one
      let tokenToRemove = fcmToken;
      
      // If no token in state, try to get it from service worker
      if (!tokenToRemove && messaging && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          const vapidKeyForUnsubscribe = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() || '';
          if (!vapidKeyForUnsubscribe) {
            console.warn('VAPID key not available for unsubscribe');
            return;
          }
          tokenToRemove = await getToken(messaging, {
            vapidKey: vapidKeyForUnsubscribe,
            serviceWorkerRegistration: registration,
          });
        } catch (error) {
          console.error('Error getting token for unsubscribe:', error);
        }
      }

      // Remove all subscriptions for this user (or specific token if we have it)
      const response = await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          ...(tokenToRemove && { fcm_token: tokenToRemove })
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove subscription');
      }

      setFcmToken(null);

      toast({
        title: "Success",
        description: "Push notifications disabled.",
      });
    } catch (error: any) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disable push notifications.",
        variant: "destructive"
      });
    }
  };

  const sendTestNotification = async () => {
    try {
      if (permission !== 'granted') {
        toast({
          title: "Permission Required",
          description: "Please enable push notifications first.",
          variant: "destructive"
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to send test notifications.",
          variant: "destructive"
        });
        return;
      }

      // Check if user has a subscription
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (!subscriptions || subscriptions.length === 0) {
        toast({
          title: "No Subscription",
          description: "Please enable push notifications first to create a subscription.",
          variant: "destructive"
        });
        return;
      }

      // Send test notification through API
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          notification: {
            title: 'Test Notification',
            message: 'This is a test notification from Shining Motors!',
            type: 'test',
            data: {},
            url: '/'
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test notification');
      }

      const result = await response.json();
      
      if (result.sent > 0) {
        toast({
          title: "Test Sent",
          description: "Test notification sent successfully! Check your notifications.",
        });
      } else {
        toast({
          title: "Warning",
          description: "Test notification was not sent. Please check your subscription.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test notification.",
        variant: "destructive"
      });
    }
  };

  // Helper function to convert VAPID key to Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    // Validate input
    if (!base64String || typeof base64String !== 'string' || base64String.trim().length === 0) {
      throw new Error('VAPID key is empty or invalid. Please check NEXT_PUBLIC_FIREBASE_VAPID_KEY environment variable.');
    }

    // Remove any whitespace
    const trimmed = base64String.trim();
    
    // Validate base64 format (basic check)
    const base64Regex = /^[A-Za-z0-9_-]+$/;
    if (!base64Regex.test(trimmed)) {
      throw new Error('VAPID key contains invalid characters. It should be a valid base64 string.');
    }

    try {
      const padding = '='.repeat((4 - trimmed.length % 4) % 4);
      const base64 = (trimmed + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      // Additional validation: ensure the string is not empty after processing
      if (!base64 || base64.length === 0) {
        throw new Error('VAPID key is empty after processing.');
      }

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (error: any) {
      if (error.message?.includes('atob') || error.message?.includes('decoded')) {
        throw new Error('Failed to decode VAPID key. Please verify NEXT_PUBLIC_FIREBASE_VAPID_KEY is a valid base64 string.');
      }
      throw error;
    }
  };

  return {
    permission,
    subscription: fcmToken, // Keep for backward compatibility
    isSupported,
    requestPermission,
    subscribeUser,
    unsubscribe,
    sendTestNotification
  };
};