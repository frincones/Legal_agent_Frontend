// LexAI · Service Worker v2 · Sprint 12
// - Web Push (Sprint 5)
// - Cache strategies (Sprint 12):
//     · App shell + static assets: cache-first
//     · API GET: stale-while-revalidate (con lista whitelist)
//     · API mutations offline: encolar en IndexedDB y reenviar al volver online
// - Background sync para offline mutations
//
// El SW se instala SOLO si el usuario activa PWA desde la UI (PushEnableButton
// o PWAInstallPrompt). Si no se registra, todo el resto de la app funciona
// igual que sin SW (fetch directo del navegador).

const VERSION = 'lexai-v2-2026-05-13';
const STATIC_CACHE = `${VERSION}-static`;
const API_CACHE = `${VERSION}-api`;

const STATIC_ASSETS = [
  '/',
  '/icon.svg',
  '/manifest.webmanifest',
];

const SWR_API_PATHS = [
  '/api/quotas/current',
  '/api/inbox/counts',
  '/api/insights/counts',
  '/api/billing/subscription',
];

const NEVER_CACHE = [
  '/api/auth',
  '/api/voice/ws',
  '/api/canvas/generate',
  '/api/push',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => !n.startsWith(VERSION)).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.method !== 'GET') {
    if (NEVER_CACHE.some((p) => url.pathname.startsWith(p))) return;
    event.respondWith(handleMutation(req));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  if (SWR_API_PATHS.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(staleWhileRevalidate(req, API_CACHE));
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
    return;
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return cached || new Response('offline', { status: 503 });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirst(req) {
  try {
    return await fetch(req);
  } catch (e) {
    const cache = await caches.open(STATIC_CACHE);
    return (await cache.match('/')) || new Response('offline', { status: 503 });
  }
}

// ────────────────────────────────────────────────────────────────────
// Background sync para mutations offline
// ────────────────────────────────────────────────────────────────────

async function handleMutation(req) {
  try {
    return await fetch(req.clone());
  } catch (e) {
    try {
      const clientRequestId = req.headers.get('x-client-request-id');
      const body = await req.clone().text();
      const payload = body ? safeParse(body) : null;
      const url = new URL(req.url);
      await enqueueOffline({
        client_request_id: clientRequestId || generateUUID(),
        method: req.method,
        url: url.pathname + url.search,
        payload,
        enqueued_at: Date.now(),
      });
      broadcastQueueChange();
      return new Response(JSON.stringify({ offline: true, queued: true }), {
        status: 202,
        headers: { 'content-type': 'application/json', 'x-lexai-offline': '1' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'offline', detail: String(err) }), {
        status: 503,
        headers: { 'content-type': 'application/json' },
      });
    }
  }
}

const DB_NAME = 'lexai-sw';
const DB_VERSION = 1;
const STORE = 'sync_queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'client_request_id' });
        store.createIndex('enqueued_at', 'enqueued_at');
      }
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function enqueueOffline(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function drainQueue() {
  const db = await openDB();
  const items = await new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
  for (const item of items.sort((a, b) => a.enqueued_at - b.enqueued_at)) {
    try {
      const r = await fetch(item.url, {
        method: item.method,
        headers: {
          'content-type': 'application/json',
          'x-client-request-id': item.client_request_id,
        },
        body: item.payload ? JSON.stringify(item.payload) : undefined,
        credentials: 'include',
      });
      if (r.ok || r.status === 409) {
        await deleteItem(item.client_request_id);
      }
    } catch (e) {
      // sigue offline, reintenta luego
    }
  }
  broadcastQueueChange();
}

async function deleteItem(client_request_id) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(client_request_id);
    tx.oncomplete = () => resolve();
  });
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'lexai-drain-queue') {
    event.waitUntil(drainQueue());
  }
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'lexai:drain-now') {
    event.waitUntil(drainQueue());
  }
});

function broadcastQueueChange() {
  self.clients.matchAll({ type: 'window' }).then((clients) => {
    clients.forEach((c) => c.postMessage({ type: 'lexai:queue-changed' }));
  });
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }
function generateUUID() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)
  );
}

// ────────────────────────────────────────────────────────────────────
// Web Push (Sprint 5)
// ────────────────────────────────────────────────────────────────────

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
    data: { url: data.url || '/notificaciones' },
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
    })()
  );
});
