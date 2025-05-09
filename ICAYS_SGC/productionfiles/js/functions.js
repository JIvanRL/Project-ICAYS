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
function DetallesBitaRechazadas(bitacoraId) {
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
        window.location.href = `/microbiologia/detallesBitaRechazada/${bitacoraId}/`;
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
     // Contar bitácoras guardadas para el usuario actual
     $.ajax({
        url: `/microbiologia/contar-bitacoras/rechazada/${usuarioId}/`,
        type: 'GET',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(data) {
            console.log('Respuesta guardadas para usuario actual:', data);
            if (data.cantidad !== undefined) {
                const contadorElement = document.getElementById('contador-rechazadas');
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

    // Función para calcular la diferencia absoluta
    setupDiferenciaAbsoluta();
    
    // Configurar los listeners para las fórmulas de ejemplo
    setupFormulasEjemplo();
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
        resultElement.textContent = "0";
        return;
    }

    const resultado = num1 / num2;
    resultElement.textContent = "Resultado: " + parseFloat(resultado.toFixed(3)); // Máximo 6 decimales sin ceros innecesarios
}

// Detecta cambios en los campos de entrada
document.getElementById('num1').addEventListener('input', actualizarResultado);
document.getElementById('num2').addEventListener('input', actualizarResultado);
document.getElementById('result').addEventListener('input', actualizarResultado);

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
        resultElement.textContent = "0";
        return;
    }
    if(num5 === 0){
        resultElement.textContent = "0";
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
    
    if (isNaN(num6) || isNaN(num7) || isNaN(num8)) {
        resultElement3.textContent = "Ingrese números válidos.";
        resultElement3.style.color = "black";
        return;
    }

    let resultado3 = 0;
    let esDivisionCero = false;
    
    if (num8 !== 0) {
        resultado3 = Math.abs((num6 - num7) / num8 * 100);
    } else {
        esDivisionCero = true; // Marcar como división entre cero
    }

    const resultadoFormateado = parseFloat(resultado3.toFixed(3));
    let mensaje = `Resultado: ${resultadoFormateado}%`;
    let color = "black";

    if (esDivisionCero) {
        // Caso especial de división entre cero
        mensaje = `Resultado: 0`; // Forzar formato
        color = "black";
    } else if (resultado3 > 5) {
        mensaje += " (Excede el 5%)";
        color = "red";
    } else if (resultado3 > 0) {
        mensaje += " (Aceptable)";
        color = "green";
    }
    // Si resultado3 es 0 (no por división entre cero) no agregar mensaje

    resultElement3.textContent = mensaje;
    resultElement3.style.color = color;
    
    // Restablecer bordes de inputs
    ['num6', 'num7', 'num8'].forEach(id => {
        document.getElementById(id).style.borderColor = "";
    });
}
// Detecta cambios en los campos de entrada
document.getElementById('num6').addEventListener('input', ejemplDiferencia);
document.getElementById('num7').addEventListener('input', ejemplDiferencia);
document.getElementById('num8').addEventListener('input', ejemplDiferencia);

// Función para configurar el cálculo de diferencia absoluta
function setupDiferenciaAbsoluta() {
    const inputNumero1 = document.getElementById("valorObtenido");
    const inputNumero2 = document.getElementById("valorConvencional");
    const resultado = document.getElementById("diferenciaAbsoluta");

    // Si los elementos no existen en esta página, salir de la función
    if (!inputNumero1 || !inputNumero2 || !resultado) return;

    function calcularResta() {
        const valor1 = parseFloat(inputNumero1.value) || 0;
        const valor2 = parseFloat(inputNumero2.value) || 0;

        const resta = valor1 - valor2;
        const resultadoRedondeado = Math.round(resta * 10) / 10; // Redondea a un decimal

        if (isNaN(resultadoRedondeado)) {
            resultado.value = "0";
        } else if (!isFinite(resultadoRedondeado)) {
            resultado.value = "0";
        } else {
            resultado.value = resultadoRedondeado.toFixed(1);
        }
    }

    inputNumero1.addEventListener("input", calcularResta);
    inputNumero2.addEventListener("input", calcularResta);
    
    // Calcular el valor inicial
    calcularResta();
}

// Función para configurar los ejemplos de fórmulas
function setupFormulasEjemplo() {
    // Configurar los listeners para la primera fórmula
    setupFormulaListeners('num1', 'num2', null, 'result', 'resultdo_ejemplo_1', 'division');
    
    // Configurar los listeners para la segunda fórmula
    setupFormulaListeners('num3', 'num4', 'num5', 'result2', 'resultdo_ejemplo_2', 'superficie');
    
    // Configurar los listeners para la tercera fórmula
    setupFormulaListeners('num6', 'num7', 'num8', 'result3', 'resultdo_ejemplo_3', 'diferencia');
    
    // Configurar el evento de envío del formulario
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(event) {
            // Actualizar todos los inputs ocultos antes de enviar el formulario
            updateHiddenInput('result', 'resultdo_ejemplo_1');
            updateHiddenInput('result2', 'resultdo_ejemplo_2');
            updateHiddenInput('result3', 'resultdo_ejemplo_3');
        });
    }
}

// Función para configurar los listeners de una fórmula
function setupFormulaListeners(input1Id, input2Id, input3Id, labelId, hiddenInputId, formulaType) {
    const input1 = document.getElementById(input1Id);
    const input2 = document.getElementById(input2Id);
    const input3 = input3Id ? document.getElementById(input3Id) : null;
    
    if (!input1 || !input2) return;
    
    const inputs = [input1, input2];
    if (input3) inputs.push(input3);
    
    // Añadir listeners a los inputs
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            // Actualizar el input oculto cuando cambia el valor del label
            setTimeout(() => {
                updateHiddenInput(labelId, hiddenInputId);
            }, 100); // Pequeño retraso para asegurar que el label se ha actualizado
        });
    });
    
    // Actualizar el input oculto al cargar la página
    setTimeout(() => {
        updateHiddenInput(labelId, hiddenInputId);
    }, 500); // Retraso mayor para asegurar que todos los cálculos iniciales se han completado
}

// Función para actualizar un input oculto con el valor del label
function updateHiddenInput(labelId, hiddenInputId) {
    const label = document.getElementById(labelId);
    const hiddenInput = document.getElementById(hiddenInputId);
    
    if (!label || !hiddenInput) return;
    
    // Obtener el texto del label y limpiarlo
    let value = label.textContent.trim();
    
    // Si el valor es "R" (valor inicial), establecer como vacío
    if (value === 'R') {
        hiddenInput.value = '';
        return;
    }
    
    // Guardar el valor en el input oculto
    hiddenInput.value = value;
    
    console.log(`Actualizado ${hiddenInputId} con valor: ${value}`);
}