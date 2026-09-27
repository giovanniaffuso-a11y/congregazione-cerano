// sw-offline.js — fa aprire le app di Giovanni anche SENZA internet.
// Ogni pagina che lo registra viene salvata sul dispositivo.
// Riguarda solo le pagine che lo registrano (Congresso luglio, Assemblea ottobre):
// le altre app del cruscotto non vengono toccate.
const CACHE = 'offline-pagine-v1';
const PAGE = self.registration.scope; // indirizzo esatto della pagina

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.add(PAGE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname !== new URL(PAGE).pathname) return;

  // Apre subito la copia salvata; se c'è internet la aggiorna in sottofondo
  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(PAGE).then(cached => {
        const network = fetch(req).then(res => {
          if (res && res.ok) cache.put(PAGE, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    )
  );
});
