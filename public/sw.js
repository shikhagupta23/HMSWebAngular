// sw.js - Service Worker for notifications
console.log('Service Worker file loaded');

self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
  console.log('📩 Service Worker received message:', event.data);
  
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data;
    
    console.log('🔔 Showing notification via Service Worker');
    
    self.registration.showNotification(title, {
      body: body,
      icon: '/favicon.ico',
      tag: tag || 'browser-close',
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200],
      badge: '/favicon.ico'
    }).then(() => {
      console.log('✅ Notification shown successfully');
    }).catch((error) => {
      console.error('❌ Notification error:', error);
    });
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked');
  event.notification.close();
  
  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (let client of clientList) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow('/');
    })
  );
});
