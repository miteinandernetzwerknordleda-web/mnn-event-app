const CACHE_NAME = 'mnn-cache-v39';
const APP_PATH = '/mnn-event-app/';

const urlsToCache = [
    APP_PATH,
    APP_PATH + 'index.html',
    APP_PATH + 'manifest.json',
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
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Lösche JEDEN Cache, der nicht exakt mnn-cache-vAKTUELL heißt
                    if (cacheName !== CACHE_NAME) {
                        console.log('Lösche alten Cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Übernimmt sofort die Kontrolle
    );
});

// 3. Fetch-Strategie
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 1. EXTERNE ANFRAGEN (Google)
    if (url.origin !== location.origin) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response.status === 200 || response.status === 0) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // 2. INTERNE DATEIEN & NAVIGATION
    event.respondWith(
        caches.match(event.request).then(response => {
            // Wenn die Datei im Cache ist, gib sie zurück
            if (response) return response;

            // FALLBACK: Wenn offline und eine Seite (Navigation) angefordert wird
            return fetch(event.request).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match(APP_PATH + 'index.html');
                }
            });
        })
    );
});