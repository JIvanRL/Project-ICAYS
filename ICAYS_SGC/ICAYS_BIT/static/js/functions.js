function DetallesBita(bitacoraId) {
    if (!bitacoraId) {
        // Intentar obtener el ID desde el campo oculto si no se proporcionó como parámetro
        const bitacoraIdElement = document.getElementById('bitacora_id');
        if (bitacoraIdElement) {
            bitacoraId = bitacoraIdElement.value;
        }
        
        if (!bitacoraId) {
            alert('No se proporcionó ID de bitácora');
            return;
        }
    }

    try {
        window.location.href = `/microbiologia/detallesBita/${bitacoraId}/`;
    } catch (error) {
        console.error('Error:', error);
        alert('Error al acceder a la bitácora');
    }
}

function DetallesBitaRevision(bitacoraId) {
    if (!bitacoraId) {
        // Intentar obtener el ID desde el campo oculto si no se proporcionó como parámetro
        const bitacoraIdElement = document.getElementById('bitacora_id');
        if (bitacoraIdElement) {
            bitacoraId = bitacoraIdElement.value;
        }
        
        if (!bitacoraId) {
            alert('No se proporcionó ID de bitácora');
            return;
        }
    }

    try {
        window.location.href = `/microbiologia/detallesBitaRevision/${bitacoraId}/`;
    } catch (error) {
        console.error('Error:', error);
        alert('Error al acceder a la bitácora');
    }
}
function DetallesBitaAutorizadas(bitacoraId) {
    if (!bitacoraId) {
        // Intentar obtener el ID desde el campo oculto si no se proporcionó como parámetro
        const bitacoraIdElement = document.getElementById('bitacora_id');
        if (bitacoraIdElement) {
            bitacoraId = bitacoraIdElement.value;
        }
        
        if (!bitacoraId) {
            alert('No se proporcionó ID de bitácora');
            return;
        }
    }

    try {
        window.location.href = `/microbiologia/detallesBitaAutorizada/${bitacoraId}/`;
    } catch (error) {
        console.error('Error:', error);
        alert('Error al acceder a la bitácora');
    }
}

// Función para abrir el modal de firma
function abrirModalFirma() {
    // Cerrar el modal de confirmación
    $('#enviar').modal('hide');
    // Abrir el modal de firma
    $('#firmar').modal('show');
}

// Función para enviar el formulario con la firma
function enviarFormulario() {
    // Obtener el ID de la bitácora desde el campo oculto
    const bitacoraId = document.getElementById('bitacora_id').value;
    
    if (!bitacoraId) {
        alert('No se pudo obtener el ID de la bitácora');
        return;
    }
    
    // Obtener el formulario y los datos
    const form = document.getElementById('form-principal');
    const formData = new FormData(form);
    
    // Añadir la acción al formulario
    formData.append('accion', 'enviar');
    
    // Obtener la contraseña
    const password = document.getElementById('password').value;
    if (!password) {
        document.getElementById('error-message').textContent = 'Por favor ingrese su contraseña';
        document.getElementById('error-message').style.display = 'block';
        return;
    }
    formData.append('password', password);
    
    // Enviar la solicitud AJAX
    $.ajax({
        url: `/microbiologia/modificar_bitacora/${bitacoraId}/`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(response) {
            // Cerrar el modal de firma
            $('#firmar').modal('hide');
            
            // Mostrar mensaje de éxito
            document.getElementById('mensajeExitoTexto').textContent = response.message;
            $('#mensajeExito').modal('show');
            
            // Redirigir después de cerrar el modal
            $('#mensajeExito').on('hidden.bs.modal', function () {
                window.location.href = response.redirect_url;
            });
        },
        error: function(xhr) {
            // Mostrar mensaje de error
            const response = xhr.responseJSON;
            document.getElementById('error-message').textContent = response.message || response.error || 'Error al enviar la bitácora';
            document.getElementById('error-message').style.display = 'block';
        }
    });
}

// Función para guardar el formulario sin enviar
function guardarFormulario() {
    // Obtener el ID de la bitácora desde el campo oculto
    const bitacoraId = document.getElementById('bitacora_id').value;
    
    if (!bitacoraId) {
        alert('No se pudo obtener el ID de la bitácora');
        return;
    }
    
    // Obtener el formulario y los datos
    const form = document.getElementById('form-principal');
    const formData = new FormData(form);
    
    // Añadir la acción al formulario
    formData.append('accion', 'guardar');
    
    // Enviar la solicitud AJAX
    $.ajax({
        url: `/microbiologia/modificar_bitacora/${bitacoraId}/`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(response) {
            // Mostrar mensaje de éxito
            document.getElementById('mensajeExitoTextoGuardar').textContent = response.message;
            $('#guardarexito').modal('show');
            
            // Redirigir después de cerrar el modal
            $('#guardarexito').on('hidden.bs.modal', function () {
                window.location.href = response.redirect_url;
            });
        },
        error: function(xhr) {
            // Mostrar mensaje de error
            const response = xhr.responseJSON;
            document.getElementById('mensajeErrorTexto').textContent = response.message || response.error || 'Error al guardar la bitácora';
            document.getElementById('error-guardar').textContent = JSON.stringify(response);
            document.getElementById('error-guardar').style.display = 'block';
            $('#modalError').modal('show');
        }
    });
}
// Variables para almacenar las cantidades
let cantidadEnviadas = 0;
let cantidadRevisadas = 0;  
// Función para abrir el modal de confirmación
function actualizarContadorCombinado() {
    const total = cantidadEnviadas + cantidadRevisadas;
    const contadorCombinado = document.getElementById('contador_combinado');
    if (contadorCombinado) {
        contadorCombinado.textContent = total;
    }
}
//Funcion para actualizar el contador 
function actualizarContadores() {
    console.log('Iniciando actualización de contadores...');

    // Obtener el ID del usuario actual desde el campo oculto
    const usuarioIdElement = document.getElementById('usuario_id_actual');
    const usuarioId = usuarioIdElement ? usuarioIdElement.value : null;
    if (!usuarioId) {
        console.error('No se pudo obtener el ID del usuario actual');
        return;
    }
    
    console.log('ID del usuario actual:', usuarioId);

    // Contar bitácoras guardadas para el usuario actual
    $.ajax({
        url: `/microbiologia/contar-bitacoras/guardada/${usuarioId}/`,
        type: 'GET',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(data) {
            console.log('Respuesta guardadas para usuario actual:', data);
            if (data.cantidad !== undefined) {
                const contadorElement = document.getElementById('contador-guardadas');
                if (contadorElement) {
                    contadorElement.textContent = data.cantidad;
                } else {
                    console.error('Elemento contador-guardadas no encontrado');
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al contar guardadas:', {
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

    // Contar bitácoras enviadas para el usuario actual
    $.ajax({
        url: `/microbiologia/contar-bitacoras/enviada/${usuarioId}/`,
        type: 'GET',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(data) {
            console.log('Respuesta enviadas para usuario actual:', data);
            if (data.cantidad !== undefined) {
                // Guardar la cantidad para el contador combinado
                cantidadEnviadas = data.cantidad;
                
                // Actualizar el contador individual si existe
                const contadorElement = document.getElementById('contador-enviadas');
                if (contadorElement) {
                    contadorElement.textContent = data.cantidad;
                }
                
                // Actualizar el contador combinado
                actualizarContadorCombinado();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al contar enviadas:', {
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
    
    // Contar bitácoras revisadas para el usuario actual
    $.ajax({
        url: `/microbiologia/contar-bitacoras/revisada/${usuarioId}/`,
        type: 'GET',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(data) {
            console.log('Respuesta revisadas para usuario actual:', data);
            if (data.cantidad !== undefined) {
                // Guardar la cantidad para el contador combinado
                cantidadRevisadas = data.cantidad;
                
                // Actualizar el contador individual si existe
                const contadorElement = document.getElementById('contador-revisadas');
                if (contadorElement) {
                    contadorElement.textContent = data.cantidad;
                }
                
                // Actualizar el contador combinado
                actualizarContadorCombinado();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al contar revisada:', {
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

// Llamar a la función cuando se carga la página
// ...existing code...

// Un solo event listener para DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, iniciando contadores...');
    
    // Iniciar contadores
    actualizarContadores();
    
    
    // Imprimir la URL actual para depuración
    console.log('URL actual completa:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    
    // Cargar usuarios
    fetch("/microbiologia/api/usuarios/")
        .then(response => response.json())
        .then(data => {
            const selectUsuario = document.getElementById('usuario_destino');
            if (selectUsuario) {
                data.forEach(usuario => {
                    const option = document.createElement('option');
                    option.value = usuario.id;
                    option.textContent = `${usuario.nombre} ${usuario.apellido} - ${usuario.area} - ${usuario.rol}`;
                    selectUsuario.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error:', error));
        
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
    
    // Verificar si el campo de página existe
    const campoPagina = document.getElementById('pagina_cbap');
    
    if (campoPagina) {
        console.log('Campo de página encontrado en el DOM');
        
        // Verificar si estamos en la página de registro basándonos en la presencia del campo
        // y en la URL actual
        const pathname = window.location.pathname;
        
        // Verificar si estamos en la página principal de FP131 (que parece ser la página de registro)
        if (pathname === '/microbiologia/FP131/' || 
            pathname === '/microbiologia/FP131' ||
            pathname.includes('/registrar_bitacora') ||
            pathname.includes('/registerBita')) {
            
            console.log('Página de registro de bitácora detectada, asignando número de página...');
            
            // Verificar si el campo ya tiene un valor
            if (!campoPagina.value || campoPagina.value === '' || campoPagina.value === '0' || campoPagina.value === '-') {
                console.log('Campo de página vacío o con valor por defecto, asignando número...');
                asignarNumeroPagina();
            } else {
                console.log('Campo de página ya tiene un valor:', campoPagina.value);
            }
        } else {
            console.log('No estamos en la página de registro. URL actual:', pathname);
            
            // Si no estamos en la página de registro, asegurarnos de que el campo sea de solo lectura
            campoPagina.readOnly = true;
        }
    } else {
        console.log('Campo de página (pagina_cbap) no encontrado en el DOM');
    }
});

// Mantener el intervalo fuera del DOMContentLoaded
setInterval(actualizarContadores, 30000);
// Función para obtener el siguiente número de página desde el backend
function obtenerSiguienteNumeroPagina() {
    return new Promise((resolve, reject) => {// Hacer la solicitud AJAX
        $.ajax({
            url: '/microbiologia/obtener-siguiente-numero-pagina/',
            type: 'GET',
            dataType: 'json',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken') // Asegúrate de tener esta función
            },
            success: function(data) {// Verificar si la respuesta es válida
                console.log('Respuesta obtener-siguiente-numero-pagina:', data);
                if (data.siguiente_numero !== undefined) {
                    resolve(data.siguiente_numero);
                } else {
                    reject('No se pudo obtener el número de página: Respuesta inválida');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error al obtener número de página:', {
                    status: status,
                    error: error,
                    response: xhr.responseText
                });
                reject('Error en la solicitud AJAX');
            }
        });
    });
}

// Función para asignar automáticamente el número de página al formulario
function asignarNumeroPagina() {
    console.log('Ejecutando asignarNumeroPagina()');
    
    // Obtener el campo de número de página
    const campoPagina = document.getElementById('pagina_cbap');
    const campoOculto = document.getElementById('pagina_cbap_hidden');
    
    // Si el campo existe
    if (campoPagina) {
        console.log('Campo de página encontrado, obteniendo número...');
        
        // Obtener y asignar el siguiente número
        obtenerSiguienteNumeroPagina()
            .then(numero => {
                console.log('Número obtenido:', numero);
                campoPagina.value = numero;
                
                // También guardamos el valor en el campo oculto
                if (campoOculto) {
                    campoOculto.value = numero;
                }
            })
            .catch(error => {
                console.error('Error al asignar número de página:', error);
                alert('No se pudo asignar automáticamente el número de página. Por favor, contacte al administrador.');
            });
    } else {
        console.error('No se encontró el campo de página (pagina_cbap)');
    }
}
