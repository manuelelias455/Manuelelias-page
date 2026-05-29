// Service Worker: network-first für immer aktuelle Inhalte, Offline-Fallback aus Cache.
const CACHE = 'rv-cache-v1';

self.addEventListener('install', () => {
  // Sofort aktivieren, nicht auf das Schließen alter Tabs warten
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Alte Caches aufräumen
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith((async () => {
    try {
      // Immer zuerst aus dem Netzwerk laden, HTTP-Cache des Browsers umgehen
      const fresh = await fetch(req, { cache: 'no-store' });
      const cache = await caches.open(CACHE);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      // Offline: aus Cache bedienen
      const cached = await caches.match(req);
      if (cached) return cached;
      throw err;
    }
  })());
});
