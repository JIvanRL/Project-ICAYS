// Script para registrar el Service Worker

// En register-sw.js
// En tu archivo register-sw.js
document.addEventListener('DOMContentLoaded', function() {
 // Este código debe estar en tu archivo principal de JavaScript
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration);
        
        // Verificar si ya tenemos permiso para notificaciones
        if (Notification.permission === 'granted') {
          console.log('Ya tenemos permiso para notificaciones');
          subscribeToPushNotifications(registration);
        } else if (Notification.permission !== 'denied') {
          // Solicitar permiso
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              console.log('Permiso para notificaciones concedido');
              subscribeToPushNotifications(registration);
            }
          });
        }
      })
      .catch(error => {
        console.error('Error al registrar el Service Worker:', error);
      });
  });
}
});

// Función para mostrar botón de solicitud de permiso
function showRequestPermissionButton() {
  // Verificar si ya existe el botón
  if (document.getElementById('request-notification-permission')) {
    return;
  }
  
  // Crear el botón
  const button = document.createElement('button');
  button.id = 'request-notification-permission';
  button.className = 'btn btn-sm btn-primary notification-permission-btn';
  button.innerHTML = '<i class="fa fa-bell"></i> Activar notificaciones';
  
  // Añadir event listener
  button.addEventListener('click', function() {
    requestNotificationPermission();
  });
  
  // Añadir al DOM
  const header = document.querySelector('header') || document.querySelector('nav');
  if (header) {
    header.appendChild(button);
  } else {
    document.body.insertBefore(button, document.body.firstChild);
  }
  
  // Añadir estilos
  const style = document.createElement('style');
  style.textContent = `
    .notification-permission-btn {
      margin: 10px;
      padding: 5px 10px;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .notification-permission-btn:hover {
      background-color: #3367d6;
    }
  `;
  document.head.appendChild(style);
}

// Función para mostrar mensaje de no soportado
function showNotSupportedMessage() {
  console.log('Mostrando mensaje de notificaciones no soportadas');
  
  // Verificar si ya existe el mensaje
  if (document.getElementById('notifications-not-supported')) {
    return;
  }
  
  // Crear el mensaje
  const message = document.createElement('div');
  message.id = 'notifications-not-supported';
  message.className = 'notifications-not-supported';
  message.textContent = 'Tu navegador no soporta notificaciones push.';
  
  // Añadir al DOM
  const header = document.querySelector('header') || document.querySelector('nav');
  if (header) {
    header.appendChild(message);
  }
  
  // Añadir estilos
  const style = document.createElement('style');
  style.textContent = `
    .notifications-not-supported {
      margin: 10px;
      padding: 5px 10px;
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      font-size: 12px;
    }
  `;
  document.head.appendChild(style);
}

// Función para solicitar permiso de notificaciones
function requestNotificationPermission() {
  Notification.requestPermission()
    .then(function(permission) {
      if (permission === 'granted') {
        console.log('Permiso de notificaciones concedido');
        
        // Ocultar el botón de solicitud
        const button = document.getElementById('request-notification-permission');
        if (button) {
          button.remove();
        }
        
        // Suscribirse a notificaciones push
        navigator.serviceWorker.ready.then(function(registration) {
          subscribeToPushNotifications(registration);
        });
      } else {
        console.log('Permiso de notificaciones denegado');
      }
    });
}

// Función para suscribirse a notificaciones push
function subscribeToPushNotifications(registration) {
  console.log('Intentando suscribirse a notificaciones push...');
  
  // Obtener la clave pública del servidor
  fetch('/api/push/public-key/')
    .then(response => {
      if (!response.ok) {
        throw new Error('Error al obtener la clave pública');
      }
      return response.json();
    })
    .then(data => {
      console.log('Clave pública obtenida:', data);
      
      if (!data.publicKey) {
        throw new Error('No se recibió una clave pública válida');
      }
      
      const publicKey = data.publicKey;
      
      // Convertir la clave pública a Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      
      console.log('Intentando suscribirse con la clave:', publicKey);
      
      // Suscribirse a las notificaciones push
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
    })
    .then(subscription => {
      console.log('Suscripción creada:', subscription);
      
      // Enviar la suscripción al servidor
      return fetch('/api/push/subscribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error al guardar la suscripción');
      }
      return response.json();
    })
    .then(data => {
      console.log('Suscripción guardada correctamente:', data);
    })
    .catch(error => {
      console.error('Error al suscribirse a notificaciones push:', error);
    });
}
// Función para enviar la suscripción al servidor
function sendSubscriptionToServer(subscription) {
  const csrfToken = getCookie('csrftoken');
  
  return fetch('/api/push/subscribe/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken
    },
    body: JSON.stringify({
      subscription: subscription.toJSON()
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error al enviar suscripción al servidor');
    }
    return response.json();
  })
  .then(data => {
    console.log('Suscripción enviada al servidor:', data);
  })
  .catch(error => {
    console.error('Error al enviar suscripción al servidor:', error);
  });
}

// Función auxiliar para convertir base64 a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Función auxiliar para obtener cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}