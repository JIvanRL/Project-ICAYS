function DetallesBitaJefe(bitacoraId) {
    if (!bitacoraId) {
        alert('No se proporcionó ID de bitácora');
        return;
    }

    try {
        window.location.href = `/jdirecto/ver/${bitacoraId}/`;
    } catch (error) {
        console.error('Error:', error);
        alert('Error al acceder a la bitácora');
    }
}
function DetallesBitaJefeAutorizar(bitacoraId) {
    if (!bitacoraId) {
        alert('No se proporcionó ID de bitácora');
        return;
    }

    try {
        window.location.href = `/jdirecto/bitacoraRevisada/${bitacoraId}/`;
    } catch (error) {
        console.error('Error:', error);
        alert('Error al acceder a la bitácora');
    }
}

// Variables para el sistema de notificaciones
let lastPendingCount = 0;
let notificationsEnabled = false;

// Función para activar notificaciones automáticamente
function setupNotifications() {
    if (!("Notification" in window)) {
        console.log("Este navegador no soporta notificaciones de escritorio");
        return;
    }

    if (Notification.permission === "granted") {
        notificationsEnabled = true;
        console.log("Notificaciones ya están habilitadas");
    } else if (Notification.permission !== "denied") {
        // Intentar solicitar permiso automáticamente
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                notificationsEnabled = true;
                console.log("Permiso de notificaciones concedido");
                showNotification("Sistema de Bitácoras", "Las notificaciones están activadas. Recibirás alertas cuando lleguen nuevas bitácoras.");
            } else {
                // Si el usuario no concede permiso, mostrar un mensaje en la interfaz
                showNotificationBanner();
            }
        });
    } else {
        // Si las notificaciones fueron denegadas previamente, mostrar un mensaje
        showNotificationBanner();
    }
}

// Mostrar un banner para solicitar activar notificaciones
function showNotificationBanner() {
    // Verificar si el banner ya existe
    if (document.getElementById('notification-banner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'notification-banner';
    banner.className = 'alert alert-warning alert-dismissible fade show';
    banner.style.position = 'fixed';
    banner.style.top = '10px';
    banner.style.right = '10px';
    banner.style.zIndex = '9999';
    banner.style.maxWidth = '400px';
    
    banner.innerHTML = `
        <strong>¡Activa las notificaciones!</strong>
        <p>Para recibir alertas cuando lleguen nuevas bitácoras para revisar.</p>
        <button type="button" class="btn btn-sm btn-primary" id="enable-notifications-btn">
            Activar notificaciones
        </button>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    document.body.appendChild(banner);
    
    // Agregar evento al botón
    document.getElementById('enable-notifications-btn').addEventListener('click', function() {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                notificationsEnabled = true;
                banner.remove();
                showNotification("Sistema de Bitácoras", "Las notificaciones están activadas. Recibirás alertas cuando lleguen nuevas bitácoras.");
            }
        });
    });
    
    // Agregar evento para cerrar el banner
    banner.querySelector('.close').addEventListener('click', function() {
        banner.remove();
    });
}

// Función para mostrar una notificación
function showNotification(title, body) {
    if (!notificationsEnabled || Notification.permission !== "granted") {
        console.log("Notificaciones no habilitadas");
        return;
    }

    const options = {
        body: body,
        icon: '/static/img/logo.png', // Ajusta la ruta a tu logo
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    const notification = new Notification(title, options);
    
    notification.onclick = function() {
        window.focus();
        window.location.href = '/jdirecto/pendientes/';
        this.close();
    };
}

// Función para verificar si hay nuevas bitácoras
function checkForNewBitacoras(currentCount) {
    if (lastPendingCount === 0) {
        // Primera carga, solo guardar el valor
        lastPendingCount = currentCount;
        return;
    }

    if (currentCount > lastPendingCount) {
        // Hay nuevas bitácoras
        const newBitacorasCount = currentCount - lastPendingCount;
        const message = newBitacorasCount === 1 
            ? "Ha llegado 1 nueva bitácora para revisar" 
            : `Han llegado ${newBitacorasCount} nuevas bitácoras para revisar`;
        
        showNotification("Nuevas bitácoras pendientes", message);
        
        // También reproducir un sonido de notificación
        playNotificationSound();
    }

    // Actualizar el contador para la próxima verificación
    lastPendingCount = currentCount;
}

// Reproducir un sonido de notificación
function playNotificationSound() {
    try {
        const audio = new Audio('/static/sounds/sound-notification.wav'); // Ajusta la ruta a tu archivo de sonido
        audio.play();
    } catch (e) {
        console.error('Error al reproducir sonido de notificación:', e);
    }
}

//Funcion para enviar bitacora a autorizar
function enviarFormularioAutorizar() {
    console.log('Iniciando cambio de estado de bitácora...');
    
    // Obtener el ID de la bitácora desde el campo oculto
    const bitacoraEstado = document.getElementById('bitacora_id');
    const bitacoraId = bitacoraEstado ? bitacoraEstado.value : null;
    
    if (!bitacoraId) {
        console.error('No se pudo obtener el ID de la bitacora actual');
        $('#error-message').text('Error: No se pudo obtener el ID de la bitácora').show();
        return false;
    }
    console.log('ID de la bitacora actual:', bitacoraId);
    
    // Validar que se haya seleccionado un usuario destino (si es necesario)
    const usuarioDestino = $('#usuario_destino').val();
    const accion = $('#accion').val() || 'revisar';
    const password = $('#password').val();
    
    // Si la acción es 'enviar', validar que se haya seleccionado un usuario destino
    if (accion === 'revisar' && !usuarioDestino) {
        $('#error-message').text('Debe seleccionar un usuario destino').show();
        return false;
    }
    
    // Validar que se haya ingresado una contraseña
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
    formData.append('accion', accion);
    if (usuarioDestino) {
        formData.append('usuario_destino', usuarioDestino);
    }
    formData.append('password', password);
    
    // Obtener observaciones (si existen)
    const observaciones = $('#observaciones').val();
    if (observaciones) {
        formData.append('observaciones', observaciones);
    }
    
    // Debug: Mostrar todos los datos que se van a enviar
    console.log('Enviando formulario con los siguientes datos:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    
    $.ajax({
        url: `/jdirecto/cambia_estado_bitacora/${bitacoraId}/`,
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
                // Cerrar el modal de firma
                $('#firmar').modal('hide');
                
                // Actualizar los contadores inmediatamente después de cambiar el estado
                actualizarContadoresJefe();
                
                // Mostrar mensaje de éxito
                $('#mensajeExitoTexto').text(response.message || 'Bitácora autorizada correctamente');
                $('#mensajeExito').modal('show');
                
                // Redireccionar después de mostrar el mensaje
                $('#mensajeExito').on('hidden.bs.modal', function () {
                    window.location.href = response.redirect_url || '/jdirecto/revisadas/';
                });
            } else {
                const errorMsg = response.error || response.message || 'Error al procesar la bitácora';
                $('#error-message').text(errorMsg).show();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al procesar:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
            
            // Intentar extraer mensaje de error más detallado
            let errorMsg = 'Error al procesar la bitácora';
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                if (errorResponse.error) {
                    errorMsg = errorResponse.error;
                } else if (errorResponse.message) {
                    errorMsg = errorResponse.message;
                }
            } catch (e) {
                console.log('No se pudo parsear la respuesta de error');
                errorMsg += ': ' + error;
            }
            
            $('#error-message').text(errorMsg).show();
        }
    });
    
    return false;
}
function enviarFormularioRechazado() {
    console.log('Iniciando cambio de estado de bitácora a rechazada...');
    
    // Obtener el ID de la bitácora desde el campo oculto
    const bitacoraEstado = document.getElementById('bitacora_id');
    const bitacoraId = bitacoraEstado ? bitacoraEstado.value : null;
    
    if (!bitacoraId) {
        console.error('No se pudo obtener el ID de la bitácora actual');
        $('#error-message').text('Error: No se pudo obtener el ID de la bitácora').show();
        return false;
    }

    console.log('Debug - ID de bitácora:', bitacoraId);

    // Crear FormData con los datos necesarios
    const formData = new FormData(document.getElementById('form-principal'));
    formData.append('accion', 'rechazar');
    
    // Obtener observaciones (si existen)
    const observaciones = $('#observaciones').val();
    if (observaciones) {
        formData.append('observaciones', observaciones);
    }

    // Hacer la petición AJAX a la ruta correcta del jefe directo
    $.ajax({
        url: `/jdirecto/cambia_estado_bitacora/${bitacoraId}/`,  // URL corregida para usar la ruta del jefe
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
                // Cerrar el modal de rechazo
                $('#Rechazar').modal('hide');
                
                // Actualizar contadores
                actualizarContadoresJefe();
                
                // Mostrar mensaje de éxito
                $('#mensajeExitoTextoRechazada').text(response.message || 'Bitácora rechazada correctamente');
                $('#rechazada').modal('show');
                
                // Redirección después del mensaje
                $('#rechazada').on('hidden.bs.modal', function () {
                    window.location.href = response.redirect_url || '/jdirecto/pendientes/';
                });
            } else {
                const errorMsg = response.error || response.message || 'Error al procesar la bitácora';
                $('#error-message').text(errorMsg).show();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error en la petición:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
            
            // Mejorar el manejo de errores para mostrar mensajes más específicos
            let errorMsg = 'Error al procesar la bitácora';
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                errorMsg = errorResponse.error || errorResponse.message || error;
            } catch (e) {
                console.log('No se pudo parsear la respuesta de error');
                if (xhr.status === 403) {
                    errorMsg = 'No tienes permiso para realizar esta acción';
                }
            }
            
            $('#error-message').text(errorMsg).show();
        }
    });
    
    return false;
}
function enviarFormularioAutorizado() {
    console.log('Iniciando autorización de bitácora...');
    
    // Obtener el ID de la bitácora desde el campo oculto
    const bitacoraEstado = document.getElementById('bitacora_id');
    const bitacoraId = bitacoraEstado ? bitacoraEstado.value : null;
    
    if (!bitacoraId) {
        console.error('No se pudo obtener el ID de la bitácora actual');
        $('#error-message').text('Error: No se pudo obtener el ID de la bitácora').show();
        return false;
    }
    console.log('ID de la bitacora actual:', bitacoraId);
    
    // Obtener la acción (autorizar por defecto)
    const accion = $('#accion').val() || 'autorizar';
    const password = $('#password').val();
    
    // Validar que se haya ingresado una contraseña
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
    formData.append('accion', accion);
    formData.append('password', password);
    
    // Obtener observaciones (si existen)
    const observaciones = $('#observaciones').val();
    if (observaciones) {
        formData.append('observaciones', observaciones);
    }
    
    // Debug: Mostrar todos los datos que se van a enviar
    console.log('Enviando formulario con los siguientes datos:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    
    $.ajax({
        url: `/jdirecto/cambia_estado_bitacora/${bitacoraId}/`,
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
                // Cerrar el modal de firma
                $('#firmar').modal('hide');
                
                // Actualizar los contadores inmediatamente después de cambiar el estado
                actualizarContadoresJefe();
                
                // Mostrar mensaje de éxito
                $('#mensajeExitoTexto').text(response.message || 'Bitácora procesada correctamente');
                $('#mensajeExito').modal('show');
                
                // Redireccionar después de mostrar el mensaje
                $('#mensajeExito').on('hidden.bs.modal', function () {
                    window.location.href = response.redirect_url || '/jdirecto/pendientes/';
                });
            } else {
                const errorMsg = response.error || response.message || 'Error al procesar la bitácora';
                $('#error-message').text(errorMsg).show();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al procesar:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
            
            // Intentar extraer mensaje de error más detallado
            let errorMsg = 'Error al procesar la bitácora';
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                if (errorResponse.error) {
                    errorMsg = errorResponse.error;
                } else if (errorResponse.message) {
                    errorMsg = errorResponse.message;
                }
            } catch (e) {
                console.log('No se pudo parsear la respuesta de error');
                errorMsg += ': ' + error;
            }
            
            $('#error-message').text(errorMsg).show();
        }
    });
    
    return false;
}

// Función para actualizar los contadores del jefe
// Función para actualizar los contadores del jefe (adaptada del código de analista)
function actualizarContadoresJefe() {
    console.log('Iniciando actualización de contadores para jefe...');

    // Obtener el ID del usuario actual desde el campo oculto
    const usuarioIdElement = document.getElementById('usuario_id_actual');
    const usuarioId = usuarioIdElement ? usuarioIdElement.value : null;
    
    if (!usuarioId) {
        console.error('No se pudo obtener el ID del usuario actual');
        return;
    }
    
    console.log('ID del usuario actual:', usuarioId);

    // Contar bitácoras pendientes (enviadas) para el usuario actual
    $.ajax({
        url: `/jdirecto/contar-bitacoras/enviada/${usuarioId}/`,
        type: 'GET',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(data) {
            console.log('Respuesta pendientes para usuario actual:', data);
            if (data.cantidad !== undefined) {
                const contadorElement = document.getElementById('contador-pendientes');
                if (contadorElement) {
                    contadorElement.textContent = data.cantidad;
                    
                    // Verificar si hay nuevas bitácoras y mostrar notificación
                    checkForNewBitacoras(data.cantidad);
                } else {
                    console.log('Elemento contador-pendientes no encontrado en esta página');
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al contar pendientes:', {
                status: status,
                error: error,
                response: xhr.responseText
            });
            // Intentar parsear la respuesta JSON
            try {
                const errorData = JSON.parse(xhr.responseText);
                console.error('Mensaje de error del servidor:', errorData);
            } catch (e) {
                console.error('No se pudo parsear la respuesta del servidor');
            }
        }
    });

    // Contar bitácoras revisadas
    $.ajax({
        url: `/jdirecto/contar-bitacoras/revisada/${usuarioId}/`,
        type: 'GET',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(data) {
            console.log('Respuesta revisadas para usuario actual:', data);
            if (data.cantidad !== undefined) {
                const contadorElement = document.getElementById('contador-revisadas');
                if (contadorElement) {
                    contadorElement.textContent = data.cantidad;
                } else {
                    console.log('Elemento contador-revisadas no encontrado en esta página');
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al contar revisadas:', {
                status: status,
                error: error,
                response: xhr.responseText
            });
            // Intentar parsear la respuesta JSON
            try {
                const errorData = JSON.parse(xhr.responseText);
                console.error('Mensaje de error del servidor:', errorData);
            } catch (e) {
                console.error('No se pudo parsear la respuesta del servidor');
            }
        }
    });

    // Contar bitácoras aprobadas
    $.ajax({
        url: `/jdirecto/contar-bitacoras/aprobada/${usuarioId}/`,
        type: 'GET',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(data) {
            console.log('Respuesta aprobadas para usuario actual:', data);
            if (data.cantidad !== undefined) {
                const contadorElement = document.getElementById('contador-aprobadas');
                if (contadorElement) {
                    contadorElement.textContent = data.cantidad;
                } else {
                    console.log('Elemento contador-aprobadas no encontrado en esta página');
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al contar aprobadas:', {
                status: status,
                error: error,
                response: xhr.responseText
            });
            // Intentar parsear la respuesta JSON
            try {
                const errorData = JSON.parse(xhr.responseText);
                console.error('Mensaje de error del servidor:', errorData);
            } catch (e) {
                console.error('No se pudo parsear la respuesta del servidor');
            }
        }
    });

    // Contar bitácoras rechazadas
    $.ajax({
        url: `/jdirecto/contar-bitacoras/rechazada/${usuarioId}/`,
        type: 'GET',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(data) {
            console.log('Respuesta rechazadas para usuario actual:', data);
            if (data.cantidad !== undefined) {
                const contadorElement = document.getElementById('contador-rechazadas');
                if (contadorElement) {
                    contadorElement.textContent = data.cantidad;
                } else {
                    console.log('Elemento contador-rechazadas no encontrado en esta página');
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al contar rechazadas:', {
                status: status,
                error: error,
                response: xhr.responseText
            });
            // Intentar parsear la respuesta JSON
            try {
                const errorData = JSON.parse(xhr.responseText);
                console.error('Mensaje de error del servidor:', errorData);
            } catch (e) {
                console.error('No se pudo parsear la respuesta del servidor');
            }
        }
    });
}
// Ejecutar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, iniciando contadores de jefe...');
    // Imprimir la URL actual para depuración
    console.log('URL actual completa:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    
    // Cargar usuarios con AJAX y token CSRF
    const csrftoken = getCookie('csrftoken');
    
    $.ajax({
        url: "/jdirecto/api/usuarios/",
        type: 'GET',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrftoken
        },
        success: function(data) {
            console.log('Usuarios cargados correctamente:', data);
            const selectUsuario = document.getElementById('usuario_destino');
            if (selectUsuario) {
                data.forEach(usuario => {
                    const option = document.createElement('option');
                    option.value = usuario.id;
                    option.textContent = `${usuario.nombre} ${usuario.apellido} - ${usuario.area} - ${usuario.rol}`;
                    selectUsuario.appendChild(option);
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al cargar usuarios:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText
            });
            
            // Intentar mostrar un mensaje más amigable
            if (xhr.status === 403) {
                console.error('Error de permisos: No tienes autorización para acceder a la lista de usuarios');
                
                // Alternativa: cargar usuarios desde un endpoint diferente o mostrar un mensaje al usuario
                const selectUsuario = document.getElementById('usuario_destino');
                if (selectUsuario) {
                    const option = document.createElement('option');
                    option.value = "";
                    option.textContent = "Error al cargar usuarios - Contacta al administrador";
                    selectUsuario.appendChild(option);
                }
            }
        }
    });
        
    // Configurar botones con URL en el atributo data-url
    const botonesConUrl = document.querySelectorAll('[data-url]');
    botonesConUrl.forEach(boton => {
        boton.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            if (url) {
                window.location.href = url;
            }
        });
    });
    
    // Configurar notificaciones automáticamente
    setupNotifications();
    
    // Actualizar contadores inmediatamente
    actualizarContadoresJefe();
    
    // Configurar el formulario de autorización (si existe)
    const formAutorizar = document.getElementById('form-autorizar');
    if (formAutorizar) {
        formAutorizar.addEventListener('submit', function(e) {
            e.preventDefault();
            enviarFormularioAutorizar();
        });
    }
    
    // Configurar botones de autorización (si existen)
    const btnAutorizar = document.getElementById('btn-autorizar');
    if (btnAutorizar) {
        btnAutorizar.addEventListener('click', function(e) {
            e.preventDefault();
            enviarFormularioAutorizar();
        });
    }
    
    // Configurar botones de rechazo (si existen)
    const btnRechazar = document.getElementById('btn-rechazar');
    if (btnRechazar) {
        btnRechazar.addEventListener('click', function(e) {
            e.preventDefault();
            enviarFormularioRechazado();
        });
    }
});
 // Actualizar contadores cada 30 segundos
setInterval(actualizarContadoresJefe, 30000);

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
//Fuction para los ejemplos de las formulas de las bitacoras
function actualizarResultado() {
    const num1 = parseFloat(document.getElementById('num1').value);
    const num2 = parseFloat(document.getElementById('num2').value);
    const resultElement = document.getElementById('result');

    if (isNaN(num1) || isNaN(num2)) {
        resultElement.textContent = "Ingrese números válidos.";
        return;
    }

    if (num2 === 0) {
        resultElement.textContent = "No se puede dividir por cero.";
        return;
    }

    const resultado = num1 / num2;
    resultElement.textContent = "Resultado: " + parseFloat(resultado.toFixed(3)); // Máximo 6 decimales sin ceros innecesarios
}

// Detecta cambios en los campos de entrada
document.getElementById('num1').addEventListener('input', actualizarResultado);
document.getElementById('num2').addEventListener('input', actualizarResultado);

function ejemplSuperficies() {
    const num3 = parseFloat(document.getElementById('num3').value);
    const num4 = parseFloat(document.getElementById('num4').value);
    const num5 = parseFloat(document.getElementById('num5').value);
    const resultElement2 = document.getElementById('result2');
    if (isNaN(num3) || isNaN(num4) || isNaN(num5)) {
        resultElement.textContent = "Ingrese números válidos.";
        return;
    }

    if (num4 === 0) {
        resultElement.textContent = "No se puede dividir por cero.";
        return;
    }
    if(num5 === 0){
        resultElement.textContent = "No se puede multiplicar por cero.";
        return;
    }

    const resultado2 = (num3 / num4) * num5 ;
    resultElement2.textContent = "Resultado: " + parseFloat(resultado2.toFixed(3)); // Máximo 6 decimales sin ceros innecesarios
}

// Detecta cambios en los campos de entrada
document.getElementById('num3').addEventListener('input', ejemplSuperficies);
document.getElementById('num4').addEventListener('input', ejemplSuperficies);
document.getElementById('num5').addEventListener('input', ejemplSuperficies);
//Ejemplo de calculo de diferencia entre duplicados
function ejemplDiferencia() {
    const num6 = parseFloat(document.getElementById('num6').value);
    const num7 = parseFloat(document.getElementById('num7').value);
    const num8 = parseFloat(document.getElementById('num8').value);
    const resultElement3 = document.getElementById('result3');
    
    // Corregir la variable resultElement a resultElement3
    if (isNaN(num6) || isNaN(num7) || isNaN(num8)) {
        resultElement3.textContent = "Ingrese números válidos.";
        resultElement3.style.color = "black";
        return;
    }

    // Verificar división por cero (es num8 el divisor, no num7)
    if (num8 === 0) {
        resultElement3.textContent = "No se puede dividir por cero.";
        resultElement3.style.color = "black";
        return;
    }

    const resultado3 = Math.abs((num6 - num7) / num8 * 100);
    const resultadoFormateado = parseFloat(resultado3.toFixed(3));
    
    // Verificar si el resultado es mayor al 5%
    if (resultado3 > 5) {
        resultElement3.textContent = "Resultado: " + resultadoFormateado + "% (Excede el 5%)";
        resultElement3.style.color = "red";
        
        // También puedes cambiar el color del input si lo deseas
        document.getElementById('num6').style.borderColor = "red";
        document.getElementById('num7').style.borderColor = "red";
        document.getElementById('num8').style.borderColor = "red";
    } else {
        resultElement3.textContent = "Resultado: " + resultadoFormateado + "% (Aceptable)";
        resultElement3.style.color = "green";
        
        // Restaurar el color de los inputs
        document.getElementById('num6').style.borderColor = "";
        document.getElementById('num7').style.borderColor = "";
        document.getElementById('num8').style.borderColor = "";
    }
}

// Detecta cambios en los campos de entrada
document.getElementById('num6').addEventListener('input', ejemplDiferencia);
document.getElementById('num7').addEventListener('input', ejemplDiferencia);
document.getElementById('num8').addEventListener('input', ejemplDiferencia);


function createToast(title, message, isError = false) {
    const toastElement = document.createElement('div');
    toastElement.className = `toast ${isError ? 'bg-danger' : 'bg-success'} text-white`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    toastElement.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    document.getElementById('toast-container').appendChild(toastElement);
    return toastElement;
}

// Agregar event listeners para los botones
document.addEventListener('DOMContentLoaded', function() {
    // Delegación de eventos para botones de aprobar/rechazar
    document.body.addEventListener('click', function(e) {
        if (e.target.matches('.aprobar-btn')) {
            const solicitudId = e.target.dataset.solicitudId;
            if (solicitudId) {
                interaccionSolicitud(solicitudId, 'aprobar');
            }
        } else if (e.target.matches('.rechazar-btn')) {
            const solicitudId = e.target.dataset.solicitudId;
            if (solicitudId) {
                interaccionSolicitud(solicitudId, 'rechazar');
            }
        }
    });
});

// Función helper para mostrar notificaciones
function showNotification(title, message, isError = false) {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'bg-danger' : 'bg-success'} text-white`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
}
