function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    const notificationContainer = document.createElement('div');
    notificationContainer.style.position = 'fixed';
    notificationContainer.style.right = '0';
    notificationContainer.style.top = '60px'; // Ajustar según tu navbar
    notificationContainer.style.width = '300px';
    notificationContainer.style.padding = '15px';
    notificationContainer.style.zIndex = '9999';
    
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s ease-in-out';
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .notification-slide-in {
            animation: slideInRight 0.3s forwards;
        }
        
        .toast-container {
            position: fixed;
            right: 0;
            top: 60px;
            max-height: 100vh;
            overflow-y: auto;
            padding: 15px;
            z-index: 9999;
        }
        
        .toast {
            margin-bottom: 10px;
            min-width: 280px;
            box-shadow: -2px 2px 10px rgba(0,0,0,0.1);
            border-radius: 4px;
        }
    `;
    
    document.head.appendChild(styleSheet);
    notificationContainer.appendChild(toast);
    document.body.appendChild(notificationContainer);
    
    // Animar la entrada
    requestAnimationFrame(() => {
        toast.classList.add('notification-slide-in');
    });
    
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    bsToast.show();
    
    // Limpiar después de que se oculte
    toast.addEventListener('hidden.bs.toast', () => {
        notificationContainer.remove();
        styleSheet.remove();
    });
}

// Agregar la función para inicializar la campanita
function initNotificationBell() {
    const notificationArea = document.createElement('div');
    notificationArea.className = 'notification-area';
    notificationArea.innerHTML = `
        <div class="notification-bell">
            <i class="fas fa-bell"></i>
            <span class="notification-badge">0</span>
        </div>
        <div class="notification-panel">
            <div class="notification-header">
                <h6>Notificaciones</h6>
                <button class="mark-all-read">Marcar todo como leído</button>
            </div>
            <div class="notification-list"></div>
        </div>
    `;

    document.body.appendChild(notificationArea);

    // Estilos para la campanita
    const bellStyles = document.createElement('style');
    bellStyles.textContent = `
        .notification-area {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            margin-left: auto; /* Forzar alineación derecha */
            display: flex;
            justify-content: flex-end;
        }

        .notification-bell {
            margin-left: auto; /* Forzar alineación derecha */
            position: relative;
            cursor: pointer;
            padding: 10px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
        }

        .notification-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ff4444;
            color: white;
            border-radius: 50%;
            padding: 3px 6px;
            font-size: 12px;
            min-width: 20px;
            text-align: center;
        }

        .notification-panel {
            position: absolute;
            top: 100%;
            right: 0;
            width: 300px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            margin-top: 10px;
            display: none;
            max-height: 400px;
            overflow-y: auto;
        }

        .notification-panel.show {
            display: block;
            animation: slideInRight 0.3s ease;
        }

        .notification-header {
            padding: 15px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .notification-list {
            padding: 10px 0;
        }

        .notification-item {
            padding: 10px 15px;
            border-bottom: 1px solid #f5f5f5;
            cursor: pointer;
        }

        .notification-item:hover {
            background: #f8f9fa;
        }

        .notification-item.unread {
            background: #f0f7ff;
        }
    `;
    document.head.appendChild(bellStyles);

    // Event listeners
    const bell = notificationArea.querySelector('.notification-bell');
    const panel = notificationArea.querySelector('.notification-panel');

    bell.addEventListener('click', () => {
        panel.classList.toggle('show');
    });

    // Cerrar panel al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!notificationArea.contains(e.target)) {
            panel.classList.remove('show');
        }
    });
}

// Inicializar la campanita cuando el documento esté listo
document.addEventListener('DOMContentLoaded', initNotificationBell);
