// TripDee Web Push Service Worker
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || '🚐 มีงานใหม่เข้ามา! (TripDee)';
  const options = {
    body: data.body || 'มีลูกค้าลงประกาศหาคนขับในระบบ แตะเพื่อดูรายละเอียดและรับงานทันที',
    icon: data.icon || '/app-icon.png',
    badge: data.badge || '/app-icon.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'tripdee-job-' + Date.now(),
    renotify: true,
    data: {
      url: data.url || '/#trip-board',
    },
    actions: [
      { action: 'open', title: 'ดูงานทันที' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/#trip-board';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If TripDee tab is already open, focus and navigate
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return client;
        }
      }
      // Otherwise open a new browser window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
