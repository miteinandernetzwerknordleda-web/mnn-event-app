const CACHE_NAME = 'mnn-cache-v7'; // Version auf v7 erhöht

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

// 3. Fetch-Strategie
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // PRÜFUNG: Ist es eine externe Anfrage? (z.B. Google Kalender)
    // Wenn die URL NICHT deine Domain ist, nutzen wir Network-First
    if (url.origin !== location.origin) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response.status === 200 || response.status === 0) { // status 0 für "opaque" Antworten
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Standard-Logik für deine internen Dateien (index.html, Bilder etc.)
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});