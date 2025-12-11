const CACHE_NAME = 'lingoflow-v16'; // Increment version to force update
const ASSETS = [
    '/',
    '/index.html',
    '/js/app.js',
    '/js/srs.js',
    '/js/storage.js',
    '/js/games.js',
    '/js/dictionary.js',
    '/data/vocabulary.csv'
];

self.addEventListener('install', (e) => {
    self.skipWaiting(); // Force new SW to take over immediately
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
    return self.clients.claim(); // Control all clients immediately
});

// Only handle HTTP/HTTPS
if (!e.request.url.startsWith('http')) return;

// Ignore Cross-Origin (CDNs, etc)
if (!e.request.url.startsWith(self.location.origin)) return;

// IGNORE /tests/ directory

// IGNORE /tests/ directory
if (e.request.url.includes('/tests/')) return;

e.respondWith(
    caches.match(e.request).then((cached) => {
        // 1. Try Cache
        if (cached) return cached;

        // 2. Network (and cache result)
        return fetch(e.request).then((res) => {
            // Determine if we should cache this response
            // Cache everything that is successful
            if (res && res.status === 200 && res.type === 'basic') {
                const clone = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
            }
            return res;
        }).catch(() => {
            // 3. Offline Fallback for Navigation
            if (e.request.mode === 'navigate') {
                return caches.match('/index.html')
                    .then(r => r || caches.match('/'));
            }
        });
    })
);
});
