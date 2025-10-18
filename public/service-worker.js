// SmartSales365 Service Worker
// Versión de caché
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAMES = {
  static: `smartsales-static-${CACHE_VERSION}`,
  dynamic: `smartsales-dynamic-${CACHE_VERSION}`,
  images: `smartsales-images-${CACHE_VERSION}`,
  api: `smartsales-api-${CACHE_VERSION}`
};

// Recursos para precachear
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then(cache => {
        console.log('[SW] Precacheando recursos estáticos...');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Service Worker instalado correctamente');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error durante la instalación:', error);
      })
  );
});

// Activación y limpieza de cachés antiguos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('[SW] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker activado');
      return self.clients.claim();
    })
  );
});

// Estrategia Network First para APIs
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.api);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Red falló, usando caché para:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Si no hay caché, mostrar página offline
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Estrategia Cache First para recursos estáticos
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Error al obtener recurso:', request.url);
    throw error;
  }
}

// Estrategia Stale While Revalidate para contenido semi-estático
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAMES.dynamic);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
  }
  // Imágenes: Cache First
  else if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
  }
  // Assets estáticos: Cache First
  else if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.static));
  }
  // HTML: Network First
  else if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request));
  }
  // Otros recursos: Stale While Revalidate
  else {
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Background Sync para sincronización automática
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync activado:', event.tag);
  
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncSales());
  } else if (event.tag === 'sync-products') {
    event.waitUntil(syncProducts());
  } else if (event.tag === 'sync-clients') {
    event.waitUntil(syncClients());
  } else if (event.tag === 'sync-all') {
    event.waitUntil(syncAll());
  }
});

// Funciones de sincronización
async function syncSales() {
  try {
    console.log('[SW] Sincronizando ventas...');
    // Implementar lógica de sincronización de ventas
    const pendingSales = await getPendingOperations('sales');
    for (const sale of pendingSales) {
      await syncSale(sale);
    }
    console.log('[SW] Ventas sincronizadas correctamente');
  } catch (error) {
    console.error('[SW] Error sincronizando ventas:', error);
  }
}

async function syncProducts() {
  try {
    console.log('[SW] Sincronizando productos...');
    // Implementar lógica de sincronización de productos
    const pendingProducts = await getPendingOperations('products');
    for (const product of pendingProducts) {
      await syncProduct(product);
    }
    console.log('[SW] Productos sincronizados correctamente');
  } catch (error) {
    console.error('[SW] Error sincronizando productos:', error);
  }
}

async function syncClients() {
  try {
    console.log('[SW] Sincronizando clientes...');
    // Implementar lógica de sincronización de clientes
    const pendingClients = await getPendingOperations('clients');
    for (const client of pendingClients) {
      await syncClient(client);
    }
    console.log('[SW] Clientes sincronizados correctamente');
  } catch (error) {
    console.error('[SW] Error sincronizando clientes:', error);
  }
}

async function syncAll() {
  try {
    console.log('[SW] Sincronización completa iniciada...');
    await Promise.all([
      syncSales(),
      syncProducts(),
      syncClients()
    ]);
    console.log('[SW] Sincronización completa finalizada');
  } catch (error) {
    console.error('[SW] Error en sincronización completa:', error);
  }
}

// Funciones auxiliares para sincronización
async function getPendingOperations(type) {
  // Implementar lógica para obtener operaciones pendientes desde IndexedDB
  return [];
}

async function syncSale(sale) {
  // Implementar lógica de sincronización de venta individual
  console.log('[SW] Sincronizando venta:', sale.id);
}

async function syncProduct(product) {
  // Implementar lógica de sincronización de producto individual
  console.log('[SW] Sincronizando producto:', product.id);
}

async function syncClient(client) {
  // Implementar lógica de sincronización de cliente individual
  console.log('[SW] Sincronizando cliente:', client.id);
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification recibida');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'SmartSales365';
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icons/action-open.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/action-close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Manejo de mensajes desde la aplicación
self.addEventListener('message', (event) => {
  console.log('[SW] Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SYNC_NOW') {
    event.waitUntil(syncAll());
  }
});

// Manejo de errores
self.addEventListener('error', (event) => {
  console.error('[SW] Error en Service Worker:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Promise rechazada:', event.reason);
});

console.log('[SW] Service Worker cargado correctamente');
