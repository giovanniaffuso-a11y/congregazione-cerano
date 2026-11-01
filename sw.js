// Service Worker del cruscotto "Congregazione di Cerano" (aggiornato 01/11/2026)
// Prima la rete, poi la copia salvata:
// - se c'è internet, apre SEMPRE la versione più nuova delle app e la salva;
// - se non c'è internet, apre l'ultima copia salvata sul dispositivo.

const CACHE_NAME = 'cerano-v3';

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

// Cancella le cache vecchie (anche quella "congresso2026-v2" della versione precedente)
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME && key !== 'offline-pagine-v1'; })
            .map(function (key) { return caches.delete(key); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return; // siti esterni (jsonbin, Google...) non toccati

  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(function (response) {
        if (response && response.status === 200) {
          const copia = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copia); });
        }
        return response;
      })
      .catch(function () {
        return caches.match(req, { ignoreSearch: true });
      })
  );
});
