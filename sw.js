const CACHE_NAME = 'mnn-cache-v5'; // NEUE VERSION!

const APP_PATH = '/mnn-event-app/';

const urlsToCache = [
    APP_PATH,
    APP_PATH + 'index.html',
    // PWA-Dateien
    APP_PATH + 'manifest.json',
    APP_PATH + 'sw.js',
    // Icons
    APP_PATH + 'icons/icon-192x192.png',
    APP_PATH + 'icons/icon-512x512.png',
    // ALLE Logodateien für den Splash-Screen
    APP_PATH + 'logo.png', // Standard
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

// Installation: Cache alle Ressourcen
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                // Fügt alle Dateien dem Cache hinzu
                return cache.addAll(urlsToCache).catch(error => {
                    console.error('Caching failed:', error);
                });
            })
    );
});

// Abfangen von Anfragen und Laden aus dem Cache (Network-first Strategie für APIs)
self.addEventListener('fetch', event => {
    // Spezial-Logik für Google API (Events)
    if (event.request.url.includes('googleapis.com')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Wenn erfolgreich: Antwort klonen und im Cache speichern
                    if (response.status === 200) {
                        let responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Wenn Netzwerk fehlschlägt: Im Cache nachschauen
                    return caches.match(event.request);
                })
        );
        return; // Wichtig, damit die allgemeine Logik unten nicht auch noch greift
    }

    // Standard-Logik für alle anderen Dateien (Bilder, HTML, CSS)
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // Aus dem Cache laden
                }
                return fetch(event.request); // Vom Netzwerk laden
            })
    );
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});