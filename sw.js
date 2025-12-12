const CACHE_NAME = 'lingoflow-v18'; // Increment version
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/js/app.js',
    '/js/state.js',
    '/js/core/srs.js',
    '/js/core/storage.js',
    '/js/core/grammar.js',
    // '/js/core/parser.js', // Removed
    '/js/ui/dashboard.js',
    '/js/ui/review.js',
    '/js/ui/dictionary.js',
    '/js/ui/library.js', // New
    '/js/games/memory.js',
    '/js/games/raindrop.js',
    '/js/games/crossword.js',
    '/data/decks.json', // Critical
    '/data/json/vocabulary.json' // Critical sample
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching assets');
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[SW] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Only handle HTTP/HTTPS
    if (!e.request.url.startsWith('http')) return;

    // Cache Strategy: Stale-While-Revalidate for Data, Cache-First for Assets
    const isData = e.request.url.includes('/data/');

    e.respondWith(
        caches.match(e.request).then((cached) => {
            // If data, try to revalidate in background (if we want updates)
            // But user asked for "Cache-First" for data/json/ so once downloaded, it works offline locally forever.
            // "once the user downloads the 9,000 words, they work offline forever."
            // So default Cache-First is perfect.

            if (cached) return cached;

            return fetch(e.request).then((res) => {
                // Determine if we should cache this response
                if (res && res.status === 200 && res.type === 'basic') {
                    // Cache dynamic requests (like future deck files)
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                }
                return res;
            }).catch(() => {
                if (e.request.mode === 'navigate') {
                    return caches.match('/index.html')
                        .then(r => r || caches.match('/'));
                }
            });
        })
    );
});
