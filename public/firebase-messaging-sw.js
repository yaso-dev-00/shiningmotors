// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const CACHE_NAME = 'shining-motors-pwa-v1';
const PRECACHE_URLS = ['/', '/offline.html', '/manifest.json', '/logo.jpg'];

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyB1Jho10VLXwAv2Gwkh9rqy7bObQ4V8jE0",
  authDomain: "shining-motors-d75ce.firebaseapp.com",
  projectId: "shining-motors-d75ce",
  storageBucket: "shining-motors-d75ce.firebasestorage.app",
  messagingSenderId: "367076799888",
  appId: "1:367076799888:web:9b69d0b6ca6e7e6619af15"
});

const messaging = firebase.messaging();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || request.url.startsWith('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type === 'opaque'
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const data = payload.data || {};

  const notificationTitle =
    data.title ||
    payload.notification?.title ||
    'New Notification';

  const notificationOptions = {
    body: data.message || payload.notification?.body || '',
    icon: data.icon || payload.notification?.icon || '/logo.jpg',
    badge: data.badge || '/logo.jpg',
    tag: data.tag || `notification_${data.type || 'general'}`,
    data: {
      ...data,
      url:
        data.url ||
        payload.notification?.click_action ||
        '/',
    },
    actions: [
      {
        action: data.view_action || 'view',
        title: data.view_title || 'View',
        icon: data.view_icon || '/logo.jpg',
      },
      {
        action: data.dismiss_action || 'dismiss',
        title: data.dismiss_title || 'Dismiss',
      },
    ],
  };
   
   self.registration.showNotification(
    notificationTitle,
    notificationOptions
   )
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const data = event.notification.data;
    let url = '/';
    
    // Social notification types
    if (data.type === 'post_like' || data.type === 'post_comment') {
      url = data.url || `/social/post/${data.post_id || ''}`;
    } else if (data.type === 'new_post') {
      url = data.url || `/social/post/${data.post_id || ''}`;
    } else if (data.type === 'new_follower') {
      url = data.url || `/profile/${data.follower_id || ''}`;
    } else if (data.type === 'order_created' || data.type === 'order_status' || data.type === 'vendor_new_order') {
      url = data.url || `/shop/orders${data.order_id ? `/${data.order_id}` : ''}`;
    } else if (data.type === 'payment_success' || data.type === 'payment_failed') {
      url = data.url || `/shop/orders${data.order_id ? `/${data.order_id}` : ''}`;
    } else if (data.type === 'event_registration_confirmed' || 
               data.type === 'event_registration_pending' || 
               data.type === 'event_registration_rejected' ||
               data.type === 'event_created' ||
               data.type === 'event_updated' ||
               data.type === 'event_cancelled') {
      url = data.url || `/events${data.event_id ? `/${data.event_id}` : ''}`;
    } else if (data.type === 'service_booking_confirmed' || 
               data.type === 'service_booking_pending' || 
               data.type === 'service_booking_rejected' ||
               data.type === 'vendor_new_booking') {
      url = data.url || `/myServiceBookings${data.service_id ? `?service=${data.service_id}` : ''}`;
    } else if (data.type === 'product_restock' || 
               data.type === 'price_drop' || 
               data.type === 'new_product' ||
               data.type === 'product_purchase' || 
               data.type === 'product_update') {
      url = data.url || `/shop/product/${data.product_id || ''}`;
    } else if (data.type === 'event_reminder') {
      url = data.url || `/events${data.event_id ? `/${data.event_id}` : ''}`;
    } else if (data.type === 'service_booking_reminder') {
      url = data.url || `/myServiceBookings${data.service_id ? `?service=${data.service_id}` : ''}`;
    } else if (data.type === 'abandoned_cart') {
      url = data.url || '/shop/cart';
    } else if (data.type === 'test') {
      url = data.url || '/';
    } else if (data.url) {
      url = data.url;
    }
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

