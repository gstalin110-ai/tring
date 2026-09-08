const CACHE_NAME = 'exit-trading-v2.0.0';
const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

// Archivos estáticos para cachear inicialmente
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/socket.io/socket.io.js'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[Service Worker] Cachéando archivos estáticos');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('[Service Worker] Instalación completada');
                return self.skipWaiting(); // Activar inmediatamente
            })
            .catch((error) => {
                console.error('[Service Worker] Error en instalación:', error);
            })
    );
});

// Activación del service worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activando...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Eliminar caches antiguos
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activación completada');
                return self.clients.claim(); // Tomar control inmediato
            })
            .catch((error) => {
                console.error('[Service Worker] Error en activación:', error);
            })
    );
});

// Estrategia de caché: Network First con fallback a Cache
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Para solicitudes de Socket.io, siempre network first
    if (url.pathname.startsWith('/socket.io/')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    console.log('[Service Worker] Socket.io offline - usando cache si disponible');
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // Para solicitudes API, network first con timeout
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            Promise.race([
                fetch(event.request),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ])
            .then((response) => {
                // Cachear respuestas exitosas
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback a cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('[Service Worker] API offline - usando cache');
                        return cachedResponse;
                    }
                    // Respuesta personalizada para offline
                    return new Response(
                        JSON.stringify({ 
                            error: 'Offline', 
                            message: 'No hay conexión a internet. Usando datos cacheados.' 
                        }),
                        { 
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                });
            })
        );
        return;
    }
    
    // Para archivos estáticos, cache first con network fallback
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[Service Worker] Sirviendo desde cache:', event.request.url);
                    return cachedResponse;
                }
                
                return fetch(event.request)
                    .then((response) => {
                        // Cachear nuevas respuestas
                        if (response.ok) {
                            const clone = response.clone();
                            caches.open(DYNAMIC_CACHE).then((cache) => {
                                cache.put(event.request, clone);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Fallback para páginas HTML
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Sincronización en background (para cuando vuelva la conexión)
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-analyses') {
        event.waitUntil(syncAnalyses());
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push notification recibida');
    
    const options = {
        body: event.data ? event.data.text() : 'Nueva señal de trading disponible',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver Análisis',
                icon: '/icons/icon-96x96.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/icons/icon-96x96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Exit Trading', options)
    );
});

// Manejo de notificaciones clickeadas
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notificación clickeada');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Función para sincronizar análisis cuando vuelva la conexión
async function syncAnalyses() {
    try {
        console.log('[Service Worker] Sincronizando análisis...');
        
        // Aquí implementarías la lógica para sincronizar datos locales con el servidor
        // Por ejemplo, enviar análisis guardados localmente al servidor
        
        console.log('[Service Worker] Sincronización completada');
    } catch (error) {
        console.error('[Service Worker] Error en sincronización:', error);
    }
}

// Mensajes desde el cliente
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Mensaje recibido:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE)
                .then((cache) => cache.addAll(event.data.urls))
        );
    }
});

// Limpieza periódica de cache
self.addEventListener('periodicsync', (event) => {
    console.log('[Service Worker] Periodic sync:', event.tag);
    
    if (event.tag === 'cleanup-cache') {
        event.waitUntil(cleanupCache());
    }
});

async function cleanupCache() {
    try {
        const cacheNames = await caches.keys();
        const now = Date.now();
        const MAX_AGE = 24 * 60 * 60 * 1000; // 24 horas
        
        for (const cacheName of cacheNames) {
            if (cacheName === DYNAMIC_CACHE) {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                
                for (const request of requests) {
                    const response = await cache.match(request);
                    const date = response.headers.get('date');
                    
                    if (date) {
                        const age = now - new Date(date).getTime();
                        if (age > MAX_AGE) {
                            await cache.delete(request);
                            console.log('[Service Worker] Eliminado cache antiguo:', request.url);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('[Service Worker] Error en limpieza de cache:', error);
    }
}