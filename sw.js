// Service Worker per "Felici Per Sempre — Congresso 2026"
// Salva la pagina nella memoria del telefono al primo caricamento
// (con connessione), così l'app si apre anche senza campo/internet.

const CACHE_NAME = 'congresso2026-v2'; // versione aumentata: forza il rinnovo della cache
const URLS_TO_CACHE = [
  './Congresso2026_Appunti_Interattivi.html'
];

// All'installazione, salva subito la pagina principale in cache.
// Ogni file viene salvato singolarmente: se uno fallisse, non blocca gli altri
// (prima il problema era che un errore su un singolo file bloccava tutto).
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(
        URLS_TO_CACHE.map(function (url) {
          return cache.add(url).catch(function (err) {
            console.log('Impossibile salvare in cache:', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Alla riattivazione, elimina eventuali cache vecchie di versioni precedenti
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Per ogni richiesta: se c'è già in cache, usa quella (veloce e offline);
// nel frattempo prova comunque ad aggiornarla dalla rete, se disponibile.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      const networkFetch = fetch(event.request)
        .then(function (response) {
          if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(function () {
          return cached; // niente rete: usa la copia salvata, se c'è
        });

      return cached || networkFetch;
    })
  );
});
