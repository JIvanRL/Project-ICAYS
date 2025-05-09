// Función para obtener el token CSRF
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

// Función para crear un toast
function createToast(title, message, isError = false) {
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${isError ? 'bg-danger' : 'bg-success'} text-white`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">${message}</div>
    `;
    
    // Crear contenedor de toasts si no existe
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toastEl);
    return toastEl;
}

// Función para manejar la interacción de solicitudes
window.interaccionSolicitud = function(solicitudId, accion) {
    console.group('Interacción Solicitud');
    console.log('Iniciando proceso:', { solicitudId, accion });
    
    // Log del CSRF token
    const csrfToken = getCookie('csrftoken');
    console.log('CSRF Token:', csrfToken ? 'Presente' : 'No encontrado');
    
    $.ajax({
        url: `/jdirecto/solicitudes-autorizacion/${solicitudId}/procesar/`, // URL corregida
        type: 'POST',
        data: { 
            accion: accion 
        },
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrfToken
        },
        beforeSend: function(xhr) {
            console.log('Enviando solicitud:', {
                url: this.url,
                data: this.data,
                headers: this.headers
            });
        },
        success: function(response) {
            console.log('Respuesta recibida:', response);
            
            if (response.success) {
                const card = document.querySelector(`[data-solicitud-id="${solicitudId}"]`).closest('.col-12');
                console.log('Card container encontrado:', !!card);
                
                if (card) {
                    // Animar la salida de la card
                    card.style.transition = 'all 0.3s ease-out';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    
                    // Remover la card después de la animación
                    setTimeout(() => {
                        card.remove();
                        
                        // Verificar si quedan solicitudes
                        const solicitudesRestantes = document.querySelectorAll('.solicitud-card').length;
                        if (solicitudesRestantes === 0) {
                            // Mostrar mensaje de no hay solicitudes
                            const container = document.querySelector('.row.g-3');
                            if (container) {
                                container.innerHTML = `
                                    <div class="col-12">
                                        <div class="text-center py-5 text-muted">
                                            <i class="fas fa-inbox fa-3x mb-3"></i>
                                            <h5>No hay solicitudes pendientes</h5>
                                        </div>
                                    </div>`;
                            }
                        }
                    }, 300);
                }

                // Mostrar mensaje de éxito
                const toast = new bootstrap.Toast(createToast(
                    'Éxito',
                    `Solicitud ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`,
                    false
                ));
                toast.show();
                
            } else {
                console.error('Error en la respuesta:', response);
                
                // Mostrar mensaje de error
                const toast = new bootstrap.Toast(createToast(
                    'Error',
                    response.message || 'Error al procesar la solicitud',
                    true
                ));
                toast.show();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error en la petición:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText,
                error: error
            });
            
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                console.log('Respuesta de error parseada:', errorResponse);
            } catch (e) {
                console.log('No se pudo parsear la respuesta de error');
            }
            
            const toast = new bootstrap.Toast(createToast(
                'Error',
                'Error al procesar la solicitud',
                true
            ));
            toast.show();
        },
        complete: function() {
            console.groupEnd();
        }
    });
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando manejadores de eventos...');

    // Delegación de eventos para mejor manejo
    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('.aprobar-btn, .rechazar-btn');
        if (!target) return;

        console.log('Click detectado en:', {
            elemento: target,
            clase: target.className,
            solicitudId: target.dataset.solicitudId,
            path: e.composedPath().map(el => el.className || el.tagName)
        });

        e.preventDefault();
        e.stopPropagation();

        const solicitudId = target.dataset.solicitudId;
        const accion = target.classList.contains('aprobar-btn') ? 'aprobar' : 'rechazar';

        if (solicitudId) {
            console.log('Llamando a interaccionSolicitud con:', { solicitudId, accion });
            interaccionSolicitud(solicitudId, accion);
        } else {
            console.error('No se encontró solicitudId en el botón');
        }
    });

    // Debug visual de elementos clickeables
    const botonesAprobar = document.querySelectorAll('.aprobar-btn');
    const botonesRechazar = document.querySelectorAll('.rechazar-btn');
    
    console.log('Elementos encontrados:', {
        'Botones aprobar': botonesAprobar.length,
        'Botones rechazar': botonesRechazar.length
    });

    // Verificar z-index y posicionamiento
    botonesAprobar.forEach(btn => {
        const styles = window.getComputedStyle(btn);
        console.log('Estilos del botón:', {
            zIndex: styles.zIndex,
            position: styles.position,
            pointerEvents: styles.pointerEvents
        });
    });
});