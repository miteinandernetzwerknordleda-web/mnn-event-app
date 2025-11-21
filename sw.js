const CACHE_NAME = 'mnn-cache-v4'; // NEUE VERSION!

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
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache Hit - liefere Cache-Antwort
                if (response) {
                    return response;
                }
                
                // Kein Cache Hit - gehe ins Netzwerk
                return fetch(event.request).then(
                    response => {
                        // Wenn es eine API-Anfrage (Google Calendar) ist, cachen wir die Antwort NICHT.
                        if (event.request.url.includes('googleapis.com')) {
                            return response;
                        }

                        // Bei allen anderen (eigenen) Ressourcen: Klonen der Antwort, um sie im Cache zu speichern
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Speichern der neuen Ressource im Cache
                                // Wir cachen nur GET-Anfragen (Standard) und erfolgreiche Antworten (Status 200)
                                if (responseToCache.status === 200 && event.request.method === 'GET') {
                                    cache.put(event.request, responseToCache);
                                }
                            });

                        return response;
                    }
                );
            })
            // Fallback für den Fall, dass fetch() fehlschlägt (z.B. keine Internetverbindung)
            .catch(() => {
                 // Hier könnte eine Offline-Fallback-Seite geliefert werden,
                 // aber da wir index.html im Cache haben, wird die App einfach mit Cache-Daten gestartet.
                 return caches.match('/index.html'); 
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