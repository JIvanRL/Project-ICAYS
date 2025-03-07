// Función para abrir la modal de firma
function abrirModalFirma() {
    // Ocultar el modal de enviar
    const modalEnviar = document.getElementById('enviar');
    if (modalEnviar) {
        const modalEnv = bootstrap.Modal.getInstance(modalEnviar);
        if (modalEnv) {
            modalEnv.hide();
        }
    }

    // Mostrar el modal de firma
    const modalFirmar = document.getElementById('firmar');
    if (modalFirmar) {
        const modalFirma = new bootstrap.Modal(modalFirmar, {
            backdrop: 'static',
            keyboard: false
        });
        modalFirma.show();
    }
}

// Variable global para la instancia del modal de error
let modalErrorInstance = null;

// Función para manejar el modal de error
function getModalError() {
    if (!modalErrorInstance) {
        modalErrorInstance = $('#modalError');
        
        // Configurar el modal con opciones
        modalErrorInstance.modal({
            backdrop: 'static',
            keyboard: false,
            show: false
        });
        
        // Añadir manejador de eventos
        modalErrorInstance.on('hidden.bs.modal', function() {
            setTimeout(limpiarUI, 100);
        });
    }
    return modalErrorInstance;
}

// Función auxiliar para mostrar errores
function mostrarError(mensaje) {
    $('#mensajeErrorTexto').text(mensaje);
    getModalError().modal('show');
}

// Manejar el cierre de modales
document.addEventListener('hidden.bs.modal', function (event) {
    const modals = document.querySelectorAll('.modal');
    const openModals = Array.from(modals).filter(modal =>
        window.getComputedStyle(modal).display !== 'none'
    );

    if (openModals.length === 0) {
        document.body.classList.remove('modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
    }
});

// Variables globales para mantener una única instancia de cada modal
let modalFirmaInstance = null;
let modalExitoInstance = null;
let modalGuardarExitoInstance = null;

// Función para limpiar la UI usando jQuery
function limpiarUI() {
    // Eliminar todos los backdrops
    $('.modal-backdrop').remove();
    // Restaurar el estado del body
    $('body').removeClass('modal-open');
    $('body').css({
        'overflow': '',
        'padding-right': ''
    });
}

// Funciones para manejar los modales con jQuery
function getModalFirma() {
    if (!modalFirmaInstance) {
        modalFirmaInstance = $('#firmar');
        
        // Configurar el modal con opciones
        modalFirmaInstance.modal({
            backdrop: 'static',
            keyboard: false,
            show: false
        });
        
        // Añadir manejador de eventos
        modalFirmaInstance.on('hidden.bs.modal', function() {
            $('#error-message').text('').hide();
            setTimeout(limpiarUI, 100);
        });
    }
    return modalFirmaInstance;
}

function getModalExito() {
    if (!modalExitoInstance) {
        modalExitoInstance = $('#mensajeExito');
        
        // Configurar el modal con opciones
        modalExitoInstance.modal({
            backdrop: 'static',
            keyboard: false,
            show: false
        });
        
        // Añadir manejador de eventos
        modalExitoInstance.on('hidden.bs.modal', function() {
            setTimeout(function() {
                location.reload();
            }, 100);
        });
    }
    return modalExitoInstance;
}

function getModalGuardarExito() {
    if (!modalGuardarExitoInstance) {
        modalGuardarExitoInstance = $('#guardarexito');
        
        // Configurar el modal con opciones
        modalGuardarExitoInstance.modal({
            backdrop: 'static',
            keyboard: false,
            show: false
        });
        
        // Añadir manejador de eventos
        modalGuardarExitoInstance.on('hidden.bs.modal', function() {
            setTimeout(limpiarUI, 100);
        });
    }
    return modalGuardarExitoInstance;
}

// Función para guardar el formulario
function guardarFormulario() {
    const formData = new FormData($('#form-principal')[0]);
    formData.append('accion', 'guardar');

    $.ajax({
        url: '/microbiologia/registrar_bitacora/',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': $('[name=csrfmiddlewaretoken]').val()
        },
        success: function(data) {
            console.log('Respuesta recibida:', data);
            
            if (data && data.success === true) {
                // Mostrar mensaje de éxito
                $('#mensajeExitoTextoGuardar').text(data.message);
                getModalGuardarExito().modal('show');
                
                // Redirigir automáticamente después de 2 segundos
                setTimeout(function() {
                    window.location.href = data.redirect_url;
                }, 2000);
            } else {
                // Mostrar mensaje de error
                const errorMsg = data.error || 'Error al guardar la bitácora.';
                $('#error-guardar').text(errorMsg).show();
                getModalError().modal('show');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error en la solicitud:', status, error);
            let errorMsg = 'Error al guardar la bitácora.';
            
            try {
                const errorData = JSON.parse(xhr.responseText);
                if (errorData.error) {
                    errorMsg = errorData.error;
                }
            } catch (e) {
                console.error('Error al parsear la respuesta:', e);
            }
            
            $('#error-guardar').text(errorMsg).show();
            getModalError().modal('show');
        }
    });
}

// Función revisada para enviar formulario con jQuery
function enviarFormulario() {
    const formData = new FormData($('#form-principal')[0]);
    formData.append('accion', 'enviar');

    // Validar contraseña
    const password = $('#password').val();
    if (!password) {
        $('#error-message').text('La contraseña es requerida.').show();
        return;
    }

    $.ajax({
        url: '/microbiologia/registrar_bitacora/',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': $('[name=csrfmiddlewaretoken]').val()
        },
        success: function(data) {
            console.log('Respuesta recibida:', data);
            
            if (data && data.success === true) {
                // Cerrar modal de firma
                getModalFirma().modal('hide');
                
                // Mostrar modal de éxito
                setTimeout(function() {
                    $('#mensajeExitoTexto').text('Bitácora enviada correctamente.');
                    limpiarUI();
                    getModalExito().modal('show');
                }, 300);
            } else {
                // Mostrar error específico de la respuesta
                const errorMsg = (data && data.error) ? data.error : 'Error al enviar la bitácora.';
                $('#error-message').text(errorMsg).show();
                
                // Verificar si el modal está abierto
                if (!$('#firmar').hasClass('show')) {
                    limpiarUI();
                    getModalFirma().modal('show');
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Error en la solicitud:', status, error);
            console.log('Respuesta del servidor:', xhr.responseText);
            
            // Intentar analizar la respuesta por si es JSON
            let errorMsg = 'Contraseña incorrecta.';
            try {
                const errorData = JSON.parse(xhr.responseText);
                if (errorData && errorData.error) {
                    errorMsg = errorData.error;
                }
            } catch (e) {
                console.error('No se pudo parsear la respuesta como JSON:', e);
            }
            
            $('#error-message').text(errorMsg).show();
            
            // Verificar si el modal está abierto
            if (!$('#firmar').hasClass('show')) {
                limpiarUI();
                getModalFirma().modal('show');
            }
        }
    });
}

// Inicialización con jQuery
$(document).ready(function() {
    // Limpiar UI al cargar
    limpiarUI();
    
    // Botón de depuración opcional
    const debugButton = $('<button></button>')
        .text('Forzar limpieza UI')
        .css({
            'position': 'fixed',
            'bottom': '10px',
            'right': '10px',
            'z-index': '9999',
            'display': 'none' // Cambia a 'block' para mostrar
        })
        .click(limpiarUI);
    
    $('body').append(debugButton);
    
    // Manejadores de botones (opcional)
    $('#btn-guardar').click(guardarFormulario);
    $('#btn-enviar').click(enviarFormulario);
    
    // Consejo de depuración
    console.log('Script inicializado correctamente');
});
