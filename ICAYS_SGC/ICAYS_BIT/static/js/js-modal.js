// Load the full build.
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

import { recolectarDatosTabla } from './events-bita131.js';

// Función modificada para guardar el formulario
function guardarFormulario() {
    const formData = new FormData($('#form-principal')[0]);
     // Agregar los datos de la tabla
     const datosTabla = recolectarDatosTabla();
    formData.append('accion', 'guardar');

    Object.keys(datosTabla).forEach(key => {
        formData.append(key, JSON.stringify(datosTabla[key]));
        formData.append('num_filas', datosTabla.num_filas);
    });

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
            // Verificar si la respuesta es exitosa
            if (data && data.success === true) {
                $('#mensajeExitoTextoGuardar').text(data.message);
                getModalGuardarExito().modal('show');
                
                setTimeout(function() {
                    window.location.href = data.redirect_url;
                }, 2000);
            } else {
                const errorMsg = data.error || 'Error al guardar la bitácora.';
                $('#error-guardar').text(errorMsg).show();
                getModalError().modal('show');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error en la solicitud:', status, error);
            let errorMsg = 'Error al guardar la bitácora.';
            
            try { // Intentar analizar la respuesta como JSON
                const errorData = JSON.parse(xhr.responseText); // Parsear la respuesta
                if (errorData.error) {
                    errorMsg = errorData.error;
                } else if (errorData.placa_d || errorData.placa_d2 || errorData.promedio_d) {
                    errorMsg = 'Error en formulario Dilución 3: ' + JSON.stringify(errorData);
                }
            } catch (e) {
                console.error('Error al parsear la respuesta:', e);
            }
            
            $('#error-guardar').text(errorMsg).show();
            getModalError().modal('show');
        }
    });
}
// Exportar la función para uso global
window.guardarFormulario = guardarFormulario;

// Función revisada para enviar formulario con jQuery
function enviarFormulario() {
    console.log('Iniciando envío de formulario...');
    
    // Validar que se haya seleccionado un usuario destino y proporcionado una contraseña
    const usuarioDestino = $('#usuario_destino').val();
    const password = $('#password').val();
    
    if (!usuarioDestino) {
        $('#error-message').text('Debe seleccionar un usuario destino').show();
        return false;
    }
    
    if (!password) {
        $('#error-message').text('Debe ingresar su contraseña').show();
        return false;
    }
    
    // Crear FormData con todos los datos del formulario
    const formData = new FormData($('#form-principal')[0]);
    
    // Obtener datos de la tabla
    const datosTabla = recolectarDatosTabla();
    
    // Agregar acción y datos adicionales
    formData.append('accion', 'enviar');
    formData.append('usuario_destino', usuarioDestino);
    formData.append('password', password);

    // Agregar datos de la tabla
    Object.keys(datosTabla).forEach(key => {
        formData.append(key, JSON.stringify(datosTabla[key]));
    });
    formData.append('num_filas', datosTabla.num_filas);

    // Debug
    console.log('Datos a enviar:', {
        accion: 'enviar',
        usuario_destino: usuarioDestino,
        has_password: !!password,
        num_filas: datosTabla.num_filas
    });

    $.ajax({
        url: '/microbiologia/registrar_bitacora/',  // Cambiado a registrar_bitacora
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(response) {
            console.log('Respuesta:', response);
            if (response.success) {
                $('#firmar').modal('hide');
                $('#mensajeExitoTexto').text(response.message || 'Bitácora enviada correctamente');
                $('#mensajeExito').modal('show');
                
                // Redireccionar después de mostrar el mensaje
                setTimeout(function() {
                    window.location.href = response.redirect_url;
                }, 2000);
            } else {
                const errorMsg = response.error || response.message || 'Error al enviar la bitácora';
                $('#error-message').text(errorMsg).show();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al enviar:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
            
            // Intentar extraer mensaje de error más detallado
            let errorMsg = error;
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                if (errorResponse.error) {
                    errorMsg = errorResponse.error;
                } else if (errorResponse.message) {
                    errorMsg = errorResponse.message;
                }
            } catch (e) {
                console.log('No se pudo parsear la respuesta de error');
            }
            
            $('#error-message').text('Error al enviar la bitácora: ' + errorMsg).show();
        }
    });

    return false;
}
function guardarFormularioEditadoParaMas() {
    const formData = new FormData($('#form-principal')[0]);
    console.log('Iniciando envío de formulario guardado...');
    const bitacoraEstado = document.getElementById('bitacora_id');
    const bitacoraId = bitacoraEstado ? bitacoraEstado.value : null;
    if (!bitacoraId) {
        console.error('No se pudo obtener el ID de la bitacora actual');
        return;
    }

     // Agregar los datos de la tabla
     const datosTabla = recolectarDatosTabla();
    formData.append('accion', 'guardar');

    Object.keys(datosTabla).forEach(key => {
        formData.append(key, JSON.stringify(datosTabla[key]));
        formData.append('num_filas', datosTabla.num_filas);
    });

    $.ajax({
         url: `/microbiologia/modificar_bitacora/${bitacoraId}/`,
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
            // Verificar si la respuesta es exitosa
            if (data && data.success === true) {
                $('#mensajeExitoTextoGuardar').text(data.message);
                getModalGuardarExito().modal('show');
                
                setTimeout(function() {
                    window.location.href = data.redirect_url;
                }, 2000);
            } else {
                const errorMsg = data.error || 'Error al guardar la bitácora.';
                $('#error-guardar').text(errorMsg).show();
                getModalError().modal('show');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error en la solicitud:', status, error);
            let errorMsg = 'Error al guardar la bitácora.';
            
            try { // Intentar analizar la respuesta como JSON
                const errorData = JSON.parse(xhr.responseText); // Parsear la respuesta
                if (errorData.error) {
                    errorMsg = errorData.error;
                } else if (errorData.placa_d || errorData.placa_d2 || errorData.promedio_d) {
                    errorMsg = 'Error en formulario Dilución 3: ' + JSON.stringify(errorData);
                }
            } catch (e) {
                console.error('Error al parsear la respuesta:', e);
            }
            
            $('#error-guardar').text(errorMsg).show();
            getModalError().modal('show');
        }
    });
}
function enviarFormularioGuardadaARevision() {
    console.log('Iniciando envío de formulario guardado...');
    const bitacoraEstado = document.getElementById('bitacora_id');
    const bitacoraId = bitacoraEstado ? bitacoraEstado.value : null;
    if (!bitacoraId) {
        console.error('No se pudo obtener el ID de la bitacora actual');
        return;
    }
    console.log('ID de la bitacora actual:', bitacoraId);
    
    // Validar que se haya seleccionado un usuario destino y proporcionado una contraseña
    const usuarioDestino = $('#usuario_destino').val();
    const password = $('#password').val();
    
    if (!usuarioDestino) {
        $('#error-message').text('Debe seleccionar un usuario destino').show();
        return false;
    }
    
    if (!password) {
        $('#error-message').text('Debe ingresar su contraseña').show();
        return false;
    }
    
    // Obtener todos los datos del formulario principal
    const formPrincipal = document.getElementById('form-principal');
    if (!formPrincipal) {
        console.error('No se encontró el formulario principal');
        $('#error-message').text('Error: No se encontró el formulario principal').show();
        return false;
    }
    
    // Crear FormData con todos los datos del formulario
    const formData = new FormData(formPrincipal);
    
    // Agregar datos adicionales necesarios para el envío
    formData.append('accion', 'enviar');
    formData.append('usuario_destino', usuarioDestino);
    formData.append('password', password);
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    // Debug: Mostrar todos los datos que se van a enviar
    console.log('Enviando formulario con los siguientes datos:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    $.ajax({
        url: `/microbiologia/modificar_bitacora/${bitacoraId}/`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(response) {
            console.log('Respuesta:', response);
            if (response.success) {
                $('#firmar').modal('hide');
                $('#mensajeExitoTexto').text(response.message || 'Bitácora enviada correctamente');
                $('#mensajeExito').modal('show');
                
                // Redireccionar después de mostrar el mensaje
                setTimeout(function() {
                    window.location.href = response.redirect_url || '/microbiologia/lista-bitacoras-revision/';
                }, 2000);
            } else {
                const errorMsg = response.error || response.message || 'Error al enviar la bitácora';
                $('#error-message').text(errorMsg).show();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al enviar:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
            
            // Intentar extraer mensaje de error más detallado
            let errorMsg = error;
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                if (errorResponse.error) {
                    errorMsg = errorResponse.error;
                } else if (errorResponse.message) {
                    errorMsg = errorResponse.message;
                }
            } catch (e) {
                console.log('No se pudo parsear la respuesta de error');
            }
            
            $('#error-message').text('Error al enviar la bitácora: ' + errorMsg).show();
        }
    });

    return false;
}
function guardarFormularioEditado() {
    console.log('Iniciando envío de formulario guardado...');
    const bitacoraEstado = document.getElementById('bitacora_id');
    const bitacoraId = bitacoraEstado ? bitacoraEstado.value : null;
    if (!bitacoraId) {
        console.error('No se pudo obtener el ID de la bitacora actual');
        return;
    }
    console.log('ID de la bitacora actual:', bitacoraId);
    
    // Validar que se haya seleccionado un usuario destino y proporcionado una contraseña
    const usuarioDestino = $('#usuario_destino').val();
    const password = $('#password').val();
    
    if (!usuarioDestino) {
        $('#error-message').text('Debe seleccionar un usuario destino').show();
        return false;
    }
    
    if (!password) {
        $('#error-message').text('Debe ingresar su contraseña').show();
        return false;
    }
    
    // Obtener todos los datos del formulario principal
    const formPrincipal = document.getElementById('form-principal');
    if (!formPrincipal) {
        console.error('No se encontró el formulario principal');
        $('#error-message').text('Error: No se encontró el formulario principal').show();
        return false;
    }
    
    // Crear FormData con todos los datos del formulario
    const formData = new FormData(formPrincipal);
    
    // Agregar datos adicionales necesarios para el envío
    formData.append('accion', 'enviar');
    formData.append('usuario_destino', usuarioDestino);
    formData.append('password', password);
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    // Debug: Mostrar todos los datos que se van a enviar
    console.log('Enviando formulario con los siguientes datos:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    $.ajax({
        url: `/microbiologia/modificar_bitacora/${bitacoraId}/`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(response) {
            console.log('Respuesta:', response);
            if (response.success) {
                $('#firmar').modal('hide');
                $('#mensajeExitoTexto').text(response.message || 'Bitácora enviada correctamente');
                $('#mensajeExito').modal('show');
                
                // Redireccionar después de mostrar el mensaje
                setTimeout(function() {
                    window.location.href = response.redirect_url || '/microbiologia/lista-bitacoras-revision/';
                }, 2000);
            } else {
                const errorMsg = response.error || response.message || 'Error al enviar la bitácora';
                $('#error-message').text(errorMsg).show();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al enviar:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
            
            // Intentar extraer mensaje de error más detallado
            let errorMsg = error;
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                if (errorResponse.error) {
                    errorMsg = errorResponse.error;
                } else if (errorResponse.message) {
                    errorMsg = errorResponse.message;
                }
            } catch (e) {
                console.log('No se pudo parsear la respuesta de error');
            }
            
            $('#error-message').text('Error al enviar la bitácora: ' + errorMsg).show();
        }
    });

    return false;
}

// Función para abrir el modal de firma
function abrirModalFirma() {
    $('#enviar').modal('hide');
    $('#password').val(''); // Limpiar contraseña anterior
    $('#error-message').hide(); // Ocultar mensajes de error previos
    $('#firmar').modal('show');
}
// Exportar la función para uso global
window.enviarFormulario = enviarFormulario;
window.abrirModalFirma = abrirModalFirma;
window.enviarFormularioGuardadaARevision = enviarFormularioGuardadaARevision;
window.guardarFormularioEditado = guardarFormularioEditado;
window.guardarFormularioEditadoParaMas = guardarFormularioEditadoParaMas;

// Inicialización con jQuery
$(document).ready(function() {
    // Limpiar UI al cargar
    limpiarUI();
    
    // Botón de depuración opcional
    const debugButton = $('<button></button>') // Crear un botón
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

document.addEventListener('DOMContentLoaded', function() {
console.log('DOM Prepaparar formularios');
enviarFormularioGuardadaARevision();
guardarFormularioEditado();
});