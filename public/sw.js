// RPG LIFE SERVICE WORKER
const CACHE_NAME = 'rpg-life-v5.9.244-1793173779824';
const SW_VERSION = '5.9.244';

// Assets to precache on install (app shell)
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './icon.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// File che non cambiano mai (nome con impronta, es. assets/index-AbC123.js) e caratteri di Google:
// stanno in una cache a parte che sopravvive agli aggiornamenti, e si usano subito dal telefono.
const STATIC_CACHE = 'ql-static-v1';
const STATIC_MAX_ENTRIES = 60;
const NAV_TIMEOUT_MS = 400; // la pagina si chiede alla rete, ma senza aspettarla più di così (prima 1,2 s: schermo nero)

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE).map((key) => caches.delete(key))
      );
    }).then(() => trimStaticCache()).then(() => self.clients.claim())
  );
});

async function trimStaticCache() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const keys = await cache.keys();
    const extra = keys.length - STATIC_MAX_ENTRIES;
    for (let i = 0; i < extra; i++) await cache.delete(keys[i]); // i più vecchi per primi
  } catch (_) {}
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isImmutable(url) {
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') return true;
  return url.origin === self.location.origin && /\/assets\/[^/]+-[A-Za-z0-9_-]{6,}\.[a-z0-9]+$/i.test(url.pathname);
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  // i caratteri arrivano "opachi" (status 0): vanno bene lo stesso
  if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone()).catch(() => {});
  return response;
}

function saveCopy(request, response) {
  if (response && response.status === 200 && request.url.startsWith('http')) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
  }
  return response;
}

// Pagina: rete per avere sempre l'ultima versione, ma se la rete è lenta si apre la copia salvata
// (l'aggiornamento arriva comunque: l'app controlla version.json all'avvio)
async function navigation(request) {
  const network = fetch(request).then((response) => saveCopy(request, response));
  const cached = await caches.match(request, { ignoreSearch: true }) || await caches.match('./index.html');
  if (!cached) return network;
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NAV_TIMEOUT_MS));
  const winner = await Promise.race([network.catch(() => null), timeout]);
  return winner || cached;
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // Never cache version.json or sw.js; always fetch fresh from network without HTTP cache
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/sw.js')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
    );
    return;
  }

  if (isImmutable(url)) {
    event.respondWith(cacheFirst(event.request).catch(() => caches.match(event.request)));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(navigation(event.request));
    return;
  }

  // Tutto il resto (icona, manifest...): rete, con la copia salvata se offline
  event.respondWith(
    fetch(event.request)
      .then((response) => saveCopy(event.request, response))
      .catch(() => caches.match(event.request))
  );
});

// Tocco su un promemoria di scadenza: riporta in primo piano l'app (o la apre)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow('./') : undefined;
    })
  );
});
