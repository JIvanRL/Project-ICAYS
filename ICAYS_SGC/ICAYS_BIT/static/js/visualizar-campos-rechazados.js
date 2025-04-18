/**
 * Script para hacer los campos seleccionables y vincularlos con el modal de retroalimentación
 * 
 * Funcionalidad principal:
 * 1. Convierte campos de formulario en seleccionables
 * 2. Permite agregar observaciones a cada campo
 * 3. Muestra un resumen de todas las observaciones
 * 4. Proporciona feedback visual al usuario
 * 5. Guarda los campos seleccionados y sus observaciones
 */

// Espera a que el DOM esté completamente cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando script de campos seleccionables...');
    
    // =============================================
    // 1. OBTENER REFERENCIAS A ELEMENTOS DEL DOM
    // =============================================
    
    // Modal que contiene el formulario de observaciones
    const observacionesModal = document.getElementById('observacionesModal');
    
    // Textarea donde se escriben las observaciones
    const observacionesText = document.getElementById('observacionesText');
    
    // Botón para guardar las observaciones
    const guardarObservacionesBtn = document.getElementById('guardarObservaciones');
    
    // Botón para cerrar el modal (elemento con clase 'close')
    const closeBtn = document.querySelector('.close');
    
    // =============================================
    // 2. VARIABLES DE ESTADO
    // =============================================
    
    // Almacena la referencia al campo actualmente seleccionado
    let campoSeleccionado = null;
    
    // Almacena el ID del campo seleccionado (si no tiene ID, se genera uno)
    let campoSeleccionadoId = null;
    
    // Almacena el nombre del campo (obtenido del atributo name o id)
    let campoSeleccionadoNombre = null;
    
    // Objeto que almacena todas las observaciones por campo
    // Estructura: { "campoId1": "observacion1", "campoId2": "observacion2" }
    let observacionesPorCampo = {};
    
    // Array que almacena los IDs de los campos seleccionados
    // Estructura: ["campoId1", "campoId2", ...]
    let camposSeleccionados = [];
    
    // Indica si estamos en modo resumen (true) o edición (false)
    let modoResumen = false;
    
    // ID de la bitácora actual
    const bitacoraId = document.getElementById('bitacora_id')?.value;
    // Agregar estilos CSS
    agregarEstilosCSS();
    // =============================================
    // 1. OBTENER REFERENCIAS A ELEMENTOS DEL DOM
    // =============================================
    
    
    // Modal para observaciones generales
    observacionesModalGeneral = document.getElementById('observacionesModalGeneral');
    
    // Textarea para observaciones generales
    observacionesTextGeneral = document.getElementById('observacionesTextGeneral');
    
    // Botón para guardar observaciones generales
    guardarObservacionesGeneralBtn = document.getElementById('guardarObservacionesGeneral');
    
    // Botones para cerrar los modales (elementos con clase 'close')
    const closeBtns = document.querySelectorAll('.close');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            cerrarModalObservaciones();
            cerrarModalObservacionesGeneral();
        });
    });
    
    // Resto del código de inicialización...
    
    // Configurar evento para el botón de guardar observaciones generales
    if (guardarObservacionesGeneralBtn) {
        guardarObservacionesGeneralBtn.addEventListener('click', function() {
            guardarObservacionGeneral();
        });
    }
    
    // Configurar evento para el botón de resumen de observaciones
    const btnResumenObservaciones = document.getElementById('btnResumenObservaciones');
    if (btnResumenObservaciones) {
        btnResumenObservaciones.addEventListener('click', function() {
            abrirModalResumenObservaciones();
        });
    }
    
    // Hacer campos seleccionables
    hacerCamposSeleccionables();
    
    // =============================================
    // 3. FUNCIÓN PRINCIPAL - HACER CAMPOS SELECCIONABLES
    // =============================================
    
    /**
     * Convierte todos los campos de formulario relevantes en seleccionables
     * agregando overlays transparentes que capturan los clics.
     */
    function hacerCamposSeleccionables() {
        console.log('Configurando campos seleccionables...');
        
        // Selecciona todos los inputs (excepto botones), selects y textareas
        const todosLosCampos = document.querySelectorAll(
            'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"]), ' +
            'select, ' +
            'textarea:not(#observacionesText)' // Excluye el textarea del modal
        );
        
        // Filtra los campos para excluir los que no deben ser seleccionables
        const campos = Array.from(todosLosCampos).filter(campo => {
            // Excluye campos dentro del modal de firma
            if (campo.closest('.modal-firma') || 
                campo.closest('#modalFirma') || 
                campo.id === 'firma_input' ||
                campo.id === 'password' || 
                campo.name === 'password') {
                console.log('Excluyendo campo del modal de firma:', campo.id || campo.name);
                return false;
            }
            
            // Excluye campos dentro del modal de observaciones
            if (campo.closest('.modalOB') || 
                campo.closest('#observacionesModal')) {
                console.log('Excluyendo campo del modal de observaciones:', campo.id || campo.name);
                return false;
            }
            
            // Excluye el select de usuario_destino
            if (campo.id === 'usuario_destino' || 
                campo.name === 'usuario_destino') {
                console.log('Excluyendo select de usuario_destino');
                return false;
            }
            
            return true;
        });
        
        console.log(`Encontrados ${campos.length} campos para hacer seleccionables`);
        
        // Almacenamos todos los campos en un mapa para acceder a ellos después
        // cuando tengamos las observaciones de la base de datos
        window.todosCamposFormulario = {};
        campos.forEach(campo => {
            // Agrega clase CSS para estilización visual
            campo.classList.add('campo-seleccionable');
            
            // Guardamos referencia al campo usando su ID o nombre
            const campoId = campo.id || campo.name || '';
            if (campoId) {
                window.todosCamposFormulario[campoId] = campo;
            }
        });
        
        console.log('Campos seleccionables configurados correctamente');
        
        // Cargar datos guardados si existen
        // Esto creará los overlays solo para campos con observaciones
        cargarDatosGuardados();
    }
    
    // =============================================
    // 5. FUNCIONES PARA MANEJAR EL MODAL
    // =============================================
    
 /**
 * Abre el modal de observaciones y prepara el textarea
 * @param {string} labelText - Texto del label asociado al campo (para la plantilla)
 */
function abrirModalObservaciones(labelText = '') {
    console.log('Abriendo modal de observaciones...');
    
    const modalElement = document.getElementById('observacionesModal');
    if (modalElement) {
        const observacionesModal = new bootstrap.Modal(modalElement);
        
        // Actualiza el título del modal
        const tituloModal = document.getElementById('observacionesTitulo');
        if (tituloModal) {
            if (modoResumen) {
                tituloModal.textContent = 'Resumen de observaciones';
            } else {
                tituloModal.textContent = 'Tienes observaciones';
            }
        }
        
        // Actualiza la información del campo seleccionado
        const campoSeleccionadoInfo = document.getElementById('campoSeleccionadoInfo');
        const campoSeleccionadoNombre = document.getElementById('campoSeleccionadoNombre');
        
        if (campoSeleccionadoInfo && campoSeleccionadoNombre) {
            if (campoSeleccionado && !modoResumen) {
                campoSeleccionadoInfo.style.display = 'block';
                let nombreMostrado = labelText || campoSeleccionado.name || campoSeleccionado.id || 'Campo';
                campoSeleccionadoNombre.textContent = nombreMostrado;
                
                const tipoCampo = obtenerTipoCampoLegible(campoSeleccionado);
                if (tipoCampo) {
                    campoSeleccionadoNombre.textContent += ` (${tipoCampo})`;
                }
            } else {
                campoSeleccionadoInfo.style.display = 'none';
            }
        }
        
        // Obtener y mostrar la observación y el valor actual
        const comentarioObservacion = document.getElementById('comentarioObservacion');
        const textoObservacion = document.getElementById('textoObservacion');
        const observacionesText = document.getElementById('observacionesText');
        
        if (comentarioObservacion && textoObservacion && observacionesText) {
            if (!modoResumen && campoSeleccionadoId && observacionesPorCampo[campoSeleccionadoId]) {
                comentarioObservacion.style.display = 'block';
                
                let observacion = '';
                if (typeof observacionesPorCampo[campoSeleccionadoId] === 'object') {
                    observacion = observacionesPorCampo[campoSeleccionadoId].observacion || '';
                } else {
                    observacion = observacionesPorCampo[campoSeleccionadoId] || '';
                }
                
                textoObservacion.textContent = observacion;
                
                let valorActualInterfaz = obtenerValorCampo(campoSeleccionado);
                observacionesText.value = valorActualInterfaz;
                observacionesText.readOnly = false;
                
                personalizarPlaceholderSegunTipoCampo(observacionesText, campoSeleccionado);
            } else if (!modoResumen) {
                comentarioObservacion.style.display = 'none';
                
                if (campoSeleccionado) {
                    let valorActualInterfaz = obtenerValorCampo(campoSeleccionado);
                    observacionesText.value = valorActualInterfaz;
                    observacionesText.readOnly = false;
                    personalizarPlaceholderSegunTipoCampo(observacionesText, campoSeleccionado);
                } else {
                    observacionesText.value = '';
                    observacionesText.readOnly = false;
                    observacionesText.placeholder = "Ingrese un valor...";
                }
            } else if (modoResumen) {
                comentarioObservacion.style.display = 'none';
                mostrarResumenObservaciones();
            }
        }
        
        // Configura el botón de guardar según el modo
        if (guardarObservacionesBtn) {
            guardarObservacionesBtn.style.display = modoResumen ? 'none' : 'inline-block';
        }
        
        // Mostrar el modal usando Bootstrap
        observacionesModal.show();
        console.log('Modal abierto correctamente');
    } else {
        console.error('No se encontró el modal de observaciones');
        alert('Error: No se pudo abrir el modal de observaciones');
    }
}

    /**
    * Cierra el modal de observaciones y limpia la selección
    */
   function cerrarModalObservaciones() {
       console.log('Cerrando modal de observaciones...');
       const modalElement = document.getElementById('observacionesModal');
       if (modalElement) {
           const modal = bootstrap.Modal.getInstance(modalElement);
           if (modal) {
               modal.hide();
           }
           campoSeleccionado = null;
           modoResumen = false;
           console.log('Modal cerrado correctamente');
       }
   }
    /**
 * Cierra el modal de observaciones generales
 */
function cerrarModalObservacionesGeneral() {
    console.log('Cerrando modal de observaciones generales...');
    const modalElement = document.getElementById('observacionesModalGeneral');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        console.log('Modal de observaciones generales cerrado correctamente');
    }
}

/**
 * Guarda una observación general
 */
function guardarObservacionGeneral() {
    console.log('Guardando observación general...');
    
    // Obtener el texto de la observación general
    const observacionGeneral = observacionesTextGeneral ? observacionesTextGeneral.value : '';
    
    // Guardar la observación general
    observacionesPorCampo['observacion_general'] = {
        observacion: observacionGeneral,
        campo_nombre: 'Observación General',
        campo_tipo: 'general',
        valor_original: ''
    };
    
    // Guardar la observación general en el servidor
    guardarCampoEnServidor('observacion_general');
    
    // Cerrar el modal y mostrar mensaje de éxito
    cerrarModalObservacionesGeneral();
    mostrarMensaje('Observación general guardada correctamente');
    
    console.log('Observación general guardada');
}


function abrirModalResumenObservaciones() {
    console.log('Abriendo modal de resumen de observaciones...');
    
    const modalElement = document.getElementById('observacionesModalGeneral');
    if (modalElement) {
        const observacionesModalGeneral = new bootstrap.Modal(modalElement);
        
        // Actualiza el título del modal
        const tituloModal = document.getElementById('observacionesTituloGeneral');
        if (tituloModal) {
            tituloModal.textContent = 'Resumen de Observaciones';
        }
        
        // Ocultar la sección de comentario individual
        const comentarioObservacionGeneral = document.getElementById('comentarioObservacionGeneral');
        if (comentarioObservacionGeneral) {
            comentarioObservacionGeneral.style.display = 'none';
        }
        
        // Construir el texto del resumen
        let todasLasObservaciones = "RESUMEN DE OBSERVACIONES:\n\n";
        
        // Agregar contenido del resumen...
        if (observacionesPorCampo['observacion_general']) {
            todasLasObservaciones += "OBSERVACIÓN GENERAL:\n";
            if (typeof observacionesPorCampo['observacion_general'] === 'object') {
                todasLasObservaciones += observacionesPorCampo['observacion_general'].observacion + "\n\n";
            } else {
                todasLasObservaciones += observacionesPorCampo['observacion_general'] + "\n\n";
            }
        }
        
        // Contadores para estadísticas
        let totalCampos = 0;
        let camposCorregidos = 0;
        
        // Primera pasada: contar campos y verificar estados
        for (const [campoId, datos] of Object.entries(observacionesPorCampo)) {
            if (campoId !== 'observacion_general') {
                totalCampos++;
                
                // Un campo está corregido si:
                // 1. Tiene un valor actual diferente al original
                // 2. No tiene observación activa
                const tieneObservacionActiva = datos.observacion && datos.observacion.trim() !== '';
                const valorCambiado = datos.valor_actual !== datos.valor_original;
                
                // Un campo está corregido si no tiene observación activa y su valor ha cambiado
                if (!tieneObservacionActiva && valorCambiado) {
                    camposCorregidos++;
                }
            }
        }
        
        // Agrega las observaciones por campo
        let contador = 1;
        for (const [campoId, datos] of Object.entries(observacionesPorCampo)) {
            if (campoId !== 'observacion_general') {
                const campo = document.getElementById(campoId);
                let nombreCampo = campoId;
                let estadoCorreccion = "⚠️ No corregido";
                let valorActual = '';
                let valorOriginal = '';
                
                // Obtener valor original de los datos almacenados
                if (typeof datos === 'object') {
                    valorOriginal = datos.valor_original || '---';
                }
                
                // Obtener el valor actual del campo en el formulario
                if (campo) {
                    valorActual = obtenerValorActualCampo(campo);
                } else {
                    // Si no se encuentra el campo, usar el valor actual almacenado
                    valorActual = datos.valor_actual || valorOriginal;
                }
                
                const corregido = verificarCampoCorregido(campoId);
                if (corregido) {
                    estadoCorreccion = "✅ Corregido";
                }
                
                if (typeof datos === 'object') {
                    nombreCampo = datos.campo_nombre || campoId;
                    
                    // Formatea la observación para el resumen incluyendo siempre ambos valores
                    todasLasObservaciones += `${contador}. Campo: "${nombreCampo}" - ${estadoCorreccion}\n`;
                    todasLasObservaciones += `   Valor original: ${valorOriginal}\n`;
                    todasLasObservaciones += `   Valor actual: ${valorActual}\n`;
                    todasLasObservaciones += `   Observación: ${datos.observacion || ''}\n\n`;
                } else {
                    if (campo && campo.id) {
                        const label = document.querySelector(`label[for="${campo.id}"]`);
                        if (label) {
                            nombreCampo = label.textContent;
                        } else {
                            nombreCampo = campo.name || campo.id;
                        }
                    }
                    
                    todasLasObservaciones += `${contador}. Campo: "${nombreCampo}" - ${estadoCorreccion}\n`;
                    todasLasObservaciones += `   ${datos}\n\n`;
                }
                contador++;
            }
        }
        
        if (totalCampos === 0 && !observacionesPorCampo['observacion_general']) {
            todasLasObservaciones += "No hay observaciones específicas registradas.\n";
        } else {
            todasLasObservaciones += "RESUMEN ESTADÍSTICO:\n";
            todasLasObservaciones += `Total de campos con observaciones: ${totalCampos}\n`;
            todasLasObservaciones += `Campos corregidos: ${camposCorregidos} (${Math.round(camposCorregidos/totalCampos*100)}%)\n`;
            todasLasObservaciones += `Campos pendientes: ${totalCampos - camposCorregidos} (${Math.round((totalCampos-camposCorregidos)/totalCampos*100)}%)\n`;
        }
        
        // Mostrar el resumen en el textarea del modal general
        if (observacionesTextGeneral) {
            observacionesTextGeneral.value = todasLasObservaciones;
            observacionesTextGeneral.readOnly = true;
        }
        
        // Ocultar el botón de guardar en el modal general cuando se muestra el resumen
        if (guardarObservacionesGeneralBtn) {
            guardarObservacionesGeneralBtn.style.display = 'none';
        }
        
        // Mostrar el modal usando Bootstrap
        observacionesModalGeneral.show();
        console.log('Modal de resumen abierto correctamente');
    } else {
        console.error('No se encontró el modal de observaciones generales');
        alert('Error: No se pudo abrir el modal de resumen de observaciones');
    }
}

// Función auxiliar para obtener el valor actual de cualquier tipo de campo
function obtenerValorActualCampo(campo) {
    if (!campo) return '';
    
    switch (campo.type || campo.tagName.toLowerCase()) {
        case 'checkbox':
        case 'radio':
            return campo.checked ? 'Seleccionado' : 'No seleccionado';
            
        case 'select':
        case 'select-one':
            const opcion = campo.options[campo.selectedIndex];
            return opcion ? opcion.text : '';
            
        case 'textarea':
            return campo.value || '';
            
        default:
            return campo.value || '';
    }
}

    // =============================================
    // 6. FUNCIÓN PARA GUARDAR OBSERVACIONES
    // =============================================
    
    /**
     * Guarda la observación para el campo seleccionado actualmente
     * y actualiza la interfaz de usuario
     */
    function guardarObservacion() {
        console.log('Guardando observación...');
        
        // Caso para observación general (cuando no hay campo seleccionado)
        if (!campoSeleccionado) {
            console.log('No hay campo seleccionado, guardando como observación general');
            observacionesPorCampo['observacion_general'] = {
                observacion: observacionesText.value,
                campo_nombre: 'Observación General',
                campo_tipo: 'general',
                valor_original: ''
            };
            
            // Guardar la observación general como un campo especial
            guardarCampoEnServidor('observacion_general');
            
            cerrarModalObservaciones();
            mostrarMensaje('Observación general guardada correctamente');
            return;
        }
        
        // Obtener el valor actual del textarea (que ahora puede haber sido editado por el usuario)
        const observacionesText = document.getElementById('observacionesText');
        let valorEditado = observacionesText ? observacionesText.value : '';
        
        // Obtener el valor original del campo seleccionado (para referencia)
        let valorOriginal = '';
        
        // Si es la primera vez que se guarda este campo, almacenar el valor original
        if (!observacionesPorCampo[campoSeleccionadoId]) {
            valorOriginal = obtenerValorCampo(campoSeleccionado);
        } else if (observacionesPorCampo[campoSeleccionadoId].valor_original) {
            // Si ya existe, mantener el valor original
            valorOriginal = observacionesPorCampo[campoSeleccionadoId].valor_original;
        }
        
        // Obtener el nombre del campo
        let nombreCampo = campoSeleccionado.name || campoSeleccionado.id || 'Campo sin nombre';
        // Intentar obtener un nombre más descriptivo desde el label
        if (campoSeleccionado.id) {
            const label = document.querySelector(`label[for="${campoSeleccionado.id}"]`);
            if (label) {
                nombreCampo = label.textContent.trim();
            }
        }
        
        // Obtener la observación actual (comentario)
        const textoObservacion = document.getElementById('textoObservacion');
        let observacion = textoObservacion ? textoObservacion.textContent : '';
        
        // Si no hay observación en el elemento textoObservacion, intentar obtenerla del objeto observacionesPorCampo
        if (!observacion && observacionesPorCampo[campoSeleccionadoId]) {
            if (typeof observacionesPorCampo[campoSeleccionadoId] === 'object') {
                observacion = observacionesPorCampo[campoSeleccionadoId].observacion || '';
            } else {
                observacion = observacionesPorCampo[campoSeleccionadoId] || '';
            }
        }
        
        // Verificar si el valor ha cambiado
        const valorHaCambiado = valorEditado !== valorOriginal;
        
        // Obtener el historial de ediciones existente o crear uno nuevo
        let historialEdiciones = [];
        let contadorEdiciones = 0;
        
        if (observacionesPorCampo[campoSeleccionadoId] && observacionesPorCampo[campoSeleccionadoId].historial_ediciones) {
            historialEdiciones = observacionesPorCampo[campoSeleccionadoId].historial_ediciones;
            contadorEdiciones = observacionesPorCampo[campoSeleccionadoId].contador_ediciones || 0;
        }
        
        // Si el valor ha cambiado, agregar una nueva entrada al historial
        if (valorHaCambiado) {
            contadorEdiciones++;
            
            // Obtener información del usuario actual (puedes obtenerla del DOM o de una variable global)
            const usuarioId = document.getElementById('usuario_id')?.value || '0';
            const usuarioNombre = document.getElementById('usuario_nombre')?.value || 'Usuario';
            
            // Crear nueva entrada en el historial
            const nuevaEdicion = {
                numero_edicion: contadorEdiciones,
                valor_anterior: valorOriginal,
                valor_nuevo: valorEditado,
                usuario_id: usuarioId,
                usuario_nombre: usuarioNombre,
                fecha_edicion: new Date().toISOString()
            };
            
            // Agregar la nueva edición al historial
            historialEdiciones.push(nuevaEdicion);
        }
        
        // Guarda los datos manteniendo el valor original intacto
        observacionesPorCampo[campoSeleccionadoId] = {
            ...observacionesPorCampo[campoSeleccionadoId],
            observacion: observacion,
            valor_original: valorOriginal, // Mantener el valor original
            valor_actual: valorEditado,    // Actualizar solo el valor actual
            campo_nombre: nombreCampo,
            campo_tipo: campoSeleccionado.type || campoSeleccionado.tagName.toLowerCase(),
            historial_ediciones: historialEdiciones,
            contador_ediciones: contadorEdiciones
        };
        
        // Verificar si el campo ha sido corregido (valor actual ≠ valor original)
        const corregido = verificarCampoCorregido(campoSeleccionadoId);
        
        // Actualizar visualmente el campo en el formulario principal
        actualizarCampoVisualmente(campoSeleccionado, valorEditado, corregido);
        
        // Agregar overlay al campo si no lo tiene ya
        if (!campoSeleccionado.parentNode.querySelector('.campo-overlay')) {
            // Código para agregar overlay (sin cambios)...
        }
        
        // Agrega el campo a la lista de campos seleccionados si no está ya
        if (!camposSeleccionados.includes(campoSeleccionadoId)) {
            camposSeleccionados.push(campoSeleccionadoId);
            console.log('Campo agregado a la lista de seleccionados:', campoSeleccionadoId);
        }
        
        // Actualiza el contador de observaciones
        actualizarContadorObservaciones();
        
        // Cierra el modal y muestra mensaje de éxito
        cerrarModalObservaciones();
        mostrarMensaje('Valor guardado correctamente');
        
        // Guardar este campo específico en el servidor
        guardarCampoEnServidor(campoSeleccionadoId);
        
        console.log('Valor guardado para campo:', campoSeleccionadoId, 'valor original:', valorOriginal, 'valor editado:', valorEditado, 'corregido:', corregido);
    }
/**
 * Actualiza visualmente el campo en el formulario principal con el valor editado
 * @param {HTMLElement} campo - El campo a actualizar
 * @param {string} valorEditado - El nuevo valor para el campo
 * @param {boolean} corregido - Indica si el campo está corregido
 */
function actualizarCampoVisualmente(campo, valorEditado, corregido) {
    if (!campo) return;
    
    const tipoCampo = campo.type || campo.tagName.toLowerCase();
    
    try {
        switch (tipoCampo) {
            case 'checkbox':
                // Para checkboxes, el valor editado debe ser "Seleccionado" o "No seleccionado"
                campo.checked = valorEditado.toLowerCase() === 'seleccionado';
                break;
                
            case 'radio':
                // Para radio buttons, el valor editado debe ser "Seleccionado" o "No seleccionado"
                campo.checked = valorEditado.toLowerCase() === 'seleccionado';
                break;
                
            case 'select':
            case 'select-one':
                // Para selects, buscar la opción que coincida con el texto
                const opciones = campo.options;
                let encontrado = false;
                
                for (let i = 0; i < opciones.length; i++) {
                    if (opciones[i].text === valorEditado) {
                        campo.selectedIndex = i;
                        encontrado = true;
                        break;
                    }
                }
                
                // Si no se encontró una coincidencia exacta, intentar con una coincidencia parcial
                if (!encontrado) {
                    for (let i = 0; i < opciones.length; i++) {
                        if (opciones[i].text.includes(valorEditado) || valorEditado.includes(opciones[i].text)) {
                            campo.selectedIndex = i;
                            break;
                        }
                    }
                }
                break;
                
            case 'date':
                // Para campos de fecha, asegurarse de que el formato sea YYYY-MM-DD
                if (valorEditado && valorEditado !== '---') {
                    // Intentar convertir diferentes formatos de fecha a YYYY-MM-DD
                    try {
                        const fecha = new Date(valorEditado);
                        if (!isNaN(fecha.getTime())) {
                            const yyyy = fecha.getFullYear();
                            const mm = String(fecha.getMonth() + 1).padStart(2, '0');
                            const dd = String(fecha.getDate()).padStart(2, '0');
                            campo.value = `${yyyy}-${mm}-${dd}`;
                        } else {
                            campo.value = valorEditado;
                        }
                    } catch (e) {
                        campo.value = valorEditado;
                    }
                } else {
                    campo.value = '';
                }
                break;
                
            case 'time':
                // Para campos de hora, asegurarse de que el formato sea HH:MM
                if (valorEditado && valorEditado !== '---') {
                    // Intentar convertir diferentes formatos de hora a HH:MM
                    const horaRegex = /(\d{1,2}):(\d{2})(?::(\d{2}))?/;
                    const match = valorEditado.match(horaRegex);
                    
                    if (match) {
                        const hh = String(match[1]).padStart(2, '0');
                        const mm = match[2];
                        campo.value = `${hh}:${mm}`;
                    } else {
                        campo.value = valorEditado;
                    }
                } else {
                    campo.value = '';
                }
                break;
                
            case 'textarea':
                // Para textareas, simplemente establecer el valor
                campo.value = valorEditado;
                break;
                
            default:
                // Para inputs de texto y otros tipos, establecer el valor directamente
                campo.value = valorEditado;
                break;
        }

        // Obtener el ID del campo
        const campoId = campo.id || campo.name;
        const datos = observacionesPorCampo[campoId];

        // Verificar si el campo tiene observación y si ha sido modificado
        const tieneObservacion = datos?.observacion ? true : false;
        const valorHaCambiado = valorEditado !== datos?.valor_original;

        // Aplicar estilo según el estado
        if (tieneObservacion && !valorHaCambiado) {
            // Si tiene observación y no ha sido modificado: ROJO
            campo.classList.remove('corregido');
            campo.classList.add('tiene-observacion');
            campo.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
        } else if (valorHaCambiado) {
            // Si el valor ha cambiado: VERDE
            campo.classList.remove('tiene-observacion');
            campo.classList.add('corregido');
            campo.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
        }

        campo.style.transition = 'background-color 0.5s';
        
        console.log(`Campo ${campoId} actualizado:`, {
            tieneObservacion,
            valorOriginal: datos?.valor_original,
            valorActual: valorEditado,
            valorHaCambiado
        });
    } catch (error) {
        console.error('Error al actualizar visualmente el campo:', error);
    }
}

/**
 * Verifica si un campo está corregido
 * @param {string} campoId - ID del campo a verificar
 * @returns {boolean} - Indica si el campo está corregido
 */
function verificarCampoCorregido(campoId) {
    if (!observacionesPorCampo[campoId]) return false;
    
    const datos = observacionesPorCampo[campoId];
    
    // Verificar si tiene observación y si el valor ha cambiado
    const tieneObservacion = datos.observacion ? true : false;
    const valorCambiado = datos.valor_actual !== datos.valor_original;
    
    // Un campo está corregido si ha sido modificado, sin importar si tiene observación
    return valorCambiado;
}

    // Reemplaza la función guardarCampoEnServidor con esta versión mejorada
function guardarCampoEnServidor(campoId) {
    // Depuración del ID de bitácora
    console.log('bitacoraId:', bitacoraId);
    console.log('tipo de bitacoraId:', typeof bitacoraId);
    
    // Verificar el elemento HTML que contiene el ID de la bitácora
    const bitacoraIdElement = document.getElementById('bitacora_id');
    if (bitacoraIdElement) {
        console.log('Elemento bitacora_id encontrado:', bitacoraIdElement);
        console.log('Valor del elemento:', bitacoraIdElement.value);
    } else {
        console.log('Elemento bitacora_id NO encontrado');
    }
    
    // Usar el valor del elemento si está disponible, o el valor de la variable global
    const bitacoraIdFinal = bitacoraIdElement ? bitacoraIdElement.value : bitacoraId;
    
    if (!bitacoraIdFinal) {
        console.error('No se pudo obtener el ID de la bitácora');
        mostrarMensaje('Error: No se pudo obtener el ID de la bitácora', true);
        return;
    }
    
    if (!campoId) {
        console.error('No se especificó un ID de campo');
        mostrarMensaje('Error: No se especificó un ID de campo', true);
        return;
    }
    
    // Obtener los datos del campo
    const datosCampo = observacionesPorCampo[campoId];
    if (!datosCampo) {
        console.error('No se encontraron datos para el campo:', campoId);
        mostrarMensaje('Error: No se encontraron datos para el campo', true);
        return;
    }
    
    console.log('Guardando campo en el servidor:', campoId, datosCampo);
    
    // Obtener el nombre del usuario que está editando (si está disponible)
    const usuarioActual = document.getElementById('usuario_actual')?.value || 'Usuario desconocido';
    
    // Crear objeto con los datos a guardar
    const datos = {
        bitacora_id: bitacoraIdFinal,
        campo_id: campoId,
        campo_nombre: datosCampo.campo_nombre || 'Campo sin nombre',
        valor_original: datosCampo.valor_original || '',
        valor_actual: datosCampo.valor_actual || datosCampo.valor_original || '',
        campo_tipo: datosCampo.campo_tipo || 'desconocido',
        observacion: datosCampo.observacion || '',
        editado_por: usuarioActual,
        historial_ediciones: JSON.stringify(datosCampo.historial_ediciones || []),
        contador_ediciones: datosCampo.contador_ediciones || 0,
        csrfmiddlewaretoken: getCookie('csrftoken')
    };
    
    // Imprimir los datos que se enviarán para depuración
    console.log('Datos que se enviarán al servidor:', datos);
    
    // Mostrar indicador de carga
    mostrarMensaje('Guardando campo...', false);
    
    // Enviar datos al servidor mediante AJAX
    $.ajax({
        url: '/microbiologia/guardar_campos_corregidos/',
        type: 'POST',
        data: datos,
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(response) {
            console.log('Respuesta del servidor (éxito):', response);
            mostrarMensaje('Campo guardado correctamente', false);
            
            // Si la respuesta incluye historial, actualizar el objeto local
            if (response.historial) {
                observacionesPorCampo[campoId].historial_ediciones = response.historial;
                observacionesPorCampo[campoId].contador_ediciones = response.contador || 0;
            }
            
            // Verificar si el campo ha sido corregido
            const campo = document.getElementById(campoId);
            if (campo) {
                const corregido = verificarCampoCorregido(campoId);
                
                // Actualizar la clase del campo según si está corregido o no
                if (corregido) {
                    campo.classList.remove('tiene-observacion');
                    campo.classList.add('corregido');
                } else {
                    campo.classList.remove('corregido');
                    campo.classList.add('tiene-observacion');
                }
                
                // Actualizar el objeto observacionesPorCampo con el estado corregido
                observacionesPorCampo[campoId].corregido = corregido;
            }
            
            // Actualizar el contador de observaciones
            actualizarContadorObservaciones();
        },
        error: function(xhr, status, error) {
            console.error('Error al guardar campo:', error);
            console.error('Estado de la respuesta:', xhr.status);
            console.error('Texto de la respuesta:', xhr.responseText);
            
            try {
                const respuesta = xhr.responseJSON || (xhr.responseText ? JSON.parse(xhr.responseText) : {});
                console.error('Respuesta del servidor (error):', respuesta);
                mostrarMensaje('Error al guardar campo: ' + (respuesta.message || error), true);
            } catch (e) {
                console.error('No se pudo parsear la respuesta como JSON:', e);
                mostrarMensaje('Error al guardar campo: ' + error, true);
            }
        }
    });
}
    
    /**
     * Carga los datos guardados previamente desde el servidor
     * Obtiene las observaciones y campos seleccionados directamente de la tabla ObservacionCampo
     */
    function cargarDatosGuardados() {
        if (!bitacoraId) {
            console.error('No se pudo obtener el ID de la bitácora');
            return;
        }
        
        console.log('Cargando datos guardados para bitácora ID:', bitacoraId);
        
        // Mostrar indicador de carga si es necesario
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        // Realizar petición AJAX para obtener los datos
        $.ajax({
            url: `/microbiologia/obtener_campos_observaciones/${bitacoraId}/`,
            type: 'GET',
            dataType: 'json',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                console.log('Respuesta del servidor:', response);
                
                if (response.success) {
                    // Limpiar datos actuales
                    observacionesPorCampo = {};
                    camposSeleccionados = [];
                    
                    // Cargar observaciones individuales desde la tabla ObservacionCampo
                    if (response.observaciones_individuales && response.observaciones_individuales.length > 0) {
                        console.log(`Cargando ${response.observaciones_individuales.length} observaciones desde la BD`);
                        
                        response.observaciones_individuales.forEach(obs => {
                            // Actualizar el objeto observacionesPorCampo con los datos de la BD
                            observacionesPorCampo[obs.campo_id] = {
                                observacion: obs.observacion || '',
                                valor_original: obs.valor_original || '',
                                valor_actual: obs.valor_actual || obs.valor_original || '',
                                campo_nombre: obs.campo_nombre || 'Campo sin nombre',
                                campo_tipo: obs.campo_tipo || 'desconocido',
                                historial_ediciones: obs.historial_ediciones || [],
                                contador_ediciones: obs.contador_ediciones || 0
                            };
                            
                            // Agregar el campo a la lista de seleccionados si no está ya
                            if (!camposSeleccionados.includes(obs.campo_id)) {
                                camposSeleccionados.push(obs.campo_id);
                            }
                            
                            // Buscar el campo en el DOM y crear overlay solo para campos con observaciones
                            let campo = document.getElementById(obs.campo_id);
                            if (!campo) {
                                // Intentar buscar por nombre si no se encuentra por ID
                                const camposPorNombre = document.getElementsByName(obs.campo_id);
                                if (camposPorNombre.length > 0) {
                                    campo = camposPorNombre[0];
                                } else if (window.todosCamposFormulario && window.todosCamposFormulario[obs.campo_id]) {
                                    // Intentar obtener del mapa de campos
                                    campo = window.todosCamposFormulario[obs.campo_id];
                                }
                            }
                            
                            if (campo && obs.campo_id !== 'observacion_general') {
                                console.log(`Creando overlay para campo con observación: ${obs.campo_id}`);
                                
                                // Verificar si el campo ha sido corregido
                                const corregido = obs.valor_actual && obs.valor_actual !== obs.valor_original;
                                
                                // Aplicar clase según si está corregido o no
                                if (corregido) {
                                    campo.classList.remove('tiene-observacion');
                                    campo.classList.add('corregido');
                                } else {
                                    campo.classList.remove('corregido');
                                    campo.classList.add('tiene-observacion');
                                }
                                
                                // Actualizar el valor visual del campo
                                actualizarCampoVisualmente(campo, obs.valor_actual || obs.valor_original, corregido);
                                
                                // Verificar si ya tiene un overlay
                                if (!campo.parentNode.querySelector('.campo-overlay')) {
                                    // Crea un div transparente que cubrirá el campo para capturar clics
                                    const overlay = document.createElement('div');
                                    overlay.className = 'campo-overlay';
                                    
                                    // Estilos para el overlay (cubre completamente el campo)
                                    overlay.style.position = 'absolute';
                                    overlay.style.top = '0';
                                    overlay.style.left = '0';
                                    overlay.style.width = '100%';
                                    overlay.style.height = '100%';
                                    overlay.style.cursor = 'pointer';
                                    overlay.style.zIndex = '100'; // Asegura que esté por encima del campo
                                    overlay.style.backgroundColor = 'transparent'; // Fondo transparente
                                    overlay.style.border = 'none'; // Sin borde
                                    
                                    // Asegura que el campo tenga posición relativa para el overlay
                                    if (getComputedStyle(campo).position === 'static') {
                                        campo.style.position = 'relative';
                                    }
                                    
                                    // Agrega el overlay como hijo del contenedor del campo
                                    campo.parentNode.style.position = 'relative';
                                    campo.parentNode.appendChild(overlay);
                                    
                                    // Asocia el overlay con el campo mediante atributo data
                                    overlay.dataset.targetField = campo.id || campo.name || '';
                                    
                                    // Agrega el evento click al overlay
                                    overlay.addEventListener('click', function(e) {
                                        // Previene el comportamiento por defecto y la propagación
                                        e.preventDefault();
                                        e.stopPropagation();
                                        
                                        console.log('Overlay clickeado para campo:', this.dataset.targetField);
                                        
                                        // Encuentra el campo asociado al overlay
                                        const campoAsociado = document.getElementById(this.dataset.targetField) || 
                                                             document.getElementsByName(this.dataset.targetField)[0];
                                        
                                        if (!campoAsociado) {
                                            console.error('No se pudo encontrar el campo asociado al overlay');
                                            return;
                                        }
                                        
                                        // Deselecciona todos los campos
                                        document.querySelectorAll('.campo-seleccionado').forEach(c => {
                                            c.classList.remove('campo-seleccionado');
                                        });
                                        
                                        // Selecciona el campo actual
                                        campoAsociado.classList.add('campo-seleccionado');
                                        
                                        // Actualiza las variables de estado
                                        campoSeleccionado = campoAsociado;
                                        campoSeleccionadoId = campoAsociado.id || 'campo-sin-id-' + Math.random().toString(36).substr(2, 9);
                                        campoSeleccionadoNombre = campoAsociado.name || campoAsociado.id || 'Campo sin nombre';
                                        
                                        // Obtiene el texto del label asociado si existe
                                        let labelText = 'Campo';
                                        if (campoAsociado.id) {
                                            const label = document.querySelector(`label[for="${campoAsociado.id}"]`);
                                            if (label) {
                                                labelText = label.textContent;
                                            }
                                        }
                                        
                                        // Establece modo edición
                                        modoResumen = false;
                                        
                                        // Abre el modal de observaciones con el nombre del campo
                                        abrirModalObservaciones(labelText);
                                        
                                        console.log('Modal de observaciones abierto para campo:', campoSeleccionadoId);
                                    });
                                    
                                    // NO APLICAR ESTILOS ADICIONALES AQUÍ
                                    // Eliminar cualquier estilo inline que pueda estar interfiriendo
                                    campo.style.removeProperty('borderColor');
                                    campo.style.removeProperty('backgroundColor');
                                }
                            } else if (obs.campo_id !== 'observacion_general') {
                                console.warn(`No se encontró el elemento con ID o nombre: ${obs.campo_id}`);
                            }
                        });
                        
                        console.log('Observaciones individuales cargadas:', observacionesPorCampo);
                        console.log('Campos seleccionados cargados:', camposSeleccionados);
                    } else {
                        console.log('No se encontraron observaciones individuales para esta bitácora');
                    }
                    
                    // Cargar observación general si existe
                    const observacionGeneral = response.observaciones_individuales?.find(obs => obs.campo_id === 'observacion_general');
                    if (observacionGeneral) {
                        observacionesPorCampo['observacion_general'] = {
                            observacion: observacionGeneral.observacion || '',
                            campo_nombre: 'Observación General',
                            campo_tipo: 'general',
                            valor_original: ''
                        };
                        console.log('Observación general cargada');
                    }
                    
                    // Actualizar contador de observaciones
                    actualizarContadorObservaciones();
                } else {
                    console.warn('No se pudieron cargar los datos:', response.message);
                    mostrarMensaje('No se pudieron cargar los datos: ' + response.message, true);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error al cargar datos:', error);
                console.error('Respuesta del servidor:', xhr.responseText);
                mostrarMensaje('Error al cargar datos: ' + error, true);
            },
            complete: function() {
                // Ocultar indicador de carga si es necesario
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            }
        });
    }
    
    /**
     * Obtiene el valor de una cookie por su nombre
     * @param {string} name - Nombre de la cookie
     * @returns {string} - Valor de la cookie
     */
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

    // =============================================
    // 8. FUNCIONES AUXILIARES
    // =============================================
    
    /**
     * Muestra un resumen de todas las observaciones en el modal
     */
    function mostrarResumenObservaciones() {
        // Construye el texto del resumen
        let todasLasObservaciones = "RESUMEN DE OBSERVACIONES:\n\n";
        
        // Agrega la observación general si existe
        if (observacionesPorCampo['observacion_general']) {
            todasLasObservaciones += "OBSERVACIÓN GENERAL:\n";
            // Verifica si es un objeto o un string
            if (typeof observacionesPorCampo['observacion_general'] === 'object') {
                todasLasObservaciones += observacionesPorCampo['observacion_general'].observacion + "\n\n";
            } else {
                todasLasObservaciones += observacionesPorCampo['observacion_general'] + "\n\n";
            }
        }
        
        // Contadores para estadísticas
        let totalCampos = 0;
        let camposCorregidos = 0;
        
        // Primera pasada: contar campos y verificar estados
        for (const [campoId, datos] of Object.entries(observacionesPorCampo)) {
            if (campoId !== 'observacion_general') {
                totalCampos++;
                
                // Un campo está corregido si:
                // 1. Tiene un valor actual diferente al original
                // 2. No tiene observación activa
                const tieneObservacionActiva = datos.observacion && datos.observacion.trim() !== '';
                const valorCambiado = datos.valor_actual !== datos.valor_original;
                
                // Un campo está corregido si no tiene observación activa y su valor ha cambiado
                if (!tieneObservacionActiva && valorCambiado) {
                    camposCorregidos++;
                }
            }
        }
        
        // Agrega las observaciones por campo
        let contador = 1;
        for (const [campoId, datos] of Object.entries(observacionesPorCampo)) {
            if (campoId !== 'observacion_general') {
                const campo = document.getElementById(campoId);
                let nombreCampo = campoId;
                let estadoCorreccion = "⚠️ No corregido";
                let valorActual = '';
                let valorOriginal = '';
                
                // Obtener valor original de los datos almacenados
                if (typeof datos === 'object') {
                    valorOriginal = datos.valor_original || '---';
                }
                
                // Obtener el valor actual del campo en el formulario
                if (campo) {
                    valorActual = obtenerValorActualCampo(campo);
                } else {
                    // Si no se encuentra el campo, usar el valor actual almacenado
                    valorActual = datos.valor_actual || valorOriginal;
                }
                
                const corregido = verificarCampoCorregido(campoId);
                if (corregido) {
                    estadoCorreccion = "✅ Corregido";
                }
                
                if (typeof datos === 'object') {
                    nombreCampo = datos.campo_nombre || campoId;
                    
                    // Formatea la observación para el resumen incluyendo siempre ambos valores
                    todasLasObservaciones += `${contador}. Campo: "${nombreCampo}" - ${estadoCorreccion}\n`;
                    todasLasObservaciones += `   Valor original: ${valorOriginal}\n`;
                    todasLasObservaciones += `   Valor actual: ${valorActual}\n`;
                    todasLasObservaciones += `   Observación: ${datos.observacion || ''}\n\n`;
                } else {
                    if (campo && campo.id) {
                        const label = document.querySelector(`label[for="${campo.id}"]`);
                        if (label) {
                            nombreCampo = label.textContent;
                        } else {
                            nombreCampo = campo.name || campo.id;
                        }
                    }
                    
                    todasLasObservaciones += `${contador}. Campo: "${nombreCampo}" - ${estadoCorreccion}\n`;
                    todasLasObservaciones += `   ${datos}\n\n`;
                }
                contador++;
            }
        }
        
        // Mensaje si no hay observaciones
        if (totalCampos === 0 && !observacionesPorCampo['observacion_general']) {
            todasLasObservaciones += "No hay observaciones específicas registradas.\n";
        } else {
            // Agregar resumen estadístico
            todasLasObservaciones += "RESUMEN ESTADÍSTICO:\n";
            todasLasObservaciones += `Total de campos con observaciones: ${totalCampos}\n`;
            todasLasObservaciones += `Campos corregidos: ${camposCorregidos} (${Math.round(camposCorregidos/totalCampos*100)}%)\n`;
            todasLasObservaciones += `Campos pendientes: ${totalCampos - camposCorregidos} (${Math.round((totalCampos-camposCorregidos)/totalCampos*100)}%)\n`;
        }
        
        // Muestra el resumen en el textarea y abre el modal
        if (observacionesText) {
            observacionesText.value = todasLasObservaciones;
        }
        
        if (observacionesModal) {
            observacionesModal.style.display = 'block';
            
            // Oculta el botón de guardar en modo resumen
            if (guardarObservacionesBtn) {
                guardarObservacionesBtn.style.display = 'none';
            }
        }
    }
    
    /**
     * Actualiza el contador de observaciones en el botón de retroalimentación
     * Considera la estructura de datos donde observacionesPorCampo contiene objetos
     * y los datos provienen de la base de datos
     */
    function actualizarContadorObservaciones() {
        const observacionesBtn = document.getElementById('btnResumenObservaciones');
        if (!observacionesBtn) {
            console.warn('No se encontró el botón de retroalimentación para actualizar el contador');
            return;
        }
        
        // Filtra las claves para contar solo campos reales (excluyendo observación general)
        const camposConObservacion = Object.keys(observacionesPorCampo).filter(key => {
            return key !== 'observacion_general';
        });
        
        // Cuenta total de campos con observaciones
        const totalCampos = camposConObservacion.length;
        
        // Actualiza el texto del botón
        observacionesBtn.textContent = `Retroalimentación (${totalCampos})`;
        
        // Cambia el estilo del botón si hay observaciones
        if (totalCampos > 0) {
            observacionesBtn.classList.add('tiene-observaciones');
        } else {
            observacionesBtn.classList.remove('tiene-observaciones');
        }
        
        console.log('Contador de observaciones actualizado:', totalCampos, 'campos con observaciones');
        
        // Opcional: Actualizar un contador global visible en la interfaz si existe
        const contadorGlobal = document.getElementById('contador-observaciones-global');
        if (contadorGlobal) {
            contadorGlobal.textContent = totalCampos.toString();
            contadorGlobal.style.display = totalCampos > 0 ? 'inline-block' : 'none';
        }
    }
    
    /**
     * Muestra un mensaje temporal al usuario
     * @param {string} mensaje - Texto a mostrar
     * @param {boolean} esError - Indica si es un mensaje de error
     */
    function mostrarMensaje(mensaje, esError = false) {
        console.log('Mostrando mensaje:', mensaje);
        
        // Elimina mensaje existente si hay uno
        let mensajeDiv = document.querySelector('.mensaje-flotante');
        if (mensajeDiv) {
            document.body.removeChild(mensajeDiv);
        }
        
        // Crea nuevo elemento para el mensaje
        mensajeDiv = document.createElement('div');
        mensajeDiv.className = 'mensaje-flotante';
        if (esError) {
            mensajeDiv.classList.add('mensaje-error');
        }
        mensajeDiv.textContent = mensaje;
        document.body.appendChild(mensajeDiv);
        
        // Configura temporizador para desvanecer y eliminar el mensaje
        setTimeout(() => {
            mensajeDiv.classList.add('desaparecer');
            setTimeout(() => {
                if (document.body.contains(mensajeDiv)) {
                    document.body.removeChild(mensajeDiv);
                }
            }, 500);
        }, 3000);
    }
    
    // =============================================
    // 8. CONFIGURACIÓN DE EVENTOS
    // =============================================
    
    // Evento para el botón de cerrar del modal
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            cerrarModalObservaciones();
        });
        console.log('Evento de cierre del modal configurado');
    } else {
        console.error('No se encontró el botón de cierre del modal');
    }
    
    // Evento para el botón de guardar observaciones
    if (guardarObservacionesBtn) {
        guardarObservacionesBtn.addEventListener('click', function() {
            guardarObservacion();
        });
        console.log('Evento de guardar observaciones configurado');
    } else {
        console.error('No se encontró el botón de guardar observaciones');
    }
    
    // =============================================
    // 9. MODIFICACIÓN DEL BOTÓN DE RETROALIMENTACIÓN
    // =============================================
    
    const observacionesBtn = document.getElementById('observacionesBtn');
    if (observacionesBtn) {
        // Clona el botón para evitar problemas con eventos existentes
        const nuevoBtn = observacionesBtn.cloneNode(true);
        observacionesBtn.parentNode.replaceChild(nuevoBtn, observacionesBtn);
        
        // Agrega nuevo evento al botón clonado
        nuevoBtn.addEventListener('click', function() {
            console.log('Botón de retroalimentación clickeado');
            
            // Prepara para mostrar todas las observaciones
            campoSeleccionado = null;
            campoSeleccionadoId = null;
            
            // Establece modo resumen
            modoResumen = true;
            
            // Verificar si tenemos observaciones cargadas
            const hayObservaciones = Object.keys(observacionesPorCampo).length > 0;
            
            if (!hayObservaciones) {
                // Si no hay observaciones cargadas, intentamos cargarlas desde el servidor
                console.log('No hay observaciones cargadas, intentando cargar desde el servidor...');
                
                // Mostrar indicador de carga
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'block';
                } else {
                    mostrarMensaje('Cargando observaciones...', false);
                }
                
                // Realizar petición AJAX para obtener las observaciones
                $.ajax({
                    url: `/microbiologia/obtener_campos_observaciones/${bitacoraId}/`,
                    type: 'GET',
                    dataType: 'json',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    success: function(response) {
                        console.log('Respuesta del servidor:', response);
                        
                        if (response.success) {
                            // Cargar observaciones individuales desde la tabla ObservacionCampo
                            if (response.observaciones_individuales && response.observaciones_individuales.length > 0) {
                                console.log(`Cargando ${response.observaciones_individuales.length} observaciones desde la BD`);
                                
                                // Limpiar datos actuales
                                observacionesPorCampo = {};
                                camposSeleccionados = [];
                                
                                response.observaciones_individuales.forEach(obs => {
                                    // Actualizar el objeto observacionesPorCampo con los datos de la BD
                                    observacionesPorCampo[obs.campo_id] = {
                                        observacion: obs.observacion || '',
                                        valor_original: obs.valor_original || '',
                                        campo_nombre: obs.campo_nombre || 'Campo sin nombre',
                                        campo_tipo: obs.campo_tipo || 'desconocido'
                                    };
                                    
                                    // Agregar el campo a la lista de seleccionados si no está ya
                                    if (!camposSeleccionados.includes(obs.campo_id)) {
                                        camposSeleccionados.push(obs.campo_id);
                                    }
                                });
                                
                                // Ahora que tenemos las observaciones, mostrar el resumen
                                mostrarResumenObservaciones();
                            } else {
                                // No hay observaciones, mostrar mensaje
                                observacionesText.value = "No hay observaciones registradas para esta bitácora.";
                                observacionesModal.style.display = 'block';
                                
                                // Ocultar el botón de guardar en modo resumen
                                if (guardarObservacionesBtn) {
                                    guardarObservacionesBtn.style.display = 'none';
                                }
                            }
                        } else {
                            console.warn('No se pudieron cargar los datos:', response.message);
                            mostrarMensaje('No se pudieron cargar los datos: ' + response.message, true);
                            
                            // Mostrar mensaje de error en el modal
                            observacionesText.value = "Error al cargar las observaciones: " + response.message;
                            observacionesModal.style.display = 'block';
                            
                            // Ocultar el botón de guardar en modo resumen
                            if (guardarObservacionesBtn) {
                                guardarObservacionesBtn.style.display = 'none';
                            }
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('Error al cargar datos:', error);
                        console.error('Respuesta del servidor:', xhr.responseText);
                        mostrarMensaje('Error al cargar datos: ' + error, true);
                        
                        // Mostrar mensaje de error en el modal
                        observacionesText.value = "Error al cargar las observaciones: " + error;
                        observacionesModal.style.display = 'block';
                        
                        // Ocultar el botón de guardar en modo resumen
                        if (guardarObservacionesBtn) {
                            guardarObservacionesBtn.style.display = 'none';
                        }
                    },
                    complete: function() {
                        // Ocultar indicador de carga
                        if (loadingIndicator) {
                            loadingIndicator.style.display = 'none';
                        }
                    }
                });
            } else {
                // Ya tenemos observaciones cargadas, mostrar el resumen directamente
                mostrarResumenObservaciones();
            }
        });
        console.log('Evento del botón de retroalimentación configurado');
    } else {
        console.error('No se encontró el botón de retroalimentación');
    }
    
 /**
 * Agregar estilos CSS para los campos corregidos
 */
function agregarEstilosCSS() {
    const style = document.createElement('style');
    style.textContent = `
        /* Estilo para campos con observaciones (rojo) */
        .tiene-observacion {
            border: 2px solid #dc3545 !important;
            background-color: rgba(220, 53, 69, 0.1) !important;
        }
        
        /* Estilo para campos corregidos (verde) */
        .corregido {
            border: 2px solid rgb(18, 210, 63) !important;
            background-color: rgba(40, 167, 69, 0.1) !important;
        }
        
        /* Para checkboxes y radio buttons */
        input[type="checkbox"].tiene-observacion,
        input[type="radio"].tiene-observacion {
            outline: 2px solid #dc3545 !important;
        }
        
        input[type="checkbox"].corregido,
        input[type="radio"].corregido {
            outline: 2px solid #28a745 !important;
        }
        
        /* Para selects */
        select.tiene-observacion {
            border: 2px solid #dc3545 !important;
            background-color: rgba(220, 53, 69, 0.1) !important;
        }
        
        select.corregido {
            border: 2px solid #28a745 !important;
            background-color: rgba(40, 167, 69, 0.1) !important;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Obtiene el valor de un campo según su tipo
 * @param {HTMLElement} campo - El campo del que se quiere obtener el valor
 * @returns {string} - El valor del campo formateado según su tipo
 */
function obtenerValorCampo(campo) {
    if (!campo) return '';
    
    switch (campo.type || campo.tagName.toLowerCase()) {
        case 'checkbox':
            return campo.checked ? 'Seleccionado' : 'No seleccionado';
            
        case 'radio':
            return campo.checked ? 'Seleccionado' : 'No seleccionado';
            
        case 'select':
        case 'select-one':
            const opcionSeleccionada = campo.options[campo.selectedIndex];
            return opcionSeleccionada ? opcionSeleccionada.text : '';
            
        case 'date':
            return campo.value || '---';
            
        case 'time':
            return campo.value || '---';
            
        default:
            return campo.value || '';
    }
}

/**
 * Obtiene una descripción legible del tipo de campo
 * @param {HTMLElement} campo - El campo del que se quiere obtener el tipo
 * @returns {string} - Descripción legible del tipo de campo
 */
function obtenerTipoCampoLegible(campo) {
    if (!campo) return 'Desconocido';
    
    const tipo = campo.type || campo.tagName.toLowerCase();
    
    const tiposLegibles = {
        'text': 'Texto',
        'number': 'Número',
        'date': 'Fecha',
        'time': 'Hora',
        'checkbox': 'Casilla de verificación',
        'radio': 'Opción',
        'select': 'Lista desplegable',
        'select-one': 'Lista desplegable',
        'textarea': 'Área de texto',
        'email': 'Correo electrónico',
        'tel': 'Teléfono',
        'password': 'Contraseña',
        'file': 'Archivo',
        'hidden': 'Oculto'
    };
    
    return tiposLegibles[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

/**
 * Personaliza el placeholder del textarea según el tipo de campo
 * @param {HTMLTextAreaElement} textarea - El textarea a personalizar
 * @param {HTMLElement} campo - El campo asociado
 */
function personalizarPlaceholderSegunTipoCampo(textarea, campo) {
    if (!textarea || !campo) return;
    
    const tipo = campo.type || campo.tagName.toLowerCase();
    const placeholders = {
        'text': 'Ingrese el nuevo texto...',
        'number': 'Ingrese el nuevo número...',
        'date': 'Ingrese la nueva fecha (YYYY-MM-DD)...',
        'time': 'Ingrese la nueva hora (HH:MM)...',
        'checkbox': 'Escriba "Seleccionado" o "No seleccionado"...',
        'radio': 'Escriba "Seleccionado" o "No seleccionado"...',
        'select': 'Escriba una de las opciones disponibles...',
        'select-one': 'Escriba una de las opciones disponibles...',
        'textarea': 'Ingrese el nuevo texto...',
        'email': 'Ingrese el nuevo correo electrónico...',
        'tel': 'Ingrese el nuevo número de teléfono...'
    };
    
    textarea.placeholder = placeholders[tipo] || 'Ingrese el nuevo valor...';
}

    // =============================================
    // 11. EXPONER FUNCIONES GLOBALMENTE
    // =============================================
    
    // Exponer la función para obtener observaciones y campos seleccionados
    window.obtenerObservacionesYCampos = function() {
        return {
            observaciones: observacionesPorCampo,
            camposSeleccionados: camposSeleccionados
        };
    };
    
    // =============================================
    // 12. INICIALIZACIÓN FINAL
    // =============================================
    
    // Inicia la funcionalidad principal
    hacerCamposSeleccionables();
    
    console.log('Script de campos seleccionables inicializado correctamente');
});
