// Notification handling with WebSockets - Sistema integrado

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema de notificaciones integrado...');
    
    // Verificar si el sistema antiguo ya está inicializado
    const oldSystemInitialized = (typeof notificationsEnabled !== 'undefined');
    console.log('Sistema antiguo inicializado:', oldSystemInitialized);
    
    // Verificar si el usuario está autenticado
    const userIdElement = document.getElementById('user-id');
    if (!userIdElement) {
        console.log('No se encontró el elemento user-id. El usuario podría no estar autenticado.');
        return;
    }
    
    const userId = userIdElement.value;
    if (!userId) {
        console.log('ID de usuario no encontrado.');
        return;
    }
    
    console.log('ID de usuario encontrado:', userId);
    
    // Conectar al WebSocket sin importar si el sistema antiguo está activo
    connectWebSocket(userId);
    
    // Cargar notificaciones existentes
    loadExistingNotifications();
    
    // Si el sistema antiguo no está inicializado, crear nuestra propia UI
    if (!oldSystemInitialized) {
        createNotificationUI();
    } else {
        console.log('Usando sistema de notificaciones existente para la UI');
    }
});

// Función para conectar al WebSocket
function connectWebSocket(userId) {
    // Determinar el protocolo WebSocket correcto (ws:// o wss://)
    const protocol = window.location.protocol === 'http:' ? 'wss://' : 'ws://';
    const host = window.location.host;
    const wsUrl = `${protocol}${host}/notifications/${userId}/`;
    
    console.log('Intentando conectar a WebSocket en:', wsUrl);
    
    // Crear conexión WebSocket
   
    console.log('Intentando conectar a WebSocket en:', wsUrl);
    // Conexión abierta
    socket.addEventListener('open', (event) => {
        console.log('Conectado al servidor de notificaciones WebSocket');
    });
    
    // Escuchar mensajes
    socket.addEventListener('message', (event) => {
        console.log('Mensaje recibido del servidor WebSocket:', event.data);
        
        try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'notification_message') {
                // Mostrar la notificación en la interfaz
                addNotificationToUI(data);
                
                // Reproducir sonido de notificación
                if (typeof playNotificationSound === 'function') {
                    // Usar la función existente si está disponible
                    playNotificationSound();
                } else {
                    // Usar nuestra propia implementación
                    playSound();
                }
                
                // Mostrar notificación del navegador si está en segundo plano
                showBrowserNotification(data.message, data);
                
                // Si hay un contador de notificaciones existente, actualizarlo
                updateExistingNotificationCounters();
            } else if (data.type === 'connection_established') {
                console.log(data.message);
            }
        } catch (e) {
            console.error('Error al procesar mensaje WebSocket:', e);
        }
    });
    
    // Conexión cerrada
    socket.addEventListener('close', (event) => {
        console.log('Desconectado del servidor de notificaciones WebSocket');
        
        // Intentar reconectar después de 5 segundos
        setTimeout(() => connectWebSocket(userId), 5000);
    });
    
    // Error de conexión
    socket.addEventListener('error', (event) => {
        console.error('Error de WebSocket:', event);
    });
    
    // Guardar la referencia del socket para uso posterior
    window.notificationSocket = socket;
}

// Función para reproducir sonido
function playSound() {
    try {
        // Intentar usar el sonido existente primero
        const soundPath = '/static/sounds/notification.mp3';
        const audio = new Audio(soundPath);
        audio.play().catch(e => {
            console.log('No se pudo reproducir el sonido de notificación:', e);
            
            // Intentar con el sonido alternativo
            const altSoundPath = '/static/sounds/sound-notification.wav';
            const altAudio = new Audio(altSoundPath);
            altAudio.play().catch(e => {
                console.log('No se pudo reproducir el sonido alternativo:', e);
            });
        });
    } catch (e) {
        console.error('Error al reproducir sonido:', e);
    }
}

// Función para mostrar notificación del navegador
function showBrowserNotification(message, data = {}) {
    // Si el sistema antiguo está activo, usar su función
    if (typeof showNotification === 'function' && typeof notificationsEnabled !== 'undefined' && notificationsEnabled) {
        console.log('Usando sistema de notificaciones existente');
        showNotification('ICAYS Notificación', message);
        return;
    }
    
    // Si no, usar nuestra propia implementación
    if (!('Notification' in window)) {
        return;
    }
    
    if (Notification.permission === 'granted' && document.hidden) {
        const notification = new Notification('ICAYS Notificación', {
            body: message,
            icon: '/static/img/logo.png'
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
            
            // Si hay una URL específica, navegar a ella
            if (data.url) {
                window.location.href = data.url;
            }
        };
    } else if (Notification.permission !== 'denied' && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showBrowserNotification(message, data);
            }
        });
    }
}

// Función para cargar notificaciones existentes
function loadExistingNotifications() {
    fetch('/api/notifications/')
        .then(response => response.json())
        .then(data => {
            console.log('Notificaciones cargadas:', data);
            
            if (data.notifications && data.notifications.length > 0) {
                // Contar notificaciones no leídas
                let unreadCount = 0;
                
                // Añadir notificaciones a la interfaz
                data.notifications.forEach(notification => {
                    if (!notification.is_read) {
                        unreadCount++;
                    }
                    
                    // Solo añadir a la UI si tenemos nuestro propio contenedor
                    const notificationList = document.getElementById('notification-list');
                    if (notificationList) {
                        addNotificationToUI(notification, false);
                    }
                });
                
                // Actualizar insignia si existe
                const badge = document.getElementById('notification-badge');
                if (badge) {
                    badge.textContent = unreadCount;
                    badge.style.display = unreadCount > 0 ? 'block' : 'none';
                }
                
                // También actualizar contadores existentes
                updateExistingNotificationCounters(unreadCount);
            }
        })
        .catch(error => {
            console.error('Error al cargar notificaciones:', error);
        });
}

// Función para actualizar contadores existentes
function updateExistingNotificationCounters(count) {
    // Actualizar contador en el sistema antiguo si existe
    if (typeof lastPendingCount !== 'undefined') {
        // No sobrescribir directamente para evitar conflictos
        // pero podemos usar el valor para mostrar notificaciones
        console.log('Actualizando contador en sistema existente:', count);
    }
    
    // También podemos actualizar otros contadores visuales si existen
    const contadorPendientes = document.getElementById('contador-pendientes');
    if (contadorPendientes && count !== undefined) {
        // Solo actualizar si el valor es diferente
        if (contadorPendientes.textContent !== count.toString()) {
            contadorPendientes.textContent = count;
        }
    }
}

// Función para añadir una notificación a la interfaz
function addNotificationToUI(notification, isNew = true) {
    const notificationList = document.getElementById('notification-list');
    if (!notificationList) {
        console.log('No se encontró el contenedor de notificaciones');
        return;
    }
    
    // Eliminar mensaje de "no hay notificaciones" si existe
    const emptyNotification = notificationList.querySelector('.empty-notification');
    if (emptyNotification) {
        emptyNotification.remove();
    }
    
    // Crear elemento de notificación
    const item = document.createElement('div');
    item.className = `notification-item ${notification.is_read ? 'read' : ''}`;
    
    // Determinar si hay una URL para hacer clic
    const hasUrl = notification.url ? true : false;
    
    // Crear contenido HTML con o sin enlace
    let messageHtml = `<div class="notification-message">`;
    if (hasUrl) {
        messageHtml += `<a href="${notification.url}">${notification.message}</a>`;
    } else {
        messageHtml += notification.message;
    }
    messageHtml += `</div>`;
    
    item.innerHTML = `
        ${messageHtml}
        <div class="notification-time">${new Date(notification.created_at).toLocaleString()}</div>
        ${!notification.is_read ? `<button class="mark-read-btn" data-id="${notification.notification_id || notification.id}">Marcar como leída</button>` : ''}
    `;
    
    // Insertar al principio de la lista
    if (notificationList.firstChild) {
        notificationList.insertBefore(item, notificationList.firstChild);
    } else {
        notificationList.appendChild(item);
    }
    
    // Añadir event listener al botón de marcar como leída
    const markReadBtn = item.querySelector('.mark-read-btn');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const notificationId = this.getAttribute('data-id');
            markNotificationAsRead(notificationId);
            item.classList.add('read');
            this.remove();
            
            // Actualizar insignia
            updateNotificationBadgeCount(-1);
        });
    }
    
    // Si hay una URL, hacer que toda la notificación sea clickeable
    if (hasUrl) {
        item.addEventListener('click', function(e) {
            // No hacer nada si se hizo clic en el botón de marcar como leída
            if (e.target.classList.contains('mark-read-btn')) {
                return;
            }
            
            // Marcar como leída y navegar a la URL
            const markReadBtn = item.querySelector('.mark-read-btn');
            if (markReadBtn) {
                const notificationId = markReadBtn.getAttribute('data-id');
                markNotificationAsRead(notificationId);
            }
            
            window.location.href = notification.url;
        });
        
        // Añadir estilo de cursor para indicar que es clickeable
        item.style.cursor = 'pointer';
    }
    
    // Si es una nueva notificación, actualizar el contador
    if (isNew && !notification.is_read) {
        updateNotificationBadgeCount(1);
    }
}

// Función para marcar una notificación como leída
function markNotificationAsRead(notificationId) {
    // Enviar solicitud al servidor
    fetch(`/api/notifications/${notificationId}/read/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Notificación marcada como leída:', data);
        
        // También enviar mensaje por WebSocket si está disponible
        if (window.notificationSocket && window.notificationSocket.readyState === WebSocket.OPEN) {
            window.notificationSocket.send(JSON.stringify({
                type: 'mark_read',
                notification_id: notificationId
            }));
        }
    })
    .catch(error => {
        console.error('Error al marcar notificación como leída:', error);
    });
}

// Función para actualizar el contador de notificaciones
function updateNotificationBadgeCount(change) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    
    const currentCount = parseInt(badge.textContent) || 0;
    const newCount = Math.max(0, currentCount + change);
    
    badge.textContent = newCount;
    badge.style.display = newCount > 0 ? 'block' : 'none';
    
    if (change > 0) {
        badge.classList.add('new');
        setTimeout(() => {
            badge.classList.remove('new');
        }, 1000);
    }
    
    // También actualizar contadores existentes
    updateExistingNotificationCounters(newCount);
}

// Función para crear la interfaz de notificaciones
function createNotificationUI() {
    // Verificar si ya existe el contenedor de notificaciones
    if (document.getElementById('notification-container')) {
        return;
    }
    
    // Crear el contenedor de notificaciones
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    container.innerHTML = `
        <button id="notification-toggle" class="notification-button">
            <i class="fa fa-bell"></i>
            <span id="notification-badge" class="notification-badge" style="display: none;">0</span>
        </button>
        
        <div id="notification-dropdown" class="notification-dropdown" style="display: none;">
            <div class="notification-header">
                <h3>Notificaciones</h3>
                <button id="mark-all-read">Marcar todas como leídas</button>
            </div>
            <div id="notification-list" class="notification-list">
                <div class="empty-notification">No hay notificaciones nuevas</div>
            </div>
        </div>
    `;
    
    // Añadir el contenedor al DOM
    const header = document.querySelector('header') || document.querySelector('nav');
    if (header) {
        header.appendChild(container);
    } else {
        document.body.insertBefore(container, document.body.firstChild);
    }
    
    // Añadir event listeners
    document.getElementById('notification-toggle').addEventListener('click', function() {
        const dropdown = document.getElementById('notification-dropdown');
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
    
    document.getElementById('mark-all-read').addEventListener('click', function() {
        markAllNotificationsAsRead();
    });
    
    // Añadir estilos CSS si no existen
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-container {
                position: relative;
                display: inline-block;
                margin-left: 15px;
            }
            
            .notification-button {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1.2rem;
                color: #333;
                position: relative;
                padding: 5px;
            }
            
            .notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background-color: #ff4757;
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .notification-dropdown {
                position: absolute;
                right: 0;
                top: 100%;
                width: 300px;
                max-height: 400px;
                overflow-y: auto;
                background-color: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                z-index: 1000;
            }
            
            .notification-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                border-bottom: 1px solid #eee;
            }
            
            .notification-header h3 {
                margin: 0;
                font-size: 16px;
            }
            
            .notification-header button {
                background: none;
                border: none;
                color: #2980b9;
                cursor: pointer;
                font-size: 12px;
            }
            
            .notification-list {
                padding: 0;
            }
            
            .notification-item {
                padding: 10px 15px;
                border-bottom: 1px solid #eee;
                position: relative;
            }
            
            .notification-item:last-child {
                border-bottom: none;
            }
            
            .notification-item.read {
                background-color: #f9f9f9;
                opacity: 0.7;
            }
            
            .notification-message {
                margin-bottom: 5px;
                font-size: 14px;
            }
            
            .notification-time {
                font-size: 12px;
                color: #777;
            }
            
            .mark-read-btn {
                background: none;
                border: none;
                color: #2980b9;
                cursor: pointer;
                font-size: 12px;
                margin-top: 5px;
            }
            
            .empty-notification {
                padding: 20px;
                text-align: center;
                color: #777;
                font-style: italic;
            }
            
            @keyframes notification-pulse {
                0% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.2);
                }
                100% {
                    transform: scale(1);
                }
            }
            
            .notification-badge.new {
                animation: notification-pulse 1s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    }
}

// Función para marcar todas las notificaciones como leídas
function markAllNotificationsAsRead() {
    fetch('/api/notifications/mark-all-read/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Actualizar UI
            document.querySelectorAll('.notification-item:not(.read)').forEach(item => {
                item.classList.add('read');
                const btn = item.querySelector('.mark-read-btn');
                if (btn) btn.remove();
            });
            
            // Actualizar insignia
            const badge = document.getElementById('notification-badge');
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
            
            // Actualizar contadores existentes
            updateExistingNotificationCounters(0);
        }
    })
    .catch(error => {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
    });
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