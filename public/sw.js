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
  
  if (event.action === 'view') {
    // Open the app to relevant page based on notification type
    const data = event.notification.data;
    let url = '/';
    
    if (data.type === 'product_purchase' || data.type === 'product_update') {
      url = `/product/${data.data.product_id}`;
    } else if (data.type === 'order_status') {
      url = `/order/${data.data.order_id}`;
    }
    
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  // Track notification dismissal if needed
  console.log('Notification dismissed:', event.notification.tag);
});