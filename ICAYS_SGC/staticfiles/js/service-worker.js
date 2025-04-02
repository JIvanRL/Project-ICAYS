// service-worker.js
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push recibido');
  
  let notificationData = {};
  
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'Nueva notificación',
      body: event.data ? event.data.text() : 'No hay detalles disponibles',
      icon: '/static/img/logo.png'
    };
  }
  
  const title = notificationData.title || 'ICAYS Notificación';
  const options = {
    body: notificationData.body || 'Tienes una nueva notificación',
    icon: notificationData.icon || '/static/img/logo.png',
    badge: '/static/img/badge.png',
    data: notificationData.data || {},
    tag: notificationData.tag || 'default',
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notificación clickeada');
  
  event.notification.close();
  
  // Redirigir al usuario a una URL específica cuando hace clic en la notificación
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(function(clientList) {
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

// Evento de instalación del Service Worker
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Instalado');
  self.skipWaiting();
});

// Evento de activación del Service Worker
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activado');
  return self.clients.claim();
});