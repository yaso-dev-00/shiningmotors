// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: data.type,
      data: data,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/logo.jpg'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Handle click on notification (not just action button)
  if (event.action === 'view' || !event.action) {
    // Open the app to relevant page based on notification type
    const data = event.notification.data;
    let url = '/';
    
    // Social notification types
    if (data.type === 'post_like' || data.type === 'post_comment') {
      url = data.url || `/social/post/${data.data?.post_id || ''}`;
    } else if (data.type === 'new_post') {
      url = data.url || `/social/post/${data.data?.post_id || ''}`;
    } else if (data.type === 'test') {
      url = data.url || '/';
    } else if (data.type === 'product_purchase' || data.type === 'product_update') {
      url = `/shop/product/${data.data?.product_id || ''}`;
    } else if (data.type === 'order_status') {
      url = `/shop/orders/${data.data?.order_id || ''}`;
    } else if (data.url) {
      url = data.url;
    }
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  // Track notification dismissal if needed
  console.log('Notification dismissed:', event.notification.tag);
});