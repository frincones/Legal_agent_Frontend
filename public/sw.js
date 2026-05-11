// LexAI · Service Worker · Web Push (Sprint 5)
// Handles incoming push events and click navigation.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'LexAI', body: event.data ? event.data.text() : 'Nueva notificación' };
  }
  const title = data.title || 'LexAI';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon.svg',
    badge: '/icon.svg',
    data: { url: data.url || '/inbox' },
    tag: data.tag,
    renotify: true,
    requireInteraction: data.severidad === 'critica',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const sameOrigin = clientsArr.find((c) => c.url && c.focus);
      if (sameOrigin) {
        await sameOrigin.focus();
        sameOrigin.postMessage({ type: 'lexai:navigate', url: target });
        return;
      }
      await self.clients.openWindow(target);
    })(),
  );
});
