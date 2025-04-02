// notification-permissions.js
// Script para manejar los permisos de notificaciones

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones');
        return;
    }

    // Función para solicitar permisos
    function requestNotificationPermission() {
        Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
                console.log('Permiso de notificaciones concedido');
                // Registrar el service worker después de obtener permiso
                registerServiceWorker();
            } else {
                console.log('Permiso de notificaciones denegado');
                // Mostrar mensaje al usuario sobre cómo habilitar notificaciones
                showEnableNotificationsMessage();
            }
        });
    }

    // Función para registrar el service worker
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Usar la ruta correcta al service worker (ahora en la raíz)
            navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'  // Controlar todo el sitio
            })
            .then(function(registration) {
                console.log('Service Worker registrado con éxito:', registration);
                
                // Suscribirse a notificaciones push
                subscribeToPushNotifications(registration);
            })
            .catch(function(error) {
                console.error('Error al registrar el Service Worker:', error);
            });
        }
    }

    // El resto del código permanece igual...
    // Función para suscribirse a notificaciones push
    function subscribeToPushNotifications(registration) {
        // Obtener la clave pública del servidor
        fetch('/api/push/public-key/')
            .then(response => response.json())
            .then(data => {
                if (data.publicKey) {
                    const applicationServerKey = urlBase64ToUint8Array(data.publicKey);
                    
                    // Verificar si ya existe una suscripción
                    return registration.pushManager.getSubscription()
                        .then(subscription => {
                            if (subscription) {
                                console.log('Ya existe una suscripción');
                                return subscription;
                            }
                            
                            // Crear nueva suscripción
                            return registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: applicationServerKey
                            });
                        })
                        .then(subscription => {
                            // Enviar la suscripción al servidor
                            return sendSubscriptionToServer(subscription);
                        });
                }
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
        .then(response => response.json())
        .then(data => {
            console.log('Suscripción enviada al servidor:', data);
        })
        .catch(error => {
            console.error('Error al enviar suscripción al servidor:', error);
        });
    }

    // Función para mostrar mensaje sobre cómo habilitar notificaciones
    function showEnableNotificationsMessage() {
        // Verificar si ya existe el mensaje
        if (document.getElementById('notification-permission-message')) {
            return;
        }
        
        // Crear el elemento de mensaje
        const messageContainer = document.createElement('div');
        messageContainer.id = 'notification-permission-message';
        messageContainer.className = 'notification-permission-message';
        messageContainer.innerHTML = `
            <div class="notification-message-content">
                <h4>Habilitar Notificaciones</h4>
                <p>Para recibir notificaciones sobre cambios en las bitácoras, por favor habilita las notificaciones en tu navegador.</p>
                <div class="notification-buttons">
                    <button id="enable-notifications-btn" class="btn btn-primary">Habilitar Notificaciones</button>
                    <button id="dismiss-notification-message-btn" class="btn btn-secondary">Más tarde</button>
                </div>
            </div>
        `;
        
        // Añadir al cuerpo del documento
        document.body.appendChild(messageContainer);
        
        // Añadir event listeners a los botones
        document.getElementById('enable-notifications-btn').addEventListener('click', function() {
            requestNotificationPermission();
            messageContainer.remove();
        });
        
        document.getElementById('dismiss-notification-message-btn').addEventListener('click', function() {
            messageContainer.remove();
        });
    }

    // Función auxiliar para convertir base64 a Uint8Array
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Función para obtener cookies (para CSRF token)
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

    // Verificar el estado actual de los permisos
    if (Notification.permission === 'granted') {
        // Ya tenemos permiso, registrar service worker
        registerServiceWorker();
    } else if (Notification.permission === 'denied') {
        // Permiso denegado, mostrar mensaje
        showEnableNotificationsMessage();
    } else {
        // Permiso no solicitado aún, añadir botón para solicitarlo
        const notificationToggle = document.getElementById('notification-toggle');
        if (notificationToggle) {
            notificationToggle.addEventListener('click', function(event) {
                // Solicitar permiso al hacer clic en el icono de notificaciones
                if (Notification.permission !== 'granted') {
                    event.preventDefault();
                    requestNotificationPermission();
                }
            });
        } else {
            // Si no hay botón de notificaciones, añadir un botón en algún lugar visible
            const header = document.querySelector('header') || document.querySelector('nav');
            if (header) {
                const enableButton = document.createElement('button');
                enableButton.id = 'enable-notifications-button';
                enableButton.className = 'btn btn-sm btn-outline-primary';
                enableButton.innerHTML = '<i class="fa fa-bell"></i> Activar Notificaciones';
                enableButton.addEventListener('click', requestNotificationPermission);
                
                header.appendChild(enableButton);
            }
        }
    }
});