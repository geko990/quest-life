// KILL SWITCH SERVICE WORKER v2.7.54
// This worker is designed to PURGE everything and force a fresh start.

const CACHE_NAME = 'quest-life-v2.7.54-KILL';

self.addEventListener('install', (e) => {
    // Force immediate activation
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            // Delete ALL caches indiscriminately
            return Promise.all(keys.map((key) => caches.delete(key)));
        }).then(() => {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (e) => {
    // Network Only - bypass cache entirely
    e.respondWith(
        fetch(e.request).catch(() => {
            // If offline and no cache (because we deleted it), show simple message
            return new Response("Update in progress. Please refresh page when online.", {
                headers: { 'Content-Type': 'text/plain' }
            });
        })
    );
});
