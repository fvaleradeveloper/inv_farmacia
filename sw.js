const CACHE_NAME = 'farma-delivery-v1';
const ASSETS = [
  './inventario.html',
  './manifest.json'
];

// Instalar el service worker y cachear los assets principales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activar el service worker y limpiar caches antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones de red (offline-first)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en cache, devolverlo; si no, intentar la red
        if (response) {
          return response;
        }
        return fetch(event.request).then((networkResponse) => {
          // Clonar la respuesta para cachearla
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Si falla la red y no está en cache, devolver una respuesta vacía
          return new Response('Sin conexión', { status: 503, statusText: 'Sin conexión' });
        });
      })
  );
});
