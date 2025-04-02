// Service Worker para notificaciones push
const CACHE_NAME = 'icays-cache-v1';
const urlsToCache = [
  '/',
  '/static/css/notifications.css',
  '/static/js/notifications.js',
  '/static/sounds/notification.mp3',
  '/static/images/ICAYS_1.png'
];

// Evento de instalación - cachear recursos estáticos
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de activación - limpiar caches antiguas
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Reclamando clientes');
      return self.clients.claim();
    })
  );
});

self.addEventListener('push', event => {
  console.log('[Service Worker] Push recibido', event);
  
  let notificationData = {};
  
  try {
    if (event.data) {
      console.log('[Service Worker] Datos recibidos:', event.data.text());
      notificationData = event.data.json();
      console.log('[Service Worker] Datos parseados:', notificationData);
    } else {
      console.log('[Service Worker] No hay datos en el evento push');
    }
  } catch (e) {
    console.error('[Service Worker] Error al parsear datos:', e);
    notificationData = {
      title: 'ICAYS Notificación',
      body: event.data ? event.data.text() : 'Nueva notificación',
      icon: '/static/img/logo.png'
    };
  }
  
  const title = notificationData.title || 'ICAYS Notificación';
  const options = {
    body: notificationData.body || notificationData.message || 'Tienes una nueva notificación',
    icon: notificationData.icon || '/static/img/logo.png',
    badge: '/static/img/badge.png',
    data: notificationData.data || {},
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Ver'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };
  
  console.log('[Service Worker] Mostrando notificación:', title, options);
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('[Service Worker] Notificación mostrada con éxito');
      })
      .catch(error => {
        console.error('[Service Worker] Error al mostrar notificación:', error);
      })
  );
});

// Evento notificationclick - manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notificación clickeada:', event.notification.tag);
  
  event.notification.close();
  
  // Manejar acciones específicas
  if (event.action === 'close') {
    return;
  }
  
  // Obtener URL de la notificación o usar la URL por defecto
  const urlToOpen = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/';
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientList => {
      // Verificar si ya hay una ventana abierta y enfocarla
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Evento fetch - estrategia de caché
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devolver respuesta cacheada si existe
        if (response) {
          return response;
        }
        
        // Si no está en caché, hacer la petición a la red
        return fetch(event.request).then(
          response => {
            // Verificar si la respuesta es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar la respuesta para poder cachearla y devolverla
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        );
      })
  );
});