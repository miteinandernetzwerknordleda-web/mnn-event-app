const CACHE_NAME = 'mnn-cache-v3'; // Wir erhöhen die Version, um alle neuen Logos zu cachen!
const urlsToCache = [
	'/mnn-event-app/', // Wichtig: Pfad zur Hauptseite muss enthalten sein
    '/index.html',
    // PWA-Dateien
    '/manifest.json',
    '/sw.js',
    // Icons (Muss zum Pfad in manifest.json passen)
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    // ALLE Logodateien für den Splash-Screen (Muss den Dateinamen im JS entsprechen)
    '/logo.png', // Standard
	'/Splashlogo.png', // Standard
    '/mnnsplashadv1.jpg',
    '/mnnsplashadv2.jpg',
    '/mnnsplashadv3.jpg',
    '/mnnsplashadv4.jpg',
    '/mnnsplashtannen.jpg',
    '/mnnsplashfeuerwerk.jpg',
    '/mnnsplashvalentins.jpg',
    '/mnnsplashostern.jpg',
    '/mnnsplashdeutsch.jpg',
    // Wir cachen auch die CSS-Dateien, wenn Sie diese ausgelagert haben. 
    // Da hier alles in index.html ist, sind die oben genannten Dateien ausreichend.
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