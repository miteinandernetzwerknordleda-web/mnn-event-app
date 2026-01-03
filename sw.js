const CACHE_NAME = 'mnn-cache-v6'; // Version auf v6 erhöht

const APP_PATH = '/mnn-event-app/';

const urlsToCache = [
    APP_PATH,
    APP_PATH + 'index.html',
    APP_PATH + 'manifest.json',
    APP_PATH + 'sw.js',
    APP_PATH + 'icons/icon-192x192.png',
    APP_PATH + 'icons/icon-512x512.png',
    APP_PATH + 'logo.png',
    APP_PATH + 'Splashlogo.png',
    APP_PATH + 'mnnsplashadv1.jpg',
    APP_PATH + 'mnnsplashadv2.jpg',
    APP_PATH + 'mnnsplashadv3.jpg',
    APP_PATH + 'mnnsplashadv4.jpg',
    APP_PATH + 'mnnsplashtannen.jpg',
    APP_PATH + 'mnnsplashfeuerwerk.jpg',
    APP_PATH + 'mnnsplashvalentins.jpg',
    APP_PATH + 'mnnsplashostern.jpg',
    APP_PATH + 'mnnsplashdeutsch.jpg'
];

// 1. Installation: Neuen Service Worker sofort erzwingen
self.addEventListener('install', event => {
    self.skipWaiting(); // Erzwingt, dass der neue SW sofort aktiv wird
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Cache geöffnet, Dateien werden geladen...');
            return cache.addAll(urlsToCache);
        })
    );
});

// 2. Aktivierung: Alte Caches löschen und Kontrolle sofort übernehmen
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            clients.claim(), // Übernimmt sofort die Kontrolle über alle offenen Tabs
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Lösche alten Cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// 3. Fetch-Strategie: Network-First für API, Cache-First für Dateien
self.addEventListener('fetch', event => {
    // Spezial-Logik für Google API (Events)
    if (event.request.url.includes('googleapis.com')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Wenn Netzwerk ok: Kopie in den Cache
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Wenn offline: Schau im Cache nach
                    return caches.match(event.request);
                })
        );
        return; 
    }

    // Standard-Logik für statische Dateien (index, css, bilder)
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => {
                // Falls alles fehlschlägt (z.B. Offline-Start ohne Cache-Treffer)
                if (event.request.mode === 'navigate') {
                    return caches.match(APP_PATH + 'index.html');
                }
            });
        })
    );
});