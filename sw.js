// ============================================================
// SERVICE WORKER – Schiffslogbuch
// Cached alle App-Dateien beim ersten Laden.
// Danach funktioniert die App komplett offline.
// Version hochzählen um Cache zu invalidieren nach Updates.
// ============================================================
const CACHE_NAME = 'logbuch-v6';
const FILES = [
  './',
  './index.html',
  './manifest.json'
];

// Install: Dateien in Cache legen
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// Activate: alten Cache löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Cache-first Strategie
// → Zuerst aus Cache laden, sonst Netzwerk
// → Netzwerk-Antwort wird im Cache aktualisiert
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Nur gültige Antworten cachen
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      }).catch(() => cached); // Offline-Fallback
    })
  );
});
