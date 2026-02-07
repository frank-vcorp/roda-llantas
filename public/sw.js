// Basic Service Worker for Roda Llantas Pro
const CACHE_NAME = 'roda-llantas-v2';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/icon-192x192.png',
                '/icon-512x512.png',
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip non-GET requests (like POST for server actions)
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip navigation requests (document) to allow server-side redirects/middleware to work
    if (event.request.mode === 'navigate') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch((err) => {
                console.log('[SW] Fetch failed:', err);
                // Optionally return a fallback or rethrow
                throw err;
            });
        })
    );
});
