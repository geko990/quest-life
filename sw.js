// QUEST LIFE SERVICE WORKER v3.2.13
// Network-First strategy for HTML to prevent stale versions

const CACHE_NAME = 'quest-life-v3.2.13';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './js/modules/constants.js',
    './js/modules/state.js',
    './js/modules/utils.js',
    './js/modules/storage.js',
    './icon.png',
    './chart.min.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Force fetch with timestamp to bypass HTTP cache
            const assetsWithCacheBust = ASSETS.map(url => {
                if (url.includes('index.html') || url.includes('app.js') || url.includes('styles.css')) {
                    return url + '?t=' + Date.now();
                }
                return url;
            });
            return cache.addAll(assetsWithCacheBust);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    // Navigation requests (HTML) - Network First
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request)
                .then(response => response)
                .catch(() => caches.match(e.request))
        );
        return;
    }

    // Other assets - Cache First
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
