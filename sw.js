const CACHE_NAME = 'quest-life-v2.7.53';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './icon.png',
    './chart.min.js'
];

// Install Event
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (e) => {
    // Navigation requests (HTML pages) - Network First, fall back to cache
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request)
                .then(response => {
                    return response;
                })
                .catch(() => {
                    return caches.match(e.request);
                })
        );
        return;
    }

    // Asset requests (CSS, JS, Images) - Cache First, fall back to network
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
