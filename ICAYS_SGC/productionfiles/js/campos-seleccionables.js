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
    const observacionesModalGeneral = document.getElementById('observacionesModalGeneral');
    const modalRevision = document.getElementById('modalRevision');
    
    // Textarea donde se escriben las observaciones
    const observacionesText = document.getElementById('observacionesText');
    
    // Botón para guardar las observaciones
    const guardarObservacionesBtn = document.getElementById('guardarObservaciones');
    
    // Botón para quitar las observaciones
    const quitarObservacionesBtn = document.getElementById('quitarObservaciones');
    
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

    // Añadir estado de observación
    const ESTADOS = {
        INICIAL: 'inicial',        // Primera observación
        CORREGIDO: 'corregido',   // Usuario corrigió el campo
        REVISION: 'revision',      // En revisión por jefe
        ACEPTADO: 'aceptado',     // Jefe aceptó la corrección
        RECHAZADO: 'rechazado',   // Jefe rechazó la corrección
        APROBADO: 'aprobado'      // Campo aprobado
    };

    // Verificar si el usuario es jefe de laboratorio
    let esJefeLaboratorio = document.getElementById('es_jefe_laboratorio')?.value === 'true';

    // Agregar estilos CSS
    agregarEstilosCSS();
    
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
            'textarea:not(#observacionesText):not(#observacionesGeneralText)' // Excluye ambos textareas de los modales
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
            
            // Excluye campos dentro del modal de observaciones y modal general
            if (campo.closest('.modalOB') || 
                campo.closest('#observacionesModal') ||
                campo.closest('#observacionesModalGeneral')) {
                console.log('Excluyendo campo de los modales:', campo.id || campo.name);
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
        
        // Procesa cada campo para hacerlo seleccionable
        campos.forEach(campo => {
            // Agrega clase CSS para estilización visual
            campo.classList.add('campo-seleccionable');
            
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
            
            // Asegura que el campo tenga posición relativa para el overlay
            if (getComputedStyle(campo).position === 'static') {
                campo.style.position = 'relative';
            }
            
            // Agrega el overlay como hijo del contenedor del campo
            campo.parentNode.style.position = 'relative';
            campo.parentNode.appendChild(overlay);
            
            // Asocia el overlay con el campo mediante atributo data
            overlay.dataset.targetField = campo.id || campo.name || '';
            
            // =============================================
            // 4. MANEJADOR DE EVENTOS PARA LOS OVERLAYS
            // =============================================
            
            overlay.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const campoAsociado = document.getElementById(this.dataset.targetField) || 
                                     document.getElementsByName(this.dataset.targetField)[0];
                
                if (!campoAsociado) {
                    console.error('No se pudo encontrar el campo asociado al overlay');
                    return;
                }
                
                // Obtener estado actual del campo
                const estadoActual = observacionesPorCampo[campoAsociado.id]?.estado;
                
                // Si el campo está corregido o en estado CORREGIDO, mostrar modal de revisión
                if (verificarCampoCorregido(campoAsociado.id) || estadoActual === ESTADOS.CORREGIDO) {
                    mostrarModalRevision(campoAsociado);
                } else {
                    // Comportamiento normal para campos sin corregir
                    campoSeleccionado = campoAsociado;
                    campoSeleccionadoId = campoAsociado.id || 'campo-sin-id-' + Math.random().toString(36).substr(2, 9);
                    campoSeleccionadoNombre = obtenerNombreDescriptivoCampo(campoAsociado);
                    modoResumen = false;
                    abrirModalObservaciones();
                }
            });
        });
        
        console.log('Campos seleccionables configurados correctamente');
        
        // Cargar datos guardados si existen
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
        if (!modalElement) {
            console.error('No se encontró el modal de observaciones');
            return;
        }

        // Obtener o crear instancia del modal Bootstrap
        let bootstrapModal = bootstrap.Modal.getInstance(modalElement);
        if (!bootstrapModal) {
            bootstrapModal = new bootstrap.Modal(modalElement);
        }

        // Configurar los botones solo si existe el contenedor
        const botonesContainer = document.getElementById('botonesObservaciones');
        if (botonesContainer) {
            botonesContainer.innerHTML = ''; // Limpiar botones existentes

            const estadoActual = observacionesPorCampo[campoSeleccionadoId]?.estado || ESTADOS.INICIAL;
            
            if (esJefeLaboratorio) {
                if (estadoActual === ESTADOS.CORREGIDO) {
                    const btnAceptar = crearBoton('Aceptar', 'success', () => aceptarCorreccion(campoSeleccionadoId));
                    const btnRechazar = crearBoton('Rechazar', 'danger', () => rechazarCorreccion(campoSeleccionadoId));
                    botonesContainer.append(btnAceptar, btnRechazar);
                }
            } else {
                if (estadoActual === ESTADOS.INICIAL || estadoActual === ESTADOS.RECHAZADO) {
                    const btnGuardar = crearBoton('Guardar', 'primary', guardarObservacion);
                    const btnQuitar = crearBoton('Quitar', 'danger', quitarObservacion);
                    botonesContainer.append(btnGuardar, btnQuitar);
                }
            }
        } else {
            console.warn('No se encontró el contenedor de botones');
        }

        // Obtener el modal usando Bootstrap
        const tituloModal = document.getElementById('observacionesTitulo');
        if (tituloModal) {
            if (modoResumen) {
                tituloModal.textContent = 'Resumen de observaciones';
            } else {
                tituloModal.textContent = 'Ingrese sus observaciones';
            }
        }
        
        // Actualiza la información del campo seleccionado
        const campoSeleccionadoInfo = document.getElementById('campoSeleccionadoInfo');
        const campoSeleccionadoNombre = document.getElementById('campoSeleccionadoNombre');
        
        if (campoSeleccionadoInfo && campoSeleccionadoNombre) {
            if (campoSeleccionado && !modoResumen) {
                // Mostrar el nombre del campo seleccionado
                campoSeleccionadoInfo.style.display = 'block';
                
                // Usar el texto del label si está disponible, de lo contrario usar el ID o nombre del campo
                let nombreMostrado = labelText || campoSeleccionado.name || campoSeleccionado.id || 'Campo';
                campoSeleccionadoNombre.textContent = nombreMostrado;
            } else {
                // Ocultar la información del campo si estamos en modo resumen o no hay campo seleccionado
                campoSeleccionadoInfo.style.display = 'none';
            }
        }
        
        // Carga observación existente si hay una para este campo
        if (!modoResumen && observacionesPorCampo[campoSeleccionadoId]) {
            if (typeof observacionesPorCampo[campoSeleccionadoId] === 'object') {
                observacionesText.value = observacionesPorCampo[campoSeleccionadoId].observacion;
            } else {
                // Compatibilidad con formato anterior
                observacionesText.value = observacionesPorCampo[campoSeleccionadoId];
            }
        } else if (!modoResumen) {
            // Ya no necesitamos incluir el nombre del campo en el textarea
            observacionesText.value = '';
        }
        
        // Mostrar el modal usando Bootstrap
        bootstrapModal.show();
        
        // Enfoca el textarea y coloca el cursor al final después de que el modal esté visible
        setTimeout(() => {
            observacionesText.focus();
            observacionesText.setSelectionRange(
                observacionesText.value.length,
                observacionesText.value.length
            );
        }, 500); // Pequeño retraso para asegurar que el modal esté completamente visible
        
        console.log('Modal abierto correctamente');
    }

    function obtenerValorCampo(campo) {
        if (!campo) return '';
        switch (campo.type || campo.tagName.toLowerCase()) {
            case 'checkbox':
            case 'radio':
                return campo.checked ? 'Seleccionado' : 'No seleccionado';
            case 'select':
            case 'select-one':
                return campo.options[campo.selectedIndex]?.text || '';
            case 'date':
            case 'time':
                return campo.value || '---';
            default:
                return campo.value || '';
        }
    }

    function mostrarModalRevision(campo) {
        const modalRevision = document.getElementById('modalRevision');
        if (!modalRevision) return;

        const datosCampo = observacionesPorCampo[campo.id];
        if (!datosCampo) return;

        // Actualizar contenido del modal
        document.getElementById('campoRevisionNombre').textContent = datosCampo.campo_nombre;
        document.getElementById('valorOriginal').textContent = datosCampo.valor_original;
        document.getElementById('valorActual').textContent = obtenerValorCampo(campo);

        // Configurar eventos de los botones
        document.getElementById('btnAceptarCambio').onclick = () => {
            // Marcar como aprobado y quitar clases visuales
            observacionesPorCampo[campo.id].estado = ESTADOS.APROBADO;
            campo.classList.remove('corregido', 'tiene-observacion');
            
            // Guardar en servidor
            fetch('/jdirecto/cambiar-estado-campo-observacion/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    campo_id: campo.id,
                    estado: ESTADOS.APROBADO
                })
            });

            bootstrap.Modal.getInstance(modalRevision).hide();
            mostrarMensaje('Cambio aprobado correctamente');
            actualizarContadorObservaciones();
        };

        document.getElementById('btnRechazarCambio').onclick = () => {
            bootstrap.Modal.getInstance(modalRevision).hide();
            
            // Abrir modal de observaciones para agregar comentario
            campoSeleccionado = campo;
            campoSeleccionadoId = campo.id;
            campoSeleccionadoNombre = datosCampo.campo_nombre;
            modoResumen = false;
            abrirModalObservaciones();
        };

        // Mostrar modal
        const modalInstance = new bootstrap.Modal(modalRevision);
        modalInstance.show();
    }

    async function aceptarCambio(campoId) {
        try {
            // Crear FormData en lugar de JSON
            const formData = new FormData();
            formData.append('campo_id', campoId);
            formData.append('bitacora_id', bitacoraId);
            formData.append('estado', 'aprobado');
            formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

            const response = await fetch('/jdirecto/cambiar-estado-campo-observacion/', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData  // Usar FormData en lugar de JSON.stringify
            });

            const data = await response.json();
            if (data.success) {
                const campo = document.getElementById(campoId);
                campo.classList.remove('corregido', 'tiene-observacion');
                delete observacionesPorCampo[campoId];
                mostrarMensaje('Cambio aprobado correctamente');
                actualizarContadorObservaciones();
            } else {
                throw new Error(data.message || 'Error al aprobar el cambio');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al aprobar el cambio: ' + error.message, true);
        }
    }

    function crearBoton(texto, tipo, onClick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn btn-${tipo} mx-1`;
        btn.textContent = texto;
        btn.onclick = onClick;
        return btn;
    }

    function aceptarCorreccion(campoId) {
        const campo = document.getElementById(campoId);
        if (!campo) return;

        observacionesPorCampo[campoId].estado = ESTADOS.ACEPTADO;
        campo.classList.remove('corregido', 'tiene-observacion');
        
        guardarCampoEnServidor(campoId);
        cerrarModalObservaciones();
        mostrarMensaje('Corrección aceptada correctamente');
    }

    function rechazarCorreccion(campoId) {
        const campo = document.getElementById(campoId);
        if (!campo) return;

        // Preparar datos para el modal de observaciones
        campoSeleccionado = campo;
        campoSeleccionadoId = campoId;
        modoResumen = false;

        // Cerrar modal de revisión
        const modalRevision = document.getElementById('modalRevision');
        if (modalRevision) {
            const modalInstance = bootstrap.Modal.getInstance(modalRevision);
            if (modalInstance) {
                modalInstance.hide();
            }
        }

        // Mostrar modal de observaciones con botones apropiados
        setTimeout(() => {
            const observacionesModal = document.getElementById('observacionesModal');
            if (observacionesModal) {
                // Configurar modal
                const modalInstance = new bootstrap.Modal(observacionesModal);
                
                // Actualizar título y contenido
                const campoNombre = document.getElementById('campoSeleccionadoNombre');
                if (campoNombre) {
                    campoNombre.textContent = observacionesPorCampo[campoId].campo_nombre || 'Campo';
                }

                // Configurar botones
                const botonesContainer = document.getElementById('botonesObservaciones');
                if (botonesContainer) {
                    botonesContainer.innerHTML = '';
                    const btnGuardar = crearBoton('Guardar', 'primary', () => {
                        // Guardar cambios y actualizar estado
                        observacionesPorCampo[campoId].estado = ESTADOS.RECHAZADO;
                        observacionesPorCampo[campoId].observacion = document.getElementById('observacionesText').value;
                        campo.classList.remove('corregido');
                        campo.classList.add('tiene-observacion');
                        
                        // Guardar en servidor
                        fetch('/jdirecto/cambiar-estado-campo-observacion/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': getCookie('csrftoken')
                            },
                            body: JSON.stringify({
                                campo_id: campoId,
                                estado: 'rechazado'
                            })
                        });
                        
                        modalInstance.hide();
                        mostrarMensaje('Observación guardada correctamente');
                    });
                    botonesContainer.appendChild(btnGuardar);
                }

                // Mostrar modal
                modalInstance.show();
            }
        }, 500);
    }
    
    /**
     * Cierra el modal de observaciones y limpia la selección
     */
    function cerrarModalObservaciones() {
        console.log('Cerrando modal de observaciones...');
        const modalElement = document.getElementById('observacionesModal');
        if (modalElement) {
            const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
            if (bootstrapModal) {
                bootstrapModal.hide();
                campoSeleccionado = null;
                modoResumen = false;
                console.log('Modal cerrado correctamente');
            }
        }
    }
    
    // =============================================
    // 6. FUNCIONES PARA GUARDAR OBSERVACIONES
    // =============================================
    
    /**
     * Guarda la observación para el campo seleccionado actualmente
     * y actualiza la interfaz de usuario inmediatamente
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
        
        // Obtiene el valor actual del campo seleccionado
        let valorActual = '';
        
        // Determinar el tipo de campo y obtener su valor
        if (campoSeleccionado.type === 'checkbox' || campoSeleccionado.type === 'radio') {
            valorActual = campoSeleccionado.checked ? 'Seleccionado' : 'No seleccionado';
        } else if (campoSeleccionado.tagName.toLowerCase() === 'select') {
            const opcionSeleccionada = campoSeleccionado.options[campoSeleccionado.selectedIndex];
            valorActual = opcionSeleccionada ? opcionSeleccionada.text : '';
        } else {
            valorActual = campoSeleccionado.value || '';
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
        
        // Guarda la observación y el valor actual para este campo en memoria
        observacionesPorCampo[campoSeleccionadoId] = {
            ...observacionesPorCampo[campoSeleccionadoId],
            observacion: observacionesText.value,
            valor_original: valorActual,
            campo_nombre: nombreCampo,
            campo_tipo: campoSeleccionado.type || campoSeleccionado.tagName.toLowerCase(),
            estado: ESTADOS.CORREGIDO // Marcar como corregido al guardar
        };
        
        // IMPORTANTE: Siempre marcar como no corregido (rojo) cuando se guarda una nueva observación
        // Esto es lo que asegura que el campo cambie inmediatamente de verde a rojo
        campoSeleccionado.classList.remove('corregido');
        campoSeleccionado.classList.add('tiene-observacion');
        
        // Agrega el campo a la lista de campos seleccionados si no está ya
        if (!camposSeleccionados.includes(campoSeleccionadoId)) {
            camposSeleccionados.push(campoSeleccionadoId);
            console.log('Campo agregado a la lista de seleccionados:', campoSeleccionadoId);
        }
        
        // Actualiza el contador de observaciones
        actualizarContadorObservaciones();
        
        // Cierra el modal y muestra mensaje de éxito
        cerrarModalObservaciones();
        mostrarMensaje('Observación guardada correctamente');
        
        // Guardar este campo específico en el servidor
        guardarCampoEnServidor(campoSeleccionadoId);
        
        console.log('Observación guardada para campo:', campoSeleccionadoId, 'con valor actual:', valorActual);
    }
    
    // =============================================
    // 7. FUNCIONES PARA GUARDAR, CARGAR Y ELIMINAR DATOS
    // =============================================
    
    /**
     * Quita la observación del campo seleccionado actualmente
     * Elimina la marca visual y la observación de la base de datos
     */
    function quitarObservacion() {
        console.log('Quitando observación...');
        
        // Verificar si hay un campo seleccionado
        if (!campoSeleccionado || !campoSeleccionadoId) {
            console.error('No hay campo seleccionado para quitar observación');
            mostrarMensaje('Error: No hay campo seleccionado', true);
            cerrarModalObservaciones();
            return;
        }
        
        // Eliminar la observación del objeto en memoria
        if (observacionesPorCampo[campoSeleccionadoId]) {
            delete observacionesPorCampo[campoSeleccionadoId];
            
            // Eliminar el campo de la lista de seleccionados
            const index = camposSeleccionados.indexOf(campoSeleccionadoId);
            if (index > -1) {
                camposSeleccionados.splice(index, 1);
            }
            
            console.log('Observación eliminada de la memoria para campo:', campoSeleccionadoId);
        }
        
        // Quitar las clases visuales del campo
        campoSeleccionado.classList.remove('tiene-observacion');
        campoSeleccionado.classList.remove('corregido');
        
        // Actualizar el contador de observaciones
        actualizarContadorObservaciones();
        
        // Eliminar la observación de la base de datos
        eliminarObservacionEnServidor(campoSeleccionadoId);
        
        // Cerrar el modal y mostrar mensaje de éxito
        cerrarModalObservaciones();
        mostrarMensaje('Observación eliminada correctamente');
    }
    
    /**
     * Elimina una observación del servidor
     * @param {string} campoId - ID del campo cuya observación se eliminará
     */
    function eliminarObservacionEnServidor(campoId) {
        if (!bitacoraId) {
            console.error('No se pudo obtener el ID de la bitácora');
            mostrarMensaje('Error: No se pudo obtener el ID de la bitácora', true);
            return;
        }
        
        if (!campoId) {
            console.error('No se especificó un ID de campo');
            mostrarMensaje('Error: No se especificó un ID de campo', true);
            return;
        }
        
        console.log('Eliminando observación del servidor para campo:', campoId);
        
        // Crear objeto con los datos necesarios para identificar la observación
        const datos = {
            bitacora_id: bitacoraId,
            campo_id: campoId,
            csrfmiddlewaretoken: getCookie('csrftoken')
        };
        
        // Mostrar indicador de carga
        mostrarMensaje('Eliminando observación...', false);
        
        // Enviar solicitud al servidor mediante AJAX
        $.ajax({
            url: '/jdirecto/eliminar_campo_observacion/',
            type: 'POST',
            data: datos,
            dataType: 'json',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(response) {
                console.log('Observación eliminada correctamente del servidor:', response);
                mostrarMensaje('Observación eliminada correctamente', false);
            },
            error: function(xhr, status, error) {
                console.error('Error al eliminar observación:', error);
                try {
                    const respuesta = xhr.responseText ? JSON.parse(xhr.responseText) : {};
                    console.error('Respuesta del servidor:', respuesta);
                    mostrarMensaje('Error al eliminar observación: ' + (respuesta.message || error), true);
                } catch (e) {
                    console.error('Respuesta del servidor:', xhr.responseText);
                    mostrarMensaje('Error al eliminar observación: ' + error, true);
                }
            }
        });
    }
    
    /**
     * Guarda un campo específico en el servidor
     * @param {string} campoId - ID del campo a guardar
     */
    function guardarCampoEnServidor(campoId) {
        if (!bitacoraId) {
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
        
        // Crear objeto con los datos a guardar
        const datos = {
            bitacora_id: bitacoraId,
            campo_id: campoId,
            campo_nombre: datosCampo.campo_nombre || 'Campo sin nombre',
            valor_original: datosCampo.valor_original || '',
            campo_tipo: datosCampo.campo_tipo || 'desconocido',
            observacion: datosCampo.observacion || '',
            estado: datosCampo.estado || ESTADOS.INICIAL,
            csrfmiddlewaretoken: getCookie('csrftoken')
        };
        
        // Mostrar indicador de carga
        mostrarMensaje('Guardando campo...', false);
        
        // Enviar datos al servidor mediante AJAX
        $.ajax({
            url: '/jdirecto/guardar_campos_observaciones/',  // Usamos la URL existente
            type: 'POST',
            data: datos,
            dataType: 'json',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(response) {
                console.log('Campo guardado correctamente:', response);
                mostrarMensaje('Campo guardado correctamente', false);
            },
            error: function(xhr, status, error) {
                console.error('Error al guardar campo:', error);
                try {
                    const respuesta = xhr.responseText ? JSON.parse(xhr.responseText) : {};
                    console.error('Respuesta del servidor:', respuesta);
                    mostrarMensaje('Error al guardar campo: ' + (respuesta.message || error), true);
                } catch (e) {
                    console.error('Respuesta del servidor:', xhr.responseText);
                    mostrarMensaje('Error al guardar campo: ' + error, true);
                }
            }
        });
    }
    
    
    /**
     * Carga los datos guardados previamente desde el servidor
     * Obtiene las observaciones y campos seleccionados directamente de la tabla ObservacionCampo
     */
    /**
 * Modificar la función cargarDatosGuardados para verificar campos corregidos después de cargar
 */
function cargarDatosGuardados() {
    if (!bitacoraId) {
        console.error('No se pudo obtener el ID de la bitácora');
        return;
    }
    
    console.log('Cargando datos guardados para bitácora ID:', bitacoraId);
    
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    $.ajax({
        url: `/jdirecto/obtener_campos_observaciones/${bitacoraId}/`,
        type: 'GET',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        success: function(response) {
            console.log('Respuesta del servidor:', response);
            
            if (response.success) {
                observacionesPorCampo = {};
                camposSeleccionados = [];
                
                if (response.observaciones_individuales && response.observaciones_individuales.length > 0) {
                    console.log(`Cargando ${response.observaciones_individuales.length} observaciones desde la BD`);
                    
                    response.observaciones_individuales.forEach(obs => {
                        observacionesPorCampo[obs.campo_id] = {
                            observacion: obs.observacion || '',
                            valor_original: obs.valor_original || '',
                            campo_nombre: obs.campo_nombre || 'Campo sin nombre',
                            campo_tipo: obs.campo_tipo || 'desconocido',
                            estado: obs.estado || ESTADOS.INICIAL
                        };
                        
                        if (!camposSeleccionados.includes(obs.campo_id)) {
                            camposSeleccionados.push(obs.campo_id);
                        }
                        
                        const campo = document.getElementById(obs.campo_id);
                        if (campo) {
                            // No aplicamos clase aquí, lo haremos después de verificar
                            console.log(`Campo encontrado: ${obs.campo_id}`);
                        } else {
                            console.warn(`No se encontró el elemento con ID: ${obs.campo_id}`);
                            
                            const camposPorNombre = document.getElementsByName(obs.campo_id);
                            if (camposPorNombre.length > 0) {
                                console.log(`Campo encontrado por nombre: ${obs.campo_id}`);
                            }
                        }
                    });
                    
                    console.log('Observaciones individuales cargadas:', observacionesPorCampo);
                    console.log('Campos seleccionados cargados:', camposSeleccionados);
                    
                    // Después de cargar, verificar si algún campo ya ha sido corregido
                    setTimeout(verificarCamposCorregidos, 500);
                } else {
                    console.log('No se encontraron observaciones individuales para esta bitácora');
                }
                
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
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    });
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
     * Muestra un resumen de todas las observaciones en el modal general
     * Incluye información sobre campos corregidos
     */
    function mostrarResumenObservaciones() {
        let todasLasObservaciones = "RESUMEN DE OBSERVACIONES:\n\n";
        
        // Agrega la observación general si existe
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
        
        // Agrega las observaciones por campo (excluyendo aprobados)
        let contador = 1;
        for (const [campoId, datos] of Object.entries(observacionesPorCampo)) {
            // Solo procesar si no es observación general y no está aprobado
            if (campoId !== 'observacion_general' && datos.estado !== ESTADOS.APROBADO) {
                totalCampos++;
                const campo = document.getElementById(campoId);
                let nombreCampo = campoId;
                let estadoCorreccion = "⚠️ No corregido";
                
                if (verificarCampoCorregido(campoId)) {
                    estadoCorreccion = "✅ Corregido";
                    camposCorregidos++;
                }
                
                if (typeof datos === 'object') {
                    nombreCampo = datos.campo_nombre || campoId;
                    let valorActual = obtenerValorCampo(campo) || "No disponible";
                    
                    todasLasObservaciones += `${contador}. Campo: "${nombreCampo}" - ${estadoCorreccion}\n`;
                    todasLasObservaciones += `   Valor original: ${datos.valor_original || ''}\n`;
                    todasLasObservaciones += `   Valor actual: ${valorActual}\n`;
                    todasLasObservaciones += `   Observación: ${datos.observacion || ''}\n\n`;
                    
                    contador++;
                }
            }
        }
        
        // Mensaje si no hay observaciones
        if (totalCampos === 0 && !observacionesPorCampo['observacion_general']) {
            todasLasObservaciones += "No hay observaciones específicas registradas.\n";
        } else if (totalCampos > 0) {
            // Agregar resumen estadístico
            todasLasObservaciones += "RESUMEN ESTADÍSTICO:\n";
            todasLasObservaciones += `Total de campos con observaciones: ${totalCampos}\n`;
            todasLasObservaciones += `Campos corregidos: ${camposCorregidos} (${Math.round(camposCorregidos/totalCampos*100)}%)\n`;
            todasLasObservaciones += `Campos pendientes: ${totalCampos - camposCorregidos} (${Math.round((totalCampos-camposCorregidos)/totalCampos*100)}%)\n`;
        }
        
        // Encuentra el textarea dentro del modal general
        const textareaGeneral = document.getElementById('observacionesGeneralText');
        if (textareaGeneral) {
            textareaGeneral.value = todasLasObservaciones;
        }
        
        // Mostrar el modal general
        const modalGeneral = document.getElementById('observacionesModalGeneral');
        if (modalGeneral) {
            const bootstrapModal = new bootstrap.Modal(modalGeneral);
            bootstrapModal.show();
        }
    }
    
    /**
     * Actualiza el contador de observaciones en el botón de retroalimentación
     * Considera la estructura de datos donde observacionesPorCampo contiene objetos
     * y los datos provienen de la base de datos
     */
    function actualizarContadorObservaciones() {
        const observacionesBtn = document.getElementById('observacionesBtn');
        if (!observacionesBtn) {
            console.warn('No se encontró el botón de retroalimentación para actualizar el contador');
            return;
        }
        
        // Filtra las claves excluyendo observación general y campos aprobados
        const camposConObservacion = Object.keys(observacionesPorCampo).filter(key => {
            return key !== 'observacion_general' && 
                   observacionesPorCampo[key].estado !== 'aprobado';
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
    
    // Configurar eventos para los botones de cierre del modal (incluye la X y cualquier botón con data-bs-dismiss="modal")
    const closeButtons = document.querySelectorAll('#observacionesModal .btn-close, #observacionesModal [data-bs-dismiss="modal"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            cerrarModalObservaciones();
        });
    });
    console.log('Eventos de cierre del modal configurados');
    
    // Evento para el botón de guardar observaciones
    if (guardarObservacionesBtn) {
        guardarObservacionesBtn.addEventListener('click', function() {
            guardarObservacion();
        });
        console.log('Evento de guardar observaciones configurado');
    } else {
        console.error('No se encontró el botón de guardar observaciones');
    }
    
    // Evento para el botón de quitar observaciones
    if (quitarObservacionesBtn) {
        quitarObservacionesBtn.addEventListener('click', function() {
            quitarObservacion();
        });
        console.log('Evento de quitar observaciones configurado');
    } else {
        console.error('No se encontró el botón de quitar observaciones');
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
                    url: `/jdirecto/obtener_campos_observaciones/${bitacoraId}/`,
                    type: 'GET',
                    dataType: 'json',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    success: function(response) {
                        if (response.success) {
                            // Cargar observaciones individuales desde la tabla ObservacionCampo
                            if (response.observaciones_individuales && response.observaciones_individuales.length > 0) {
                                console.log(`Cargando ${response.observaciones_individuales.length} observaciones desde la BD`);
                                
                                // Limpiar datos actuales
                                observacionesPorCampo = {};
                                camposSeleccionados = [];
                                
                                response.observaciones_individuales.forEach(obs => {
                                    observacionesPorCampo[obs.campo_id] = {
                                        observacion: obs.observacion || '',
                                        valor_original: obs.valor_original || '',
                                        campo_nombre: obs.campo_nombre || 'Campo sin nombre',
                                        campo_tipo: obs.campo_tipo || 'desconocido',
                                        estado: obs.estado || ESTADOS.INICIAL
                                    };
                                    
                                    if (!camposSeleccionados.includes(obs.campo_id)) {
                                        camposSeleccionados.push(obs.campo_id);
                                    }
                                });
                                
                                // Ahora que tenemos las observaciones, mostrar el resumen
                                mostrarResumenObservaciones();
                            } else {
                                // No hay observaciones, mostrar mensaje en el modal general
                                const textareaGeneral = observacionesModalGeneral.querySelector('textarea');
                                if (textareaGeneral) {
                                    textareaGeneral.value = "No hay observaciones registradas para esta bitácora.";
                                }
                                
                                // Mostrar el modal general
                                let bootstrapModalGeneral = bootstrap.Modal.getInstance(observacionesModalGeneral);
                                if (!bootstrapModalGeneral) {
                                    bootstrapModalGeneral = new bootstrap.Modal(observacionesModalGeneral);
                                }
                                bootstrapModalGeneral.show();
                            }
                        } else {
                            console.warn('No se pudieron cargar los datos:', response.message);
                            mostrarMensaje('No se pudieron cargar los datos: ' + response.message, true);
                            
                            // Mostrar mensaje de error en el modal general
                            const textareaGeneral = observacionesModalGeneral.querySelector('textarea');
                            if (textareaGeneral) {
                                textareaGeneral.value = "Error al cargar las observaciones: " + response.message;
                            }
                            
                            let bootstrapModalGeneral = bootstrap.Modal.getInstance(observacionesModalGeneral);
                            if (!bootstrapModalGeneral) {
                                bootstrapModalGeneral = new bootstrap.Modal(observacionesModalGeneral);
                            }
                            bootstrapModalGeneral.show();
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('Error al cargar datos:', error);
                        mostrarMensaje('Error al cargar datos: ' + error, true);
                        
                        // Mostrar mensaje de error en el modal general
                        const textareaGeneral = observacionesModalGeneral.querySelector('textarea');
                        if (textareaGeneral) {
                            textareaGeneral.value = "Error al cargar las observaciones: " + error;
                        }
                        
                        let bootstrapModalGeneral = bootstrap.Modal.getInstance(observacionesModalGeneral);
                        if (!bootstrapModalGeneral) {
                            bootstrapModalGeneral = new bootstrap.Modal(observacionesModalGeneral);
                        }
                        bootstrapModalGeneral.show();
                    },
                    complete: function() {
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
 * Función para verificar si un campo ha sido corregido comparando con el valor original en BD
 * @param {string} campoId - ID del campo a verificar
 * @returns {boolean} - true si el campo ha sido corregido, false en caso contrario
 */
function verificarCampoCorregido(campoId) {
    // Si no tenemos registro de este campo en las observaciones, no podemos verificar
    if (!observacionesPorCampo[campoId]) {
        return false;
    }
    
    // Obtener el valor original almacenado en la BD
    const valorOriginalBD = observacionesPorCampo[campoId].valor_original || '';
    
    // Obtener el campo actual del DOM
    const campo = document.getElementById(campoId);
    if (!campo) {
        console.warn(`No se encontró el elemento con ID: ${campoId}`);
        return false;
    }
    
    // Obtener el valor actual del campo
    let valorActual = '';
    if (campo.type === 'checkbox' || campo.type === 'radio') {
        valorActual = campo.checked ? 'Seleccionado' : 'No seleccionado';
    } else if (campo.tagName.toLowerCase() === 'select') {
        const opcionSeleccionada = campo.options[campo.selectedIndex];
        valorActual = opcionSeleccionada ? opcionSeleccionada.text : '';
    } else {
        valorActual = campo.value || '';
    }
    
    // Comparar el valor actual con el valor original
    const fueCorregido = valorActual !== valorOriginalBD;
    
    console.log(`Verificando campo ${campoId}:`, {
        valorOriginalBD,
        valorActual,
        fueCorregido
    });
    
    return fueCorregido;
}

/**
 * Función para verificar todos los campos con observaciones y marcarlos como corregidos si aplica
 */
function verificarCamposCorregidos() {
    console.log('Verificando campos corregidos...');
    
    for (const campoId of camposSeleccionados) {
        if (campoId === 'observacion_general') continue;
        
        const campo = document.getElementById(campoId);
        if (!campo) {
            const camposPorNombre = document.getElementsByName(campoId);
            if (camposPorNombre.length > 0) {
                verificarYAplicarClase(camposPorNombre[0], campoId);
            }
            continue;
        }
        
        verificarYAplicarClase(campo, campoId);
    }
}

function verificarYAplicarClase(campo, campoId) {
    const estadoActual = observacionesPorCampo[campoId]?.estado;
    const valorOriginal = observacionesPorCampo[campoId]?.valor_original || '';
    const valorActual = obtenerValorCampo(campo);

    if (estadoActual === ESTADOS.APROBADO) {
        // Si está aprobado, quitar todas las clases
        campo.classList.remove('corregido', 'tiene-observacion');
    } else if (valorActual === valorOriginal) {
        // Si el valor es igual al original -> rojo (no corregido)
        campo.classList.remove('corregido');
        campo.classList.add('tiene-observacion');
    } else {
        // Si el valor es diferente al original -> verde (corregido)
        campo.classList.add('corregido');
        campo.classList.remove('tiene-observacion');
    }
}

/**
 * Obtiene un nombre descriptivo para un campo
 * @param {HTMLElement} campo - Elemento del campo
 * @returns {string} - Nombre descriptivo del campo
 */
function obtenerNombreDescriptivoCampo(campo) {
    if (!campo) return 'Campo Desconocido';
    
    // Primero intentar obtener el texto del label asociado
    if (campo.id) {
        const label = document.querySelector(`label[for="${campo.id}"]`);
        if (label && label.textContent.trim()) {
            return label.textContent.trim();
        }
    }
    
    // Si no hay label, usar el nombre o id del campo
    return campo.name || campo.id || 'Campo sin Identificador';
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
    // Cargar datos guardados al inicio
    cargarDatosGuardados();
    
    // Agregar estilos CSS para campos corregidos
    agregarEstilosCSS();
    
    // Verificar campos corregidos al cargar
    verificarCamposCorregidos();
    
    // Mostrar mensaje de carga inicial
    mostrarMensaje('Cargando datos...', false);
    
    console.log('Inicialización completa');
});
