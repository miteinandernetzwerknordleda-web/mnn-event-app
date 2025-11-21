const CACHE_NAME = 'mnn-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    // PWA-Dateien
    '/manifest.json',
    '/sw.js',
    // Logodateien (müssen alle hier gelistet werden)
    '/logo.png',
    '/mnnsplashadv1.jpg',
    '/mnnsplashadv2.jpg',
    '/mnnsplashadv3.jpg',
    '/mnnsplashadv4.jpg',
    '/mnnsplashtannen.jpg',
    '/mnnsplashfeuerwerk.jpg',
    '/mnnsplashvalentins.jpg',
    '/mnnsplashostern.jpg',
    '/mnnsplashdeutsch.jpg',
    // Icons (falls im icons Ordner)
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
    // Hier können weitere benötigte CSS/JS-Dateien folgen
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
                        // Wenn der API-Aufruf erfolgreich war, aktualisiere NICHT den Cache
                        if (event.request.url.includes('googleapis.com')) {
                            return response;
                        }

                        // Ansonsten: Klonen der Antwort, um sie im Cache zu speichern
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Speichern der neuen Ressource im Cache
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
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