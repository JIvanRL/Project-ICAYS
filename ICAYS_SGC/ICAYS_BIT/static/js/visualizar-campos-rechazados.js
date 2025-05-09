/**
status * Script para visualizar campos rechazados, permitir correcciones y guardar observaciones.
 *
 * Funcionalidad principal:
 * 1. Carga observaciones existentes desde el servidor.
 * 2. Crea overlays interactivos sobre los campos con observaciones.
 * 3. Permite al usuario hacer clic en un campo (overlay) para abrir un modal.
 * 4. En el modal, el usuario puede ver la observación original y editar el valor del campo.
 * 5. Guarda el valor editado y la información asociada (historial) en el servidor.
 * 6. Actualiza visualmente el campo en el formulario (color de fondo/borde).
 * 7. Proporciona un resumen de todas las observaciones.
 */

(function () {
    'use strict'; // Habilita el modo estricto

    // --------------------------------------------
    // 1. CONSTANTES Y REFERENCIAS AL DOM
    // ---------------------------------------------
    const observacionesModalElement = document.getElementById('observacionesModal');
    const observacionesModalGeneralElement = document.getElementById('observacionesModalGeneral');
    const observacionesTextElement = document.getElementById('observacionesText');
    const observacionesTextGeneralElement = document.getElementById('observacionesTextGeneral');
    const guardarObservacionesBtn = document.getElementById('guardarObservaciones');
    const guardarObservacionesGeneralBtn = document.getElementById('guardarObservacionesGeneral');
    const btnResumenObservaciones = document.getElementById('btnResumenObservaciones');
    const bitacoraId = document.getElementById('bitacora_id')?.value;
    const usuarioId = document.getElementById('usuario_id_actual')?.value || '0'; // Cambiar de usuario_id a usuario_id_actual
    const usuarioNombre = document.getElementById('usuario_nombre')?.value || 'Usuario'; // Nombre del usuario
    const CAMPOS_CON_PERMISO_ESPECIAL = ['resultado_r', 'ufC_placa_r', 'diferencia_r']; // Prefijos de campos que requieren permiso

    // Instancias de Modales Bootstrap (se inicializan cuando se necesitan)
    let observacionesModalInstance = null;
    let observacionesModalGeneralInstance = null;
   

    // =============================================
    // 2. VARIABLES DE ESTADO
    // =============================================
    let campoSeleccionado = null;
    let campoSeleccionadoId = null;
    let observacionesPorCampo = {}; // { campoId: { observacion, valor_original, valor_actual, campo_nombre, campo_tipo, historial_ediciones, contador_ediciones, estado }, ... }
    let mapaCamposFormulario = {}; // Almacena referencias a los campos del formulario { campoId: elemento }
     // Variable global para almacenar estados de autorización
     let estadosAutorizacion = {};

    // =============================================
    // 3. FUNCIONES AUXILIARES
    // =============================================

    /**
     * Muestra un mensaje temporal al usuario.
     * @param {string} mensaje - Texto a mostrar.
     * @param {boolean} esError - Indica si es un mensaje de error.
     * @param {number} duracion - Duración en milisegundos.
     */
    function mostrarMensaje(mensaje, esError = false, duracion = 3000) {
        console.log(`Mensaje (${esError ? 'Error' : 'Info'}): ${mensaje}`);
        let mensajeDiv = document.querySelector('.mensaje-flotante');
        if (mensajeDiv) {
            mensajeDiv.remove();
        }

        mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje-flotante ${esError ? 'mensaje-error' : ''}`;
        mensajeDiv.textContent = mensaje;
        document.body.appendChild(mensajeDiv);

        setTimeout(() => {
            mensajeDiv.classList.add('desaparecer');
            setTimeout(() => {
                if (mensajeDiv.parentNode) { // Verificar si aún existe antes de remover
                    mensajeDiv.remove();
                }
            }, 500); // Tiempo para la animación de desaparición
        }, duracion);
    }

    /**
     * Realiza una petición AJAX genérica.
     * Asume que getCookie está disponible globalmente.
     * @param {string} url - URL del endpoint.
     * @param {string} method - Método HTTP (GET, POST, etc.).
     * @param {object} [config] - Configuración adicional (datos, params, etc.).
     * @returns {Promise<object>} - Promesa que resuelve con la respuesta JSON.
     */
    function ajaxRequest(url, method = 'GET', config = {}) {
        return new Promise((resolve, reject) => {
            // Manejar query params si existen
            if (config.params) {
                const queryParams = new URLSearchParams(config.params).toString();
                url = `${url}?${queryParams}`;
            }

            const headers = {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            };

            // Si es FormData, no establecer Content-Type
            // Si no es FormData, establecer application/json
            if (config.data && !(config.data instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
            }

            const ajaxConfig = {
                url: url.startsWith('/') ? url : '/' + url,
                type: method,
                headers: headers,
                success: (response) => {
                    console.log('Respuesta exitosa:', response);
                    resolve(response);
                },
                error: (xhr, status, error) => {
                    console.error('Error detallado:', {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText,
                        error: error
                    });

                    let errorMessage;
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        errorMessage = errorData.message || errorData.error || 'Error del servidor';
                    } catch (e) {
                        errorMessage = `Error ${xhr.status}: ${xhr.statusText || error}`;
                    }

                    reject(new Error(errorMessage));
                }
            };

            // Manejar los datos según el tipo
            if (config.data) {
                if (config.data instanceof FormData) {
                    ajaxConfig.processData = false;
                    ajaxConfig.contentType = false;
                    ajaxConfig.data = config.data;
                } else {
                    ajaxConfig.data = JSON.stringify(config.data);
                }
            }

            // Log de depuración
            console.log('Configuración de la petición:', {
                url: ajaxConfig.url,
                method: ajaxConfig.type,
                headers: ajaxConfig.headers,
                data: config.data instanceof FormData ? 
                    Object.fromEntries(config.data.entries()) : 
                    config.data
            });

            $.ajax(ajaxConfig);
        });
    }

    /**
     * Obtiene el valor de un campo según su tipo.
     * @param {HTMLElement} campo - El campo.
     * @returns {string} - El valor formateado.
     */
    function obtenerValorCampo(campo) {
        if (!campo) return '';
        switch (campo.type || campo.tagName.toLowerCase()) {
            case 'checkbox': return campo.checked ? 'Seleccionado' : 'No seleccionado';
            case 'radio': return campo.checked ? 'Seleccionado' : 'No seleccionado';
            case 'select':
            case 'select-one': return campo.options[campo.selectedIndex]?.text || '';
            case 'date':
            case 'time': return campo.value || '---';
            default: return campo.value || '';
        }
    }

    /**
     * Obtiene una descripción legible del tipo de campo.
     * @param {HTMLElement} campo - El campo.
     * @returns {string} - Descripción legible.
     */
    function obtenerTipoCampoLegible(campo) {
        if (!campo) return 'Desconocido';
        const tipo = campo.type || campo.tagName.toLowerCase();
        const tiposLegibles = {
            'text': 'Texto', 'number': 'Número', 'date': 'Fecha', 'time': 'Hora',
            'checkbox': 'Casilla', 'radio': 'Opción', 'select': 'Lista',
            'select-one': 'Lista', 'textarea': 'Área de texto', 'email': 'Correo',
            'tel': 'Teléfono', 'password': 'Contraseña', 'file': 'Archivo', 'hidden': 'Oculto'
        };
        return tiposLegibles[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
    }

    /**
     * Personaliza el placeholder del textarea de edición.
     * @param {HTMLTextAreaElement} textarea - El textarea.
     * @param {HTMLElement} campo - El campo asociado.
     */
    function personalizarPlaceholderSegunTipoCampo(textarea, campo) {
        if (!textarea || !campo) return;
        const tipo = campo.type || campo.tagName.toLowerCase();
        const placeholders = {
            'text': 'Ingrese el nuevo texto...', 'number': 'Ingrese el nuevo número...',
            'date': 'Ingrese la nueva fecha (YYYY-MM-DD)...', 'time': 'Ingrese la nueva hora (HH:MM)...',
            'checkbox': 'Escriba "Seleccionado" o "No seleccionado"...',
            'radio': 'Escriba "Seleccionado" o "No seleccionado"...',
            'select': 'Escriba una de las opciones disponibles...',
            'select-one': 'Escriba una de las opciones disponibles...',
            'textarea': 'Ingrese el nuevo texto...', 'email': 'Ingrese el nuevo correo...',
            'tel': 'Ingrese el nuevo teléfono...'
        };
        textarea.placeholder = placeholders[tipo] || 'Ingrese el nuevo valor...';
    }

    /**
     * Verifica si un campo está corregido (valor actual diferente al original).
     * @param {string} campoId - ID del campo.
     * @returns {boolean} - True si está corregido.
     */
    function verificarCampoCorregido(campoId) {
        const datos = observacionesPorCampo[campoId];
        if (!datos) return false;
        const valorOriginal = (datos.valor_original || '').trim();
        const valorActual = (datos.valor_actual || valorOriginal).trim(); // Si valor_actual es nulo, usa el original
        return valorActual !== valorOriginal;
    }

    /**
     * Obtiene el nombre descriptivo del campo (Label > Name > ID).
     * @param {HTMLElement} campo - El elemento del campo.
     * @returns {string} - El nombre descriptivo.
     */
    function obtenerNombreDescriptivoCampo(campo) {
        if (!campo) return 'Campo Desconocido';
        if (campo.id) {
            const label = document.querySelector(`label[for="${campo.id}"]`);
            if (label && label.textContent.trim()) {
                return label.textContent.trim();
            }
        }
        return campo.name || campo.id || 'Campo sin Identificador';
    }

    /**
     * Verifica si el usuario tiene permiso para editar un campo específico.
     * @param {string} campoId - ID del campo a verificar.
     * @returns {boolean} - True si el usuario tiene permiso.
     */
    function tienePermisoEdicion(campoId) {
        // Verificar si el campo requiere permiso especial
        const requierePermiso = CAMPOS_CON_PERMISO_ESPECIAL.some(prefijo => campoId.startsWith(prefijo));
        if (!requierePermiso) return true; // No requiere permiso, editable

        // Verificar si el usuario tiene el rol necesario (ejemplo: 'admin', 'editor')
        const rolUsuario = document.getElementById('rol_usuario')?.value || 'normal';
        return ['admin', 'editor'].includes(rolUsuario); // Ajustar roles según necesidad
    }

    /**
     * Deshabilita o habilita los campos de una fila de la tabla.
     * @param {HTMLElement} fila - La fila de la tabla a modificar.
     * @param {boolean} [deshabilitar=true] - Indica si se deben deshabilitar o habilitar los campos.
     */
    function toggleFilaEdicion(fila, deshabilitar = true) {
        const inputs = fila.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.readOnly = deshabilitar;
            input.disabled = deshabilitar; // Para selects y otros elementos
            input.classList.toggle('form-control-plaintext', deshabilitar); // Estilo visual
        });
    }

    // =============================================
    // 4. FUNCIONES DE MANEJO DE DATOS (CARGA/GUARDADO)
    // =============================================

    /**
     * Carga los datos guardados (observaciones y correcciones) desde el servidor.
     */
    async function cargarDatosGuardados() {
        if (!bitacoraId) {
            console.error('No se pudo obtener el ID de la bitácora para cargar datos.');
            return;
        }
        console.log('Cargando datos guardados para bitácora ID:', bitacoraId);
        mostrarMensaje('Cargando observaciones...', false, 5000);

        try {
            const response = await ajaxRequest(`/microbiologia/obtener_campos_observaciones/${bitacoraId}/`, 'GET');
            console.log('Datos recibidos del servidor:', response);
            if (response.success) {
                procesarDatosCargados(response.observaciones_individuales || []);
                mostrarMensaje('Observaciones cargadas.', false);
            } else {
                console.warn('No se pudieron cargar los datos:', response.message);
                mostrarMensaje('Advertencia: ' + (response.message || 'No se encontraron observaciones.'), true);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
            mostrarMensaje(error.message || 'Error al cargar datos.', true);
        } finally {
            actualizarContadorObservaciones();
        }
    }

    async function cargarEstadosAutorizacion() {
        try {
            if (!bitacoraId) {
                console.error('No se pudo obtener el ID de la bitácora para cargar estados de autorización.');
                return;
            }
            
            console.log('Cargando estados de autorización para bitácora ID:', bitacoraId);
            
            const formData = new FormData();
            formData.append('bitacora_id', bitacoraId);
            formData.append('action', 'obtener_todos');
            
            const response = await ajaxRequest(
                '/microbiologia/api/verificar-autorizacion/',
                'POST',
                { data: formData }
            );
            
            if (response.success && response.solicitudes) {
                console.log('Estados de autorización recibidos:', response.solicitudes);
                
                // Procesar cada solicitud y aplicar el estado visual
                response.solicitudes.forEach(solicitud => {
                    const campoId = solicitud.campo_id;
                    const estado = solicitud.estado;
                    const campo = mapaCamposFormulario[campoId];
                    
                    if (campo && estado) {
                        // Guardar en el objeto global de estados
                        estadosAutorizacion[campoId] = estado;
                        
                        // Aplicar estilo visual según el estado
                        actualizarEstadoAutorizacion(campo, campoId, estado);
                    }
                });
                // Después de procesar todas las solicitudes, desbloquear filas autorizadas
                import('./events-bita131.js').then(module => {
                    module.desbloquearFilasAutorizadas();
                });
            } else {
                console.log('No se encontraron estados de autorización o hubo un error:', response.message);
            }
        } catch (error) {
            console.error('Error al cargar estados de autorización:', error);
        }
    }
    /**
     * Procesa los datos cargados del servidor, actualiza el estado y crea overlays.
     * @param {Array} observaciones - Array de objetos de observación desde el backend.
     */
    function procesarDatosCargados(observaciones) {
        observacionesPorCampo = {}; // Limpiar estado previo

        observaciones.forEach(obs => {
            const campoId = obs.campo_id;

            // Almacenar datos en el estado local
            observacionesPorCampo[campoId] = {
                observacion: obs.observacion || '',
                valor_original: obs.valor_original || '',
                valor_actual: obs.valor_actual || obs.valor_original || '',
                campo_nombre: obs.campo_nombre || 'Campo sin nombre',
                campo_tipo: obs.campo_tipo || 'desconocido',
                historial_ediciones: obs.historial_ediciones || [],
                contador_ediciones: obs.contador_ediciones || 0,
                estado: obs.estado || 'pendiente'
            };

            // Si no es la observación general y no está aprobado, procesar el campo
            if (campoId !== 'observacion_general' && obs.estado !== 'aprobado') {
                const campo = mapaCamposFormulario[campoId];
                if (campo) {
                    // Actualizar estilo visual basado únicamente en el estado
                    switch (obs.estado) {
                        case 'editado':
                            campo.style.backgroundColor = '#e8f5e9'; // Verde claro
                            campo.classList.remove('tiene-observacion');
                            campo.classList.add('corregido');
                            campo.style.pointerEvents = 'auto'; // Permitir interacción
                            break;
                        case 'pendiente':
                            campo.style.backgroundColor = '#ffebee'; // Rojo claro
                            campo.classList.add('tiene-observacion');
                            campo.classList.remove('corregido');
                            campo.style.pointerEvents = 'auto'; // Permitir interacción
                            break;
                        case 'rechazado':
                            campo.style.backgroundColor = '#ffebee'; // Rojo claro
                            campo.classList.add('tiene-observacion');
                            campo.classList.remove('corregido');
                            campo.style.pointerEvents = 'auto'; // Permitir interacción
                            break;
                        default:
                            // No mostrar overlay ni estilos especiales para otros estados
                            campo.style.backgroundColor = 'transparent';
                            campo.classList.remove('tiene-observacion', 'corregido');
                            campo.style.pointerEvents = 'none'; // Deshabilitar interacción
                            return; // No crear overlay
                    }

                    crearOverlayParaCampo(campo, campoId);
                    actualizarCampoVisualmente(
                        campo, 
                        observacionesPorCampo[campoId].valor_actual,
                        obs.estado === 'editado'
                    );
                }
            }
        });

        console.log('Estado de observacionesPorCampo actualizado:', observacionesPorCampo);
    }

    async function guardarCampoEnServidor(campoIdAGuardar) {
        // Validaciones iniciales con logs detallados
        console.log('Iniciando guardado de campo:', {
            bitacoraId,
            campoIdAGuardar,
            datosCampo: observacionesPorCampo[campoIdAGuardar]
        });

        if (!bitacoraId) {
            console.error('Error: Falta ID de bitácora', { bitacoraId });
            mostrarMensaje('Error: Falta ID de bitácora.', true);
            return;
        }

        if (!campoIdAGuardar) {
            console.error('Error: Falta ID de campo', { campoIdAGuardar });
            mostrarMensaje('Error: Falta ID de campo.', true);
            return;
        }

        const datosCampo = observacionesPorCampo[campoIdAGuardar];
        if (!datosCampo) {
            console.error('Error: No hay datos para el campo', { campoIdAGuardar });
            mostrarMensaje('Error: Datos locales no encontrados.', true);
            return;
        }

        const formData = new FormData();
        formData.append('bitacora_id', bitacoraId);
        formData.append('campo_id', campoIdAGuardar);
        formData.append('campo_nombre', datosCampo.campo_nombre || 'Campo sin nombre');
        formData.append('valor_original', datosCampo.valor_original || '');
        formData.append('valor_actual', datosCampo.valor_actual || datosCampo.valor_original || '');
        formData.append('campo_tipo', datosCampo.campo_tipo || 'desconocido');
        formData.append('observacion', datosCampo.observacion || '');
        formData.append('editado_por', usuarioNombre);
        formData.append('historial_ediciones', JSON.stringify(datosCampo.historial_ediciones || []));
        formData.append('contador_ediciones', datosCampo.contador_ediciones || 0);

        try {
            const response = await ajaxRequest(
                '/microbiologia/guardar_campos_corregidos/',
                'POST',
                { data: formData }
            );

            console.log('Respuesta del servidor:', response);
            
            if (response.success) {
                mostrarMensaje('Campo guardado correctamente.', false);
                // Actualizar estado local si el servidor devuelve datos actualizados
                if (response.historial) {
                    observacionesPorCampo[campoIdAGuardar].historial_ediciones = response.historial;
                    observacionesPorCampo[campoIdAGuardar].contador_ediciones = response.contador || 0;
                }
                return true;
            } else {
                throw new Error(response.message || 'Error al guardar el campo');
            }
        } catch (error) {
            console.error('Error detallado al guardar:', error);
            mostrarMensaje(error.message || 'Error al guardar el campo.', true);
            throw error;
        }
    }

    async function enviarSolicitudAutorizacion(supervisorId) {
        try {
            if (!campoSeleccionado || !campoSeleccionadoId) {
                throw new Error('No hay campo seleccionado');
            }

            // Primero verificar si ya existe una solicitud
            const verificacion = await verificarSolicitudExistente(campoSeleccionadoId);
            
            if (verificacion.exists) {
                if (verificacion.estado === 'aprobada') {
                    mostrarModalAutorizacionAprobada(verificacion.data);
                    actualizarEstadoAutorizacion(campoSeleccionado, campoSeleccionadoId, 'aprobada');
                    return { success: true, message: 'Este campo ya fue aprobado previamente.' };
                } else if (verificacion.estado === 'pendiente') {
                    mostrarModalPendiente(verificacion.data);
                    actualizarEstadoAutorizacion(campoSeleccionado, campoSeleccionadoId, 'pendiente');

                    return { success: false, message: 'Solicitud pendiente' };
                } 
            } 

            // Si no existe solicitud, crear una nueva
            const formData = new FormData();
            formData.append('bitacora_id', bitacoraId);
            formData.append('campo_id', campoSeleccionadoId);
            formData.append('solicitante_id', usuarioId);
            formData.append('supervisor_id', supervisorId);
            formData.append('estado', 'pendiente');
            formData.append('valor_actual', obtenerValorCampo(campoSeleccionado));
            formData.append('campo_nombre', obtenerNombreDescriptivoCampo(campoSeleccionado));
            
            // Se elimina el parámetro 'solicitud_anterior' que estaba causando el error

            const response = await ajaxRequest(
                '/microbiologia/api/solicitar-autorizacion/',
                'POST',
                { data: formData }
            );

            if (response.success) {
                mostrarMensaje('Solicitud enviada correctamente', false);
                actualizarEstadoAutorizacion(campoSeleccionado, campoSeleccionadoId, 'pendiente');
                return response;
            } else {
                throw new Error(response.message || 'Error al procesar la solicitud');
            }

        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            mostrarMensaje('Error: ' + error.message, true);
            throw error;
        }
    }

    async function verificarSolicitudExistente(campoId) {
        try {
            const formData = new FormData();
            formData.append('campo_id', campoId);
            formData.append('bitacora_id', bitacoraId);
            formData.append('action', 'verificar');

            const response = await ajaxRequest(
                '/microbiologia/api/verificar-autorizacion/',
                'POST',
                { data: formData }
            );

            // Convert response dates if they exist
            if (response.data) {
                if (response.data.fecha_solicitud) {
                    response.data.fecha_solicitud = new Date(response.data.fecha_solicitud);
                }
            }

            return {
                exists: response.exists,
                estado: response.estado,
                data: response.data
            };
        } catch (error) {
            console.error('Error al verificar solicitud:', error);
            return { exists: false };
        }
    }

    async function MostrarModalAutorizacion(campoId) {
        try {
            if (!campoId) {
                throw new Error('No se proporcionó ID del campo');
            }

            const verificacion = await verificarSolicitudExistente(campoId);
            console.log('Respuesta de verificación:', verificacion);

            if (verificacion.exists) {
                if (verificacion.estado === 'aprobada') {
                    mostrarModalAutorizacionAprobada(verificacion.data);
                } else if (verificacion.estado === 'pendiente') {
                    mostrarModalPendiente(verificacion.data);
                }else if (verificacion.estado === 'rechazada') {
                    mostrarModalRechazado(verificacion.data);
                }
                 else {
                    mostrarModalPermiso();
                }
            } else {
                mostrarModalPermiso();
            }
        } catch (error) {
            console.error('Error al verificar autorización:', error);
            mostrarMensaje('Error al verificar estado de autorización: ' + error.message, true);
        }
    }
    function mostrarModalPendiente(datos) {
        const modalHTML = `
            <div class="modal fade" id="modalAutorizacionPendiente" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0">
                        <div class="modal-header bg-warning text-white border-0">
                            <h5 class="modal-title">
                                <i class="fas fa-clock me-2"></i>
                                Estado Pendiente
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <i class="fas fa-hourglass-half fa-4x text-warning mb-3"></i>
                            <h4 class="fw-bold">Este campo está en estado pendiente de autorización</h4>
                        </div>
                        <div class="modal-footer border-0 justify-content-center">
                            <button type="button" class="btn btn-warning text-white px-4" data-bs-dismiss="modal">
                                <i class="fas fa-check me-2"></i>Entendido
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .bg-warning {
                    background-color: #ff9800 !important;
                }
                .btn-warning {
                    background-color: #ff9800;
                    border-color: #ff9800;
                }
                .modal-content {
                    box-shadow: 0 5px 15px rgba(255, 152, 0, 0.3);
                }
            </style>
        `;

        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalAutorizacionPendiente');
        if (modalAnterior) modalAnterior.remove();

        // Agregar nuevo modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar el modal
        const modalElement = document.getElementById('modalAutorizacionPendiente');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }   
    function mostrarModalRechazado(datos) {
        
        const modalHTML = `
            <div class="modal fade" id="modalAutorizacionRechazada" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0">
                        <!-- Cabecera -->
                        <div class="modal-header bg-danger text-white border-0">
                            <h5 class="modal-title">
                                <i class="fas fa-times-circle me-2"></i>
                                Solicitud Rechazada
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        
                        <!-- Cuerpo -->
                        <div class="modal-body text-center py-4">
                            <i class="fas fa-ban fa-4x text-danger mb-3"></i>
                            <h4 class="fw-bold">Este campo fue rechazado</h4>
                            <p class="text-muted mt-2">No puedes modificarlo sin nueva autorización</p>
                        </div>
                        
                        <!-- Pie de modal unificado -->
                        <div class="modal-footer border-0 d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3">
                            <button type="button" class="btn btn-danger text-white px-4" data-bs-dismiss="modal">
                                <i class="fas fa-check me-2"></i>Entendido
                            </button>
                            <button type="button" class="btn btn-primary text-white px-4" id="btnSolicitarAutorizacion" data-bs-dismiss="modal">
                                <i class="fas fa-paper-plane me-2"></i>Nueva solicitud
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        <style>
            .bg-danger {
                background-color: #dc3545 !important;
            }
            .btn-danger {
                background-color: #dc3545;
                border-color: #dc3545;
            }
            .modal-content {
                box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
            }
        </style>
        `;

        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalAutorizacionRechazada');
        if (modalAnterior) modalAnterior.remove();

        // Agregar nuevo modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar el modal
        const modalElement = document.getElementById('modalAutorizacionRechazada');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Agregar evento al botón de nueva solicitud
        const btnSolicitarAutorizacion = document.getElementById('btnSolicitarAutorizacion');
        if (btnSolicitarAutorizacion) {
            btnSolicitarAutorizacion.addEventListener('click', async () => {
                mostrarModalPermiso();
                

            });
        }
    }   

    function mostrarModalAutorizacionAprobada(datos) {
        const modalHTML = `
            <div class="modal fade" id="modalAutorizacionAprobada" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content border-0">
                        <!-- Header con gradiente verde -->
                        <div class="modal-header text-white" style="background: linear-gradient(135deg, #28a745, #218838);">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-check-circle fa-2x me-3"></i>
                                <div>
                                    <h5 class="modal-title mb-0 fw-bold">AUTORIZACIÓN APROBADA</h5>
                                    <small class="opacity-80">Cambio validado correctamente</small>
                                </div>
                            </div>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>

                        <!-- Cuerpo del modal (sin cambios) -->
                        <div class="modal-body p-4">
                            <div class="row">
                                <div class="col-md-4 text-center border-end d-flex align-items-center justify-content-center">
                                    <div class="p-4">
                                        <div class="bg-success bg-opacity-10 rounded-circle p-4 d-inline-block">
                                            <i class="fas fa-shield-alt fa-4x text-success"></i>
                                        </div>
                                        <h4 class="text-success mt-3 fw-bold">Validado</h4>
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <div class="row g-3">
                                        <div class="col-6">
                                            <div class="p-3 bg-light rounded">
                                                <small class="text-muted d-block">CAMPO</small>
                                                <span class="fw-bold">${datos.campo_nombre || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="p-3 bg-light rounded">
                                                <small class="text-muted d-block">VALOR</small>
                                                <span class="fw-bold">${datos.valor_actual || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="p-3 bg-light rounded">
                                                <small class="text-muted d-block">AUTORIZADO POR</small>
                                                <span class="fw-bold">${datos.supervisor_nombre || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="p-3 bg-light rounded">
                                                <small class="text-muted d-block">FECHA APROBACIÓN</small>
                                                <span class="fw-bold">${datos.fecha_aprobacion ? new Date(datos.fecha_aprobacion).toLocaleString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                        ${datos.comentario ? `
                                        <div class="col-12">
                                            <div class="p-3 bg-light rounded">
                                                <small class="text-muted d-block">COMENTARIO</small>
                                                <span class="fst-italic">${datos.comentario}</span>
                                            </div>
                                        </div>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer modificado -->
                        <div class="modal-footer border-0 d-flex justify-content-center">
                            <button type="button" class="btn btn-success px-3 py-1" style="min-width: 120px;" id="btnConfirmar" data-bs-dismiss="modal">
                                <i class="fas fa-thumbs-up me-1"></i> Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        <style>
            /* Efecto hover para los items de datos */
            .bg-light:hover {
                background-color: #f8f9fa!important;
                transform: translateY(-2px);
                transition: all 0.3s ease;
            }
            
            /* Sombra suave para el modal */
            .modal-content {
                box-shadow: 0 10px 25px rgba(40, 167, 69, 0.2);
                border-radius: 10px!important;
            }
            
            /* Estilo para el botón de cierre */
            .btn-close {
                opacity: 0.8;
                transition: all 0.3s;
            }
            .btn-close:hover {
                opacity: 1;
                transform: rotate(90deg);
            }
        </style>
        `;

        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalAutorizacionAprobada');
        if (modalAnterior) modalAnterior.remove();

        // Agregar nuevo modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar el modal
        const modalElement = document.getElementById('modalAutorizacionAprobada');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

       // Agregar evento al botón de nueva solicitud
       const btnConfirmar = document.getElementById('btnConfirmar');
       if (btnConfirmar) {
                btnConfirmar.addEventListener('click', async () => {
                // Aquí puedes agregar la lógica para proceder con la modificación
                // Por ejemplo, mostrar el modal de confirmación de datos sensibles
                mostrarModalConfirmacionDatosSensibles(datos);
           });
       }
    }

    function mostrarModalConfirmacionDatosSensibles(datos) {
        const modalHTML = `
            <div class="modal fade" id="modalConfirmacionDatosSensibles" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0">
                        <!-- Header con color de advertencia -->
                        <div class="modal-header bg-warning text-dark">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-exclamation-triangle fa-2x me-3"></i>
                                <div>
                                    <h5 class="modal-title mb-0 fw-bold">ADVERTENCIA: DATOS SENSIBLES</h5>
                                    <small class="opacity-80">Confirmación requerida</small>
                                </div>
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
    
                        <!-- Cuerpo del modal -->
                        <div class="modal-body p-4">
                            <div class="alert alert-warning">
                                <p><strong>¡Atención!</strong> Está a punto de modificar datos sensibles que pueden afectar los resultados del análisis.</p>
                                <p>Esta acción quedará registrada en el sistema con su nombre de usuario y fecha.</p>
                            </div>
                            
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="confirmacionResponsabilidad">
                                <label class="form-check-label" for="confirmacionResponsabilidad">
                                    Entiendo la responsabilidad de modificar estos datos y confirmo que es necesario para el correcto análisis de la muestra.
                                </label>
                            </div>
                        </div>
    
                        <!-- Footer -->
                        <div class="modal-footer border-0 d-flex justify-content-between">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i> Cancelar
                            </button>
                            <button type="button" class="btn btn-warning" id="btnProcederModificacion" disabled>
                                <i class="fas fa-check me-1"></i> Proceder con la modificación
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    
        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalConfirmacionDatosSensibles');
        if (modalAnterior) modalAnterior.remove();
    
        // Agregar nuevo modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar el modal
        const modalElement = document.getElementById('modalConfirmacionDatosSensibles');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Obtener referencias a los elementos
        const confirmacionCheckbox = document.getElementById('confirmacionResponsabilidad');
        const btnProceder = document.getElementById('btnProcederModificacion');
        
        // Función para validar el formulario
        function validarFormulario() {
            const checkboxMarcado = confirmacionCheckbox.checked;
            btnProceder.disabled = !checkboxMarcado;
        }
        
        // Agregar eventos para validación en tiempo real
        confirmacionCheckbox.addEventListener('change', validarFormulario);
        
        // Agregar evento al botón de proceder
        if (btnProceder) {
            btnProceder.addEventListener('click', function() {
                // Cerrar el modal
                modal.hide();
                
                // Cerrar también el modal original si sigue abierto
                const modalOriginal = document.getElementById('modalAutorizacionAprobada');
                if (modalOriginal) {
                    const bsModalOriginal = bootstrap.Modal.getInstance(modalOriginal);
                    if (bsModalOriginal) bsModalOriginal.hide();
                }
                
                // Mostrar mensaje de éxito
                mostrarMensaje('Modificación autorizada correctamente', false);
                
                // Determinar el índice de la fila a partir del campo_id
                let filaIndex = 0; // Por defecto, mostrar la primera fila
                
                // Si tenemos datos del campo y su ID contiene un número de fila
                if (datos && datos.campo_id) {
                    // Intentar extraer el número de la fila del ID del campo
                    const match = datos.campo_id.match(/(\d+)$/);
                    if (match && match[1]) {
                        // Restar 1 porque los índices en JavaScript comienzan en 0
                        // pero los IDs en tu HTML comienzan en 1
                        filaIndex = parseInt(match[1]) - 1;
                        
                        // Validar que el índice sea válido (0, 1 o 2)
                        if (filaIndex < 0 || filaIndex > 2) {
                            filaIndex = 0; // Si está fuera de rango, usar la primera fila
                        }
                    }
                }
                
                console.log('Mostrando modal para la fila con índice:', filaIndex);
                
                // Mostrar el modal de filas con el índice correcto
                mostrarModalFilaSeleccionada(filaIndex);
            });
        }
    }
    

    /**
 * Muestra un modal con los datos de una fila específica de la tabla.
 * @param {number} filaIndex - Índice de la fila a mostrar (0-based).
 */
/**
 * Muestra un modal con los datos de una fila específica de la tabla.
 * @param {number} filaIndex - Índice de la fila a mostrar (0-based).
 */
function mostrarModalFilaSeleccionada(filaIndex) {
    // Verificar que el índice sea válido
    if (filaIndex === undefined || filaIndex < 0) {
        console.error('Índice de fila inválido:', filaIndex);
        mostrarMensaje('Error: No se pudo identificar la fila seleccionada.', true);
        return;
    }
    
    console.log('Mostrando modal para la fila:', filaIndex);
    
    // Crear el HTML del modal (igual que antes)
    const modalHTML = `
        <!-- Modal para mostrar todos los campos de la tabla -->
        <div class="modal fade" id="modalCamposTabla" tabindex="-1" aria-labelledby="modalCamposTablaLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="modalCamposTablaLabel">
                <i class="fas fa-table me-2"></i>Tabla de Resultados - Fila ${filaIndex + 1}
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-0">
                <div class="table-responsive">
                <table class="table table-bordered table-striped mb-0">
                    <thead class="table-light">
                        <tr>
                            <th rowspan="2">Clave Muestra</th>
                            <th rowspan="2">Matriz</th>
                            <th rowspan="2">Cantidad de muestra</th>
                            <th colspan="4">Diluciones empleadas</th>
                            <th colspan="2">Dilución o Directa</th>
                            <th rowspan="2">Promedio</th>
                            <th colspan="2">Dilución</th>
                            <th rowspan="2">Promedio</th>
                            <th colspan="2">Dilución</th>
                            <th rowspan="2">Promedio</th>
                            <th colspan="2">Resultado</th>
                            <th rowspan="2">Diferencia entre duplicados <5%</th>
                        </tr>
                        <tr>
                            <!-- Subencabezados para diluciones empleadas -->
                            <th>1</th>
                            <th>0.1</th>
                            <th>0.01</th>
                            <th>0.001</th>
                            <!-- Subencabezados para Dilución o Directa -->
                            <th>Placa 1</th>
                            <th>Placa 2</th>
                            <!-- Subencabezados para Dilución (columnas 5 y 6) -->
                            <th>Placa 1</th>
                            <th>Placa 2</th>
                            <!-- Subencabezados para Dilución (columnas 8 y 9) -->
                            <th>Placa 1</th>
                            <th>Placa 2</th>
                            <!-- Subencabezados para Resultado -->
                            <th>Resultado</th>
                            <th>UFC/placa</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Fila de Blanco -->
                        <tr>
                            <td><input type="text" value="Blanco" style="width: 110px;" readonly></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" style="width: 110px;" readonly></td>
                            <td><input type="text" id="cantidad_blanco_modal" name="cantidad_blanco"></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                            <td><input type="text" id="placa_blanco_modal" name="placa_blanco"></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                            <td><input type="text" id="resultado_blanco_modal" name="resultado_blanco"></td>
                            <td style="background:#c3ccd6;"><input type="text" value="UFC/placa" style="width: 150px;" readonly></td>
                            <td style="background:#c3ccd6;"><input type="text" value="---" readonly></td>
                        </tr>
                        
                        <!-- Fila de datos -->
                        <tr>
                            <!-- Datos de ClaveMuestra -->
                            <td><input type="text" name="clave_c_m_${filaIndex}" id="clave_c_m_modal"></td>
                            <td>
                                <select class="form-select form-select-sm medicion-select" name="medicion_c_m_${filaIndex}" id="medicion_c_m_modal">
                                    <option value="">Seleccione...</option>
                                    <option value="Aguas">Aguas</option>
                                    <option value="Alimentos">Alimentos</option>
                                    <option value="Blancos">Blancos</option>
                                    <option value="Inertes">Inertes</option>
                                    <option value="Vivas">Vivas</option>
                                </select>
                            </td>
                            <td><input type="text" name="cantidad_c_m_${filaIndex}" id="cantidad_c_m_modal"></td>
                            
                            <!-- Diluciones empleadas -->
                            <td>
                                <input type="checkbox" name="dE_1_${filaIndex}" id="dE_1_modal" value="1">
                            </td>
                            <td>
                                <input type="checkbox" name="dE_2_${filaIndex}" id="dE_2_modal" value="0.1">
                            </td>
                            <td>
                                <input type="checkbox" name="dE_3_${filaIndex}" id="dE_3_modal" value="0.01">
                            </td>
                            <td>
                                <input type="checkbox" name="dE_4_${filaIndex}" id="dE_4_modal" value="0.001">
                            </td>
                            
                            <!-- Dilución directa -->
                            <td><input type="text" name="placa_dD_${filaIndex}" class="placa1" id="placa_dD_modal"></td>
                            <td><input type="text" name="placa_dD2_${filaIndex}" class="placa2" id="placa_dD2_modal"></td>
                            <td><input type="text" name="promedio_dD_${filaIndex}" class="promedio" id="promedio_dD_modal"></td>
                            
                            <!-- Dilución -->
                            <td><input type="text" name="placa_d_${filaIndex}" class="placa3" id="placa_d_modal"></td>
                            <td><input type="text" name="placa_d2_${filaIndex}" class="placa4" id="placa_d2_modal"></td>
                            <td><input type="text" name="promedio_d_${filaIndex}" class="promedio2" id="promedio_d_modal"></td>
                            <td><input type="text" name="placa_d_2_${filaIndex}" class="placa5" id="placa_d_2_modal"></td>
                            <td><input type="text" name="placa_d2_2_${filaIndex}" class="placa6" id="placa_d2_2_modal"></td>
                            <td><input type="text" name="promedio_d_2_${filaIndex}" class="promedio3" id="promedio_d_2_modal"></td>
                            
                            <!-- Resultado -->
                            <td><input type="text" name="resultado_r_${filaIndex}" id="resultado_r_modal"></td>
                            <td><input type="text" name="ufC_placa_r_${filaIndex}" id="ufC_placa_r_modal"></td>
                            <td><input type="text" name="diferencia_r_${filaIndex}" id="diferencia_r_modal"></td>
                        </tr>
                    </tbody>
                </table>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" id="btnGuardarCambiosModal">
                    <i class="fas fa-save me-1"></i>Guardar Cambios
                </button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
            </div>
        </div>
        </div>
    `;

    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modalCamposTabla');
    if (modalAnterior) modalAnterior.remove();

    // Agregar nuevo modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar el modal
    const modalElement = document.getElementById('modalCamposTabla');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Cargar los datos de la fila seleccionada en el modal
    cargarDatosFilaEnModal(filaIndex);
    
    // Configurar evento para guardar cambios
    document.getElementById('btnGuardarCambiosModal').addEventListener('click', function() {
        guardarCambiosDesdeModal(filaIndex);
        modal.hide();
    });
}

/**
 * Carga los datos de una fila específica en el modal.
 * @param {number} filaIndex - Índice de la fila a cargar.
 */
function cargarDatosFilaEnModal(filaIndex) {
    // Obtener la fila real (contador basado en 1)
    const contador = filaIndex + 1;
    
    // Lista de campos a cargar
    const campos = [
        { original: `clave_c_m_${contador}`, modal: 'clave_c_m_modal' },
        { original: `medicion_c_m_${contador}`, modal: 'medicion_c_m_modal' },
        { original: `cantidad_c_m_${contador}`, modal: 'cantidad_c_m_modal' },
        { original: `placa_dD_${contador}`, modal: 'placa_dD_modal' },
        { original: `placa_dD2_${contador}`, modal: 'placa_dD2_modal' },
        { original: `promedio_dD_${contador}`, modal: 'promedio_dD_modal' },
        { original: `placa_d_${contador}`, modal: 'placa_d_modal' },
        { original: `placa_d2_${contador}`, modal: 'placa_d2_modal' },
        { original: `promedio_d_${contador}`, modal: 'promedio_d_modal' },
        { original: `placa_d_2_${contador}`, modal: 'placa_d_2_modal' },
        { original: `placa_d2_2_${contador}`, modal: 'placa_d2_2_modal' },
        { original: `promedio_d_2_${contador}`, modal: 'promedio_d_2_modal' },
        { original: `resultado_r_${contador}`, modal: 'resultado_r_modal' },
        { original: `ufC_placa_r_${contador}`, modal: 'ufC_placa_r_modal' },
        { original: `diferencia_r_${contador}`, modal: 'diferencia_r_modal' }
    ];
    
    // Cargar valores de los campos
    campos.forEach(campo => {
        const elementoOriginal = document.getElementById(campo.original);
        const elementoModal = document.getElementById(campo.modal);
        
        if (elementoOriginal && elementoModal) {
            // Si es un select, seleccionar la opción correcta
            if (elementoOriginal.tagName === 'SELECT') {
                elementoModal.value = elementoOriginal.value;
            } else {
                // Para inputs normales, copiar el valor
                elementoModal.value = elementoOriginal.value;
            }
            
            console.log(`Cargando ${campo.original} -> ${campo.modal}: ${elementoOriginal.value}`);
        } else {
            console.warn(`No se encontró el elemento ${campo.original} o ${campo.modal}`);
        }
    });
    
    // Cargar estado de los checkboxes de diluciones
    for (let i = 1; i <= 4; i++) {
        const checkboxOriginal = document.getElementById(`dE_${i}_${contador}`);
        const checkboxModal = document.getElementById(`dE_${i}_modal`);
        
        if (checkboxOriginal && checkboxModal) {
            checkboxModal.checked = checkboxOriginal.checked;
            console.log(`Checkbox dE_${i}_${contador}: ${checkboxOriginal.checked}`);
        }
    }
    
    // Cargar datos del blanco
    const cantidadBlancoOriginal = document.getElementById('cantidad_blanco');
    const placaBlancoOriginal = document.getElementById('placa_blanco');
    const resultadoBlancoOriginal = document.getElementById('resultado_blanco');
    
    const cantidadBlancoModal = document.getElementById('cantidad_blanco_modal');
    const placaBlancoModal = document.getElementById('placa_blanco_modal');
    const resultadoBlancoModal = document.getElementById('resultado_blanco_modal');
    
    if (cantidadBlancoOriginal && cantidadBlancoModal) {
        cantidadBlancoModal.value = cantidadBlancoOriginal.value;
    }
    
    if (placaBlancoOriginal && placaBlancoModal) {
        placaBlancoModal.value = placaBlancoOriginal.value;
    }
    
    if (resultadoBlancoOriginal && resultadoBlancoModal) {
        resultadoBlancoModal.value = resultadoBlancoOriginal.value;
    }
}

/**
 * Guarda los cambios realizados en el modal de vuelta a la tabla original.
 * @param {number} filaIndex - Índice de la fila a actualizar.
 */
function guardarCambiosDesdeModal(filaIndex) {
    // Obtener la fila real (contador basado en 1)
    const contador = filaIndex + 1;
    
    // Lista de campos a guardar
    const campos = [
        { original: `clave_c_m_${contador}`, modal: 'clave_c_m_modal' },
        { original: `medicion_c_m_${contador}`, modal: 'medicion_c_m_modal' },
        { original: `cantidad_c_m_${contador}`, modal: 'cantidad_c_m_modal' },
        { original: `placa_dD_${contador}`, modal: 'placa_dD_modal' },
        { original: `placa_dD2_${contador}`, modal: 'placa_dD2_modal' },
        { original: `promedio_dD_${contador}`, modal: 'promedio_dD_modal' },
        { original: `placa_d_${contador}`, modal: 'placa_d_modal' },
        { original: `placa_d2_${contador}`, modal: 'placa_d2_modal' },
        { original: `promedio_d_${contador}`, modal: 'promedio_d_modal' },
        { original: `placa_d_2_${contador}`, modal: 'placa_d_2_modal' },
        { original: `placa_d2_2_${contador}`, modal: 'placa_d2_2_modal' },
        { original: `promedio_d_2_${contador}`, modal: 'promedio_d_2_modal' },
        { original: `resultado_r_${contador}`, modal: 'resultado_r_modal' },
        { original: `ufC_placa_r_${contador}`, modal: 'ufC_placa_r_modal' },
        { original: `diferencia_r_${contador}`, modal: 'diferencia_r_modal' }
    ];
    
    // Guardar valores de los campos
    campos.forEach(campo => {
        const elementoOriginal = document.getElementById(campo.original);
        const elementoModal = document.getElementById(campo.modal);
        
        if (elementoOriginal && elementoModal) {
            // Guardar valor anterior para comparar
            const valorAnterior = elementoOriginal.value;
            
            // Si es un select, seleccionar la opción correcta
            if (elementoOriginal.tagName === 'SELECT') {
                elementoOriginal.value = elementoModal.value;
            } else {
                // Para inputs normales, copiar el valor
                elementoOriginal.value = elementoModal.value;
            }
            
            console.log(`Guardando ${campo.modal} -> ${campo.original}: ${elementoModal.value}`);
            
            // Disparar evento de cambio para activar cualquier listener
            const event = new Event('change', { bubbles: true });
            elementoOriginal.dispatchEvent(event);
            
            // Verificar si el valor cambió y actualizar el estado visual
            if (valorAnterior !== elementoOriginal.value) {
                // Actualizar el estado visual del campo
                if (observacionesPorCampo[campo.original]) {
                    observacionesPorCampo[campo.original].valor_actual = elementoOriginal.value;
                    observacionesPorCampo[campo.original].estado = 'editado';
                    
                    // Actualizar visualmente el campo
                    actualizarCampoVisualmente(elementoOriginal, elementoOriginal.value, true);
                    
                    // Recrear el overlay para reflejar el nuevo estado
                    crearOverlayParaCampo(elementoOriginal, campo.original);
                }
            }
        }
    });
    
    // Guardar estado de los checkboxes de diluciones
    for (let i = 1; i <= 4; i++) {
        const checkboxOriginal = document.getElementById(`dE_${i}_${contador}`);
        const checkboxModal = document.getElementById(`dE_${i}_modal`);
        
        if (checkboxOriginal && checkboxModal) {
            const estadoAnterior = checkboxOriginal.checked;
            checkboxOriginal.checked = checkboxModal.checked;
            
            // Disparar evento de cambio
            const event = new Event('change', { bubbles: true });
            checkboxOriginal.dispatchEvent(event);
            
            // Actualizar visualmente si cambió
            if (estadoAnterior !== checkboxOriginal.checked) {
                const campoId = checkboxOriginal.id;
                if (observacionesPorCampo[campoId]) {
                    observacionesPorCampo[campoId].valor_actual = checkboxOriginal.checked ? 'Seleccionado' : 'No seleccionado';
                    observacionesPorCampo[campoId].estado = 'editado';
                    
                    // Actualizar visualmente
                    actualizarCampoVisualmente(checkboxOriginal, observacionesPorCampo[campoId].valor_actual, true);
                    crearOverlayParaCampo(checkboxOriginal, campoId);
                }
            }
        }
    }
    
    // Guardar datos del blanco
    const cantidadBlancoOriginal = document.getElementById('cantidad_blanco');
    const placaBlancoOriginal = document.getElementById('placa_blanco');
    const resultadoBlancoOriginal = document.getElementById('resultado_blanco');
    
    const cantidadBlancoModal = document.getElementById('cantidad_blanco_modal');
    const placaBlancoModal = document.getElementById('placa_blanco_modal');
    const resultadoBlancoModal = document.getElementById('resultado_blanco_modal');
    
    // Función auxiliar para actualizar campos del blanco
    function actualizarCampoBlanco(original, modal, campoId) {
        if (original && modal) {
            const valorAnterior = original.value;
            original.value = modal.value;
            original.dispatchEvent(new Event('change', { bubbles: true }));
            
            if (valorAnterior !== original.value) {
                if (observacionesPorCampo[campoId]) {
                    observacionesPorCampo[campoId].valor_actual = original.value;
                    observacionesPorCampo[campoId].estado = 'editado';
                    
                    // Actualizar visualmente
                    actualizarCampoVisualmente(original, original.value, true);
                    crearOverlayParaCampo(original, campoId);
                }
            }
        }
    }
    
    actualizarCampoBlanco(cantidadBlancoOriginal, cantidadBlancoModal, 'cantidad_blanco');
    actualizarCampoBlanco(placaBlancoOriginal, placaBlancoModal, 'placa_blanco');
    actualizarCampoBlanco(resultadoBlancoOriginal, resultadoBlancoModal, 'resultado_blanco');
    
    // Guardar cambios en el servidor para cada campo modificado
    campos.forEach(campo => {
        const campoId = campo.original;
        if (observacionesPorCampo[campoId] && observacionesPorCampo[campoId].estado === 'editado') {
            guardarCampoEnServidor(campoId).catch(error => {
                console.error(`Error al guardar campo ${campoId}:`, error);
            });
        }
    });
    
    // Actualizar contador de observaciones
    if (typeof actualizarContadorObservaciones === 'function') {
        actualizarContadorObservaciones();
    }
    
    // Mostrar mensaje de éxito
    mostrarMensaje('Cambios guardados correctamente', false);
}

    function mostrarModalPermiso() {
        console.log('Mostrando modal de permiso:', {
            campoSeleccionado: campoSeleccionado,
            campoSeleccionadoId: campoSeleccionadoId
        });

        if (!campoSeleccionado || !campoSeleccionadoId) {
            console.error('No hay campo seleccionado para solicitar permiso', {
                campo: campoSeleccionado,
                id: campoSeleccionadoId
            });
            mostrarMensaje('Error: No se pudo identificar el campo', true);
            return;
        }

        const modalHTML = `
        <input type="hidden" id="usuario_id" value="{{ request.user.id_user }}">
            <div class="modal fade" id="modalPermiso" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h5 class="modal-title">
                                <i class="fas fa-lock me-2"></i>
                                Campo Protegido
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <i class="fas fa-shield-alt fa-3x text-warning mb-3"></i>
                                <h6 class="fw-bold">Solicitud de Autorización</h6>
                            </div>
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Este campo requiere autorización para ser modificado.
                            </div>
                            
                            <!-- Selector de supervisor -->
                            <div class="form-group mb-3">
                                <label for="supervisor_id" class="form-label">Seleccionar Supervisor:</label>
                                <select id="supervisor_id" class="form-select" required>
                                    <option value="">Seleccione un supervisor...</option>
                                </select>
                            </div>

                            <input type="hidden" id="modal_campo_id" value="${campoSeleccionadoId}">
                            <div class="d-flex justify-content-center gap-2 mt-4">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="fas fa-times me-2"></i>Cancelar
                                </button>
                                <button type="button" class="btn btn-warning" id="btnSolicitarPermiso">
                                    <i class="fas fa-paper-plane me-2"></i>Enviar Solicitud
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalPermiso');
        if (modalAnterior) {
            modalAnterior.remove();
        }

        // Agregar nuevo modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Obtener referencias
        const modalElement = document.getElementById('modalPermiso');
        const btnSolicitar = document.getElementById('btnSolicitarPermiso');
        const supervisorSelect = document.getElementById('supervisor_id');
        
        // Cargar supervisores
        cargarSupervisores(supervisorSelect);
        
        // Crear instancia de modal
        const modalPermiso = new bootstrap.Modal(modalElement);
        
        // Configurar eventos
        btnSolicitar.onclick = async () => {
            const supervisorId = supervisorSelect.value;
            if (!supervisorId) {
                mostrarMensaje('Por favor seleccione un supervisor', true);
                return;
            }

            try {
                btnSolicitar.disabled = true;
                btnSolicitar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
                
                const response = await enviarSolicitudAutorizacion(supervisorId);
                
                if (response.success) {
                    modalPermiso.hide();
                    if (response.message === 'Campo ya autorizado') {
                        return; // El modal de autorización aprobada ya se mostró
                    }
                    mostrarNotificacionSolicitud('success', 'Solicitud enviada', 'Su solicitud ha sido enviada al supervisor.');
                    
                    if (campoSeleccionado) {
                        campoSeleccionado.classList.add('esperando-aprobacion');
                        crearOverlayEsperaAprobacion(campoSeleccionado);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacionSolicitud('error', 'Error', error.message);
            } finally {
                btnSolicitar.disabled = false;
                btnSolicitar.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Enviar Solicitud';
            }
        };

        modalPermiso.show();
    }

    function mostrarNotificacionSolicitud(tipo, titulo, mensaje) {
        const notificacion = document.createElement('div');
        notificacion.className = `alert alert-${tipo === 'success' ? 'success' : 'danger'} notification-popup`;
        notificacion.innerHTML = `
            <h6 class="alert-heading">
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                ${titulo}
            </h6>
            <p class="mb-0">${mensaje}</p>
        `;

        // Estilos para la notificación emergente
        Object.assign(notificacion.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '9999',
            minWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.5s ease-out'
        });

        document.body.appendChild(notificacion);

        // Remover después de 5 segundos
        setTimeout(() => {
            notificacion.style.animation = 'slideOut 0.5s ease-out';
            setTimeout(() => notificacion.remove(), 500);
        }, 5000);
    }

    async function crearOverlayEsperaAprobacion(campo) {
        // Identificador único para este campo
        const campoId = campo.id || campo.name || `campo-${Math.random().toString(36).substring(2, 9)}`;
        const overlayStorageKey = `overlay-estado-${campoId}-${bitacoraId}`;
        
        // Asegurar posición relativa del padre
        campo.parentElement.style.position = 'relative';
        
        // Crear el overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay-espera-aprobacion';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(255, 243, 205, 0.8)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '10';
        overlay.style.borderRadius = '4px';
        
        try {
            // Verificar estado en el servidor (pasar el campoId)
            const respuesta = await verificarSolicitudExistente(campoId);
            
            if (respuesta && respuesta.estado) {
                console.log('Estado obtenido del servidor:', respuesta.estado);
                
                // Guardar estado en localStorage
                localStorage.setItem(overlayStorageKey, JSON.stringify({
                    estado: respuesta.estado,
                    timestamp: new Date().getTime()
                }));
                
                // Agregar overlay al DOM antes de configurarlo
                campo.parentElement.appendChild(overlay);
                
                if (respuesta.estado === 'pendiente') {
                    mostrarOverlayPendiente(overlay, campo);
                } else if (respuesta.estado === 'aprobada') {
                    mostrarOverlayAprobado(overlay, campo);
                    // Opcional: remover después de un tiempo
                    setTimeout(() => overlay.remove(), 3000);
                } else if (respuesta.estado === 'rechazada') {
                    mostrarOverlayRechazado(overlay, campo);
                }
            } else {
                // Verificar estado guardado localmente
                const estadoGuardado = localStorage.getItem(overlayStorageKey);
                
                if (estadoGuardado) {
                    const estadoParsed = JSON.parse(estadoGuardado);
                    campo.parentElement.appendChild(overlay);
                    
                    if (estadoParsed.estado === 'pendiente') {
                        mostrarOverlayPendiente(overlay, campo);
                    } else if (estadoParsed.estado === 'aprobada') {
                        mostrarOverlayAprobado(overlay, campo);
                    }
                }
            }
        } catch (error) {
            console.error('Error al crear overlay de espera:', error);
            // Mostrar overlay genérico de error si lo deseas
        }
    }
    
    // Funciones auxiliares para mostrar diferentes estados
    function mostrarOverlayPendiente(overlay, campo) {
        overlay.innerHTML = `
            <div class="text-center p-2">
                <i class="fas fa-clock fa-2x text-warning mb-2"></i>
                
            </div>
        `;
        overlay.style.backgroundColor = 'rgba(255, 243, 205, 0.9)'; // Amarillo claro
    }

    function mostrarOverlayAprobado(overlay, campo) {
        overlay.innerHTML = `
            <div class="text-center p-2">
                <i class="fas fa-check-circle fa-2x text-success mb-2"></i>
                
            </div>
        `;
        overlay.style.backgroundColor = 'rgba(212, 237, 218, 0.9)'; // Verde claro
    }

    function mostrarOverlayRechazado(overlay, campo) {
        overlay.innerHTML = `
            <div class="text-center p-2">
                <i class="fas fa-times-circle fa-2x text-danger mb-2"></i>
                <p class="mb-0 fw-bold">Rechazado</p>
            </div>
        `;
        overlay.style.backgroundColor = 'rgba(248, 215, 218, 0.9)'; // Rojo claro
    }

    // Agregar estilos CSS necesarios
    const styles = document.createElement('style');
    styles.textContent = `
        .esperando-aprobacion {
            background-color: #fff3cd !important;
            border-color: #ffeeba !important;
        }

        .overlay-espera-aprobacion {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 243, 205, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            zIndex: 5;
        }

        .overlay-content {
            text-align: center;
            color: #856404;
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }

        .notification-popup {
            border-radius: 8px;
            border-left: 4px solid;
        }
    `;
    document.head.appendChild(styles);

    // =============================================
    // 5. FUNCIONES DE MANEJO DE LA INTERFAZ (UI)
    // =============================================

    /**
     * Identifica campos relevantes y los almacena en `mapaCamposFormulario`.
     */
    function identificarCamposDelFormulario() {
        console.log('Identificando campos del formulario...');
        mapaCamposFormulario = {}; // Limpiar mapa
        
        const selectoresExcluidos = [
            '[type="button"]', '[type="submit"]', '[type="reset"]', '[type="hidden"]',
            '#observacionesText', '#observacionesTextGeneral', // Textareas de los modales
            '#password', '[name="password"]', // Campos de contraseña (firma)
            '#usuario_destino', '[name="usuario_destino"]', // Select de usuario destino
            '.modal-firma input', '.modal-firma select', '.modal-firma textarea', // Campos dentro del modal de firma
            '.modalOB input', '.modalOB select', '.modalOB textarea', // Campos dentro del modal de observaciones
            '#bitacora_id', '#usuario_id', '#usuario_nombre' // Campos de metadatos
        ].join(', ');

        // Primero, buscar campos con IDs específicos que sabemos que necesitamos
        const camposEspecificos = ['resultado_r', 'ufC_placa_r', 'diferencia_r'];
        camposEspecificos.forEach(prefijo => {
            const campos = document.querySelectorAll(`[id^="${prefijo}"]`);
            campos.forEach(campo => {
                if (campo.id) {
                    mapaCamposFormulario[campo.id] = campo;
                    console.log(`Campo específico encontrado: ${campo.id}`);
                }
            });
        });

        // Luego, buscar el resto de los campos
        const campos = document.querySelectorAll(`input:not(${selectoresExcluidos}), select:not(${selectoresExcluidos}), textarea:not(${selectoresExcluidos})`);

        campos.forEach((campo, index) => {
            let campoId = campo.id || campo.name;
            
            // Si no tiene ID ni name, generar uno basado en su tipo y posición
            if (!campoId) {
                const tipo = campo.type || campo.tagName.toLowerCase();
                campoId = `campo_${tipo}_${index}`;
                campo.id = campoId; // Asignar el ID generado al elemento
                console.warn(`Campo sin ID/name encontrado. ID generado: ${campoId}`, campo);
            }

            if (!mapaCamposFormulario[campoId]) {
                mapaCamposFormulario[campoId] = campo;
                console.log(`Campo registrado: ${campoId} (${campo.type || campo.tagName.toLowerCase()})`);
            }
        });

        console.log(`Identificados ${Object.keys(mapaCamposFormulario).length} campos únicos:`, 
            Object.keys(mapaCamposFormulario));
    }

    /**
     * Crea un overlay interactivo sobre un campo específico.
     * @param {HTMLElement} campo - El elemento del campo del formulario.
     * @param {string} campoId - El ID o nombre del campo.
     */
    function crearOverlayParaCampo(campo, campoId) {
        console.log('Creando overlay para campo:', { campoId, campo });
        if (!campo || !campo.parentNode) {
            console.error('Campo no válido o sin padre:', { campoId, campo });
            return;
        }

        // Establecer el ID en el campo si no lo tiene
        if (!campo.id) {
            campo.id = campoId;
        }

        // Remover overlay existente si hay uno
        const existingOverlay = campo.parentNode.querySelector(`.campo-overlay[data-target-field="${campoId}"]`);
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const datosCampo = observacionesPorCampo[campoId];
        console.log('Datos del campo:', datosCampo);

        // Hacer el campo base interactivo si tiene observaciones o está pendiente
        if (datosCampo && (datosCampo.estado === 'pendiente' || datosCampo.observacion)) {
            campo.style.backgroundColor = '#ffebee';
            campo.style.pointerEvents = 'auto';
            campo.style.cursor = 'pointer';
            campo.classList.add('tiene-observacion');

            // Añadir evento click directamente al campo también
            campo.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Click en campo:', { campoId, estado: datosCampo.estado });
                
                // Establecer el campo seleccionado antes de verificar permisos
                campoSeleccionado = campo;
                campoSeleccionadoId = campoId;
                
                if (!tienePermisoEdicion(campoId)) {
                    MostrarModalAutorizacion(campoId);
                } else {
                    abrirModalObservaciones(datosCampo.estado);
                }
            };
        }

        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'campo-overlay';
        overlay.dataset.targetField = campoId;
        overlay.dataset.estado = datosCampo?.estado || 'pendiente' || 'aprobada';

        // Configuración de estilos base
        configurarEstilosOverlay(overlay);
        
        // Configurar eventos del campo y overlay
        configurarEventosCampo(campo, overlay, campoId, datosCampo);

        campo.parentNode.appendChild(overlay);
    }

    function configurarEstilosOverlay(overlay) {
        Object.assign(overlay.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            zIndex: '10',
            backgroundColor: 'transparent',
            boxSizing: 'border-box'
        });
    }

    function configurarEventosCampo(campo, overlay, campoId, datosCampo) {
        const manejadorClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Interacción con campo:', {
                campoId,
                estado: datosCampo?.estado,
                observacion: datosCampo?.observacion
            });
            
            campoSeleccionado = campo;
            campoSeleccionadoId = campoId;
            
            if (!tienePermisoEdicion(campoId)) {
                MostrarModalAutorizacion(campoId);
            } else {
                abrirModalObservaciones(datosCampo?.estado || 'pendiente');
            }
        };

        // Configurar eventos tanto para el campo como para el overlay
        overlay.onclick = manejadorClick;
        campo.onclick = manejadorClick;

        // Configurar estilos del campo si tiene observaciones
        if (datosCampo && (datosCampo.estado === 'pendiente' || datosCampo.observacion)) {
            Object.assign(campo.style, {
                backgroundColor: '#ffebee',
                pointerEvents: 'auto',
                cursor: 'pointer'
            });
            campo.classList.add('tiene-observacion');
        }

        // Asegurar que el contenedor tenga posición relativa
        if (window.getComputedStyle(campo.parentNode).position === 'static') {
            campo.parentNode.style.position = 'relative';
        }
    }

    /**
     * Actualiza visualmente el campo en el formulario (valor y estilo).
     * @param {HTMLElement} campo - El campo a actualizar.
     * @param {string} valorEditado - El valor actual del campo.
     * @param {boolean} estaCorregido - Indica si el campo está corregido.
     */
    function actualizarCampoVisualmente(campo, valorEditado, estaCorregido) {
        console.log('Actualizando campo visualmente:', {
            campoId: campo?.id || campo?.name,
            valorEditado,
            estaCorregido
        });
        if (!campo) return;
        const tipoCampo = campo.type || campo.tagName.toLowerCase();
        const datosCampo = observacionesPorCampo[campo.id || campo.name];
        
        // 1. Actualizar el valor visible del campo
        try {
            switch (tipoCampo) {
                case 'checkbox':
                case 'radio':
                    campo.checked = valorEditado.toLowerCase() === 'seleccionado';
                    break;
                case 'select':
                case 'select-one':
                    Array.from(campo.options).some((opcion, index) => {
                        if (opcion.text === valorEditado) {
                            campo.selectedIndex = index;
                            return true;
                        }
                        return false;
                    });
                    break;
                case 'date':
                    if (valorEditado && valorEditado !== '---') {
                        try {
                            const fecha = new Date(valorEditado.replace(/-/g, '/'));
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
                    if (valorEditado && valorEditado !== '---') {
                        const match = valorEditado.match(/(\d{1,2}):(\d{2})/);
                        if (match) {
                            campo.value = `${match[1].padStart(2, '0')}:${match[2]}`;
                        } else {
                            campo.value = valorEditado;
                        }
                    } else {
                        campo.value = '';
                    }
                    break;
                default:
                    campo.value = valorEditado;
                    break;
            }

            // Disparar eventos de cambio para activar los cálculos
            campo.dispatchEvent(new Event('change', { bubbles: true }));
            campo.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Si es un campo numérico, también disparar el evento blur
            if (campo.type === 'number' || campo.classList.contains('placa1') || 
                campo.classList.contains('placa2') || campo.classList.contains('placa3') ||
                campo.classList.contains('placa4') || campo.classList.contains('placa5') ||
                campo.classList.contains('placa6')) {
                campo.dispatchEvent(new Event('blur', { bubbles: true }));
            }

        } catch (error) {
            console.error('Error al actualizar valor visual del campo:', campo.id || campo.name, error);
        }

        // 2. Actualizar clases CSS según el estado
        campo.classList.remove('tiene-observacion', 'corregido'); // Limpiar clases previas

        // Remover overlay existente si hay uno
        const existingOverlay = campo.parentNode?.querySelector(`.campo-overlay[data-target-field="${campo.id || campo.name}"]`);
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Actualizar estilo visual
        if (estaCorregido) {
            campo.style.backgroundColor = '#e8f5e9'; // Verde claro
            campo.classList.remove('tiene-observacion');
            campo.classList.add('corregido');
        } else {
            campo.style.backgroundColor = '#ffebee'; // Rojo claro
            campo.classList.add('tiene-observacion');
            campo.classList.remove('corregido');
        }

        console.log(`Campo ${campo.id || campo.name} actualizado visualmente. Estado: ${datosCampo?.estado}`);
    }

    function actualizarEstadoAutorizacion(campo, campoId, estadoAutorizacion) {
        if (!campo || !campoId) return;
        
        console.log(`Actualizando estado de autorización para ${campoId}:`, estadoAutorizacion);
        
        // Limpiar overlays de autorización previos
        const existingAuthOverlay = campo.parentNode?.querySelector('.auth-overlay');
        if (existingAuthOverlay) existingAuthOverlay.remove();
        
        // Solo mostrar overlay si el estado no es nulo/undefined
        if (estadoAutorizacion) {
            // Crear overlay específico para autorización
            const authOverlay = document.createElement('div');
            authOverlay.className = `auth-overlay auth-${estadoAutorizacion}`;
            authOverlay.dataset.campoId = campoId;
            authOverlay.dataset.estado = estadoAutorizacion;
            
            // Configurar según el estado
            switch(estadoAutorizacion) {
                case 'pendiente':
                    authOverlay.innerHTML = `
                        <div class="auth-overlay-content">
                            <i class="fas fa-clock"></i>
                            <span>Pendiente de autorización</span>
                        </div>`;
                    authOverlay.style.backgroundColor = 'rgba(255, 193, 7, 0.3)';
                    campo.style.backgroundColor = '#fff3cd'; // Color naranja claro para pendiente
                    break;
                    
                case 'aprobada':
                    authOverlay.innerHTML = `
                        <div class="auth-overlay-content">
                            <i class="fas fa-check-circle"></i>
                            <span>Autorizado</span>
                        </div>`;
                    authOverlay.style.backgroundColor = 'rgba(40, 167, 69, 0.2)';
                    campo.style.backgroundColor = '#d4edda'; // Color verde claro para aprobado
                    break;
                    
                case 'rechazada':
                    authOverlay.innerHTML = `
                        <div class="auth-overlay-content">
                            <i class="fas fa-times-circle"></i>
                            <span>Rechazado</span>
                        </div>`;
                    authOverlay.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                    campo.style.backgroundColor = '#f8d7da'; // Color rojo claro para rechazado
                    break;
            }
            
            // Estilos comunes
            authOverlay.style.position = 'absolute';
            authOverlay.style.top = '0';
            authOverlay.style.left = '0';
            authOverlay.style.width = '100%';
            authOverlay.style.height = '100%';
            authOverlay.style.display = 'flex';
            authOverlay.style.alignItems = 'center';
            authOverlay.style.justifyContent = 'center';
            authOverlay.style.zIndex = '10';
            authOverlay.style.pointerEvents = 'none'; // Permitir interacción con el campo
            
            // Asegurar que el contenedor tenga posición relativa
            if (campo.parentNode) {
                campo.parentNode.style.position = 'relative';
                campo.parentNode.appendChild(authOverlay);
            }
            
            // Guardar el estado en localStorage para persistencia entre recargas
            const storageKey = `auth-estado-${campoId}-${bitacoraId}`;
            localStorage.setItem(storageKey, JSON.stringify({
                estado: estadoAutorizacion,
                timestamp: new Date().getTime()
            }));
        }
        
        // Actualizar el objeto de estado global
        if (!estadosAutorizacion) estadosAutorizacion = {};
        estadosAutorizacion[campoId] = estadoAutorizacion;
    }
    // =============================================
    // 6. FUNCIONES DE MANEJO DE MODALES
    // =============================================

    /**
     * Abre el modal de observaciones individuales.
     */
    function abrirModalObservaciones(estado = 'pendiente') {
        console.log('Abriendo modal con estado:', estado);
        
        if (!observacionesModalElement || !campoSeleccionadoId) {
            console.error('Error: Faltan elementos necesarios para abrir el modal');
            return;
        }

        const datosCampo = observacionesPorCampo[campoSeleccionadoId];
        if (!datosCampo) {
            console.error('Error: No hay datos para el campo');
            return;
        }

        // Verificar si el campo puede ser editado según su estado
        if (datosCampo.estado === 'aprobado') {
            console.log('Campo aprobado, no se puede editar');
            mostrarMensaje('Este campo ya está aprobado y no puede ser editado.', true);
            return;
        }

        // Crear instancia del modal si no existe
        if (!observacionesModalInstance) {
            observacionesModalInstance = new bootstrap.Modal(observacionesModalElement, {
                keyboard: false,
                backdrop: 'static'
            });
        }

        const observacionOriginal = datosCampo.observacion || '';
        const valorActual = datosCampo.valor_actual || obtenerValorCampo(campoSeleccionado);
        const nombreCampo = datosCampo.campo_nombre || obtenerNombreDescriptivoCampo(campoSeleccionado);
        const tipoCampo = obtenerTipoCampoLegible(campoSeleccionado);

        // Actualizar elementos del modal
        document.getElementById('observacionesModalLabel').textContent = 'Corregir Campo';
        
        const campoInfo = document.getElementById('campoSeleccionadoInfo');
        const campoNombreSpan = document.getElementById('campoSeleccionadoNombre');
        if (campoInfo && campoNombreSpan) {
            campoInfo.style.display = 'block';
            campoNombreSpan.textContent = `${nombreCampo} (${tipoCampo})`;
        }

        const comentarioDiv = document.getElementById('comentarioObservacion');
        const textoObservacionSpan = document.getElementById('textoObservacion');
        if (comentarioDiv && textoObservacionSpan) {
            if (observacionOriginal) {
                comentarioDiv.style.display = 'block';
                textoObservacionSpan.textContent = observacionOriginal;
            } else {
                comentarioDiv.style.display = 'none';
            }
        }

        if (observacionesTextElement) {
            observacionesTextElement.value = valorActual;
            observacionesTextElement.readOnly = false;
            personalizarPlaceholderSegunTipoCampo(observacionesTextElement, campoSeleccionado);
        }

        // Mostrar botón de guardar
        if (guardarObservacionesBtn) {
            guardarObservacionesBtn.style.display = 'inline-block';
        }

        // Mostrar el modal con manejo de errores mejorado
        try {
            observacionesModalInstance.show();
            console.log('Modal mostrado correctamente');
        } catch (error) {
            console.error('Error al mostrar modal:', error);
            // Fallback a jQuery
            try {
                $(observacionesModalElement).modal('show');
            } catch (jqError) {
                console.error('Error en fallback jQuery:', jqError);
                mostrarMensaje('Error al abrir el modal de observaciones', true);
            }
        }
    }

    /**
     * Cierra el modal de observaciones individuales.
     */
    function cerrarModalObservaciones() {
        if (observacionesModalInstance) {
            observacionesModalInstance.hide();
        }
        // Limpiar selección
        campoSeleccionado = null;
        campoSeleccionadoId = null;
    }

    /**
     * Abre el modal general (para observación general o resumen).
     * @param {boolean} esResumen - Indica si se debe mostrar el resumen.
     */
    function abrirModalGeneral(esResumen = false) {
        console.log('Abriendo modal general:', { esResumen });
        
        const modalElement = document.getElementById('observacionesModalGeneral');
        if (!modalElement) {
            console.error('Modal general no encontrado en el DOM');
            return;
        }

        if (!observacionesModalGeneralInstance) {
            observacionesModalGeneralInstance = new bootstrap.Modal(modalElement);
        }

        // Obtener elementos del modal
        const tituloElement = modalElement.querySelector('#observacionesTituloGeneral');
        const textareaElement = modalElement.querySelector('#observacionesTextGeneral');
        const btnGuardar = modalElement.querySelector('#guardarObservacionesGeneral');

        // Obtener datos generales
        const datosGenerales = observacionesPorCampo['observacion_general'] || {
            observacion: '',
            estado: 'pendiente'
        };

        console.log('Datos generales:', datosGenerales);

        if (esResumen) {
            // Modo resumen
            if (tituloElement) tituloElement.textContent = 'Resumen de Observaciones';
            if (textareaElement) {
                const resumen = generarTextoResumen();
                textareaElement.value = resumen;
                textareaElement.readOnly = true;
            }
            if (btnGuardar) btnGuardar.style.display = 'none';
        } else {
            // Modo observación general
            if (tituloElement) tituloElement.textContent = 'Observación General';
            if (textareaElement) {
                textareaElement.value = datosGenerales.observacion || '';
                textareaElement.readOnly = false;
                textareaElement.placeholder = 'Escriba aquí la observación general...';
            }
            if (btnGuardar) btnGuardar.style.display = 'block';
        }

        observacionesModalGeneralInstance.show();
    }

    /**
     * Cierra el modal de observaciones generales.
     */
    function cerrarModalObservacionesGeneral() {
        if (observacionesModalGeneralInstance) {
            observacionesModalGeneralInstance.hide();
        }
    }

    /**
     * Genera el texto para el resumen de observaciones.
     * @returns {string} - El texto del resumen.
     */
    function generarTextoResumen() {
        let resumen = "RESUMEN DE OBSERVACIONES PENDIENTES:\n\n";
        let contador = 1;
        let hayObservaciones = false;

        // Observación General (solo si no está aprobada)
        const obsGeneral = observacionesPorCampo['observacion_general'];
        if (obsGeneral && 
            obsGeneral.observacion?.trim() && 
            obsGeneral.estado !== 'aprobado' && 
            obsGeneral.estado !== 'aprobada') {
            resumen += "=== OBSERVACIÓN GENERAL ===\n";
            resumen += `${obsGeneral.observacion.trim()}\n`;
            resumen += `Estado: ${obsGeneral.estado || 'pendiente'}\n\n`;
            hayObservaciones = true;
        }

        // Observaciones por Campo (excluyendo los aprobados)
        resumen += "=== OBSERVACIONES POR CAMPO ===\n";
        for (const [id, datos] of Object.entries(observacionesPorCampo)) {
            if (id !== 'observacion_general' && 
                datos.observacion?.trim() && 
                datos.estado !== 'aprobado' && 
                datos.estado !== 'aprobada') {
                
                hayObservaciones = true;
                
                // Determinar el estado del campo
                let estadoTexto;
                if (datos.estado === 'rechazado') {
                    estadoTexto = '(Rechazado)';
                } else if (verificarCampoCorregido(id)) {
                    estadoTexto = '(Corregido)';
                } else {
                    estadoTexto = '(Pendiente)';
                }

                resumen += `${contador}. Campo: "${datos.campo_nombre || id}" ${estadoTexto}\n`;
                resumen += `   Valor Original: ${datos.valor_original || '---'}\n`;
                if (datos.valor_actual && datos.valor_actual !== datos.valor_original) {
                    resumen += `   Valor Actual: ${datos.valor_actual}\n`;
                }
                resumen += `   Observación: ${datos.observacion.trim()}\n\n`;
                contador++;
            }
        }

        if (!hayObservaciones) {
            resumen = "No hay observaciones pendientes.\n";
        }

        return resumen;
    }

    // =============================================
    // 7. LÓGICA DE GUARDADO (ACCIONES DE BOTONES)
    // =============================================

    /**
     * Guarda la corrección realizada en el modal de observaciones individuales.
     */
    async function guardarCorreccionCampo() {
        if (!campoSeleccionado || !campoSeleccionadoId || !observacionesTextElement) {
            console.error('No hay campo seleccionado o falta el textarea para guardar.');
            return;
        }

        const valorEditado = observacionesTextElement.value;
        const datosOriginales = observacionesPorCampo[campoSeleccionadoId] || {};
        const valorOriginal = datosOriginales.valor_original !== undefined ? datosOriginales.valor_original : obtenerValorCampo(campoSeleccionado);
        const observacion = datosOriginales.observacion || '';
        const nombreCampo = datosOriginales.campo_nombre || obtenerNombreDescriptivoCampo(campoSeleccionado);
        const tipoCampo = datosOriginales.campo_tipo || (campoSeleccionado.type || campoSeleccionado.tagName.toLowerCase());
        let historial = datosOriginales.historial_ediciones || [];
        let contador = datosOriginales.contador_ediciones || 0;
        const valorHaCambiado = valorEditado.trim() !== (valorOriginal || '').trim();

        if (valorHaCambiado) {
            contador++;
            historial.push({
                numero_edicion: contador,
                valor_anterior: valorOriginal,
                valor_nuevo: valorEditado,
                usuario_id: usuarioId,
                usuario_nombre: usuarioNombre,
                fecha_edicion: new Date().toISOString()
            });
        }

        // Actualizar estado local con el nuevo estado
        observacionesPorCampo[campoSeleccionadoId] = {
            ...datosOriginales,
            observacion: observacion,
            valor_original: valorOriginal,
            valor_actual: valorEditado,
            campo_nombre: nombreCampo,
            campo_tipo: tipoCampo,
            historial_ediciones: historial,
            contador_ediciones: contador,
            estado: valorHaCambiado ? 'editado' : datosOriginales.estado, // Cambiar estado a 'editado' si el valor cambió
            corregido: valorHaCambiado
        };

        // Actualizar UI y guardar en servidor
        actualizarCampoVisualmente(campoSeleccionado, valorEditado, valorHaCambiado);

        try {
            await guardarCampoEnServidor(campoSeleccionadoId);
            
            // Actualizar visualmente después de guardar exitosamente
            crearOverlayParaCampo(campoSeleccionado, campoSeleccionadoId);
            
            cerrarModalObservaciones();
            actualizarContadorObservaciones();
        } catch (error) {
            console.error("Error durante el guardado, el modal permanecerá abierto.", error);
        }
    }

    /**
     * Guarda la observación general introducida en el modal general.
     */
    function guardarObservacionGeneral() {
        if (!observacionesTextGeneralElement) return;
        const observacionTexto = observacionesTextGeneralElement.value.trim();

        // Actualizar estado local
        observacionesPorCampo['observacion_general'] = {
            observacion: observacionTexto,
            campo_nombre: 'Observación General',
            campo_tipo: 'general',
            valor_original: '', // No aplica
            valor_actual: '', // No aplica
            historial_ediciones: [], // No aplica
            contador_ediciones: 0, // No aplica
            corregido: false // No aplica
        };

        // Guardar en servidor
        guardarCampoEnServidor('observacion_general');
        cerrarModalObservacionesGeneral();
        mostrarMensaje('Observación general guardada.', false);
        actualizarContadorObservaciones();
    }

    // =============================================
    // 8. CONFIGURACIÓN DE EVENTOS
    // =============================================

    function configurarEventListeners() {
        // Botón Guardar en Modal Individual
        if (guardarObservacionesBtn) {
            guardarObservacionesBtn.addEventListener('click', guardarCorreccionCampo);
        }

        // Botón Guardar en Modal General
        if (guardarObservacionesGeneralBtn) {
            guardarObservacionesGeneralBtn.addEventListener('click', guardarObservacionGeneral);
        }

        // Botón Resumen/Retroalimentación
        if (btnResumenObservaciones) {
            const nuevoBtnResumen = btnResumenObservaciones.cloneNode(true);
            if (btnResumenObservaciones.parentNode) {
                btnResumenObservaciones.parentNode.replaceChild(nuevoBtnResumen, btnResumenObservaciones);
                nuevoBtnResumen.addEventListener('click', () => abrirModalGeneral(true)); // Abrir en modo resumen
            }
        }

        // Botones de cierre de los modales (usando delegación si son muchos)
        document.body.addEventListener('click', function(event) {
            if (event.target.matches('.modal .btn-close, .modal [data-bs-dismiss="modal"]')) {
                if (event.target.closest('#observacionesModal')) {
                    cerrarModalObservaciones(); // Limpia campoSeleccionado
                }
            }
        });

        console.log('Event listeners configurados.');
    }

    // =============================================
    // 9. INICIALIZACIÓN
    // =============================================

    function inicializar() {
        console.log('Inicializando script de visualización de campos rechazados...');
        if (!bitacoraId) {
            console.error("¡Error Crítico! No se encontró el ID de la bitácora en el DOM (elemento #bitacora_id). El script no puede funcionar.");
            mostrarMensaje("Error: Falta ID de bitácora. Funcionalidad limitada.", true, 10000);
            return; // Detener inicialización si falta el ID
        }

        identificarCamposDelFormulario();
        configurarEventListeners();
        cargarDatosGuardados(); // Carga datos y crea overlays necesarios
        cargarEstadosAutorizacion();

        // Deshabilitar filas al cargar la página
        const filas = document.querySelectorAll('#tabla-body tr');
        filas.forEach(fila => {
            const primerCampo = fila.querySelector('input, select, textarea');
            if (primerCampo) {
                const campoId = primerCampo.id || primerCampo.name;
                if (campoId && CAMPOS_CON_PERMISO_ESPECIAL.some(prefijo => campoId.startsWith(prefijo))) {
                    toggleFilaEdicion(fila, true); // Deshabilitar al inicio
                }
            }
        });

        console.log('Script inicializado correctamente.');
    }

    // Función para mostrar el modal de filas desbloqueadas
    function mostrarModalFilasDesbloqueadas(filasDesbloqueadas) {
        const modalHTML = `
            <div class="modal fade" id="filasDesbloqueadasModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0">
                        <div class="modal-header bg-success text-white border-0">
                            <h5 class="modal-title">
                                <i class="fas fa-unlock-alt me-2"></i>
                                Filas Desbloqueadas
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <i class="fas fa-check-circle fa-4x text-success mb-3"></i>
                            <h4 class="fw-bold">Se han desbloqueado ${filasDesbloqueadas.length} filas</h4>
                            <div class="alert alert-light mt-3">
                                <p class="mb-2">Filas desbloqueadas:</p>
                                <ul class="list-group">
                                    ${filasDesbloqueadas.map(fila => `
                                        <li class="list-group-item d-flex justify-content-between align-items-center">
                                            ${fila}
                                            <span class="badge bg-success rounded-pill">Desbloqueada</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                        <div class="modal-footer border-0 justify-content-center">
                            <button type="button" class="btn btn-success px-4" data-bs-dismiss="modal">
                                <i class="fas fa-check me-2"></i>Entendido
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('filasDesbloqueadasModal');
        if (modalAnterior) modalAnterior.remove();

        // Agregar nuevo modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar el modal
        const modalElement = document.getElementById('filasDesbloqueadasModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }

    // Ejecutar inicialización cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', inicializar);

    // =============================================
    // 10. EXPOSICIÓN GLOBAL (SI ES NECESARIO)
    // =============================================

    window.obtenerObservacionesYCampos = function () {
        return {
            observaciones: observacionesPorCampo
        };
    };

    /**
     * Carga la lista de supervisores en un elemento select.
     * @param {HTMLSelectElement} selectElement - El elemento select donde se cargarán los supervisores.
     */
    async function cargarSupervisores(selectElement) {
        try {
            // Obtener supervisores mediante una llamada AJAX
            const response = await ajaxRequest('/microbiologia/api/usuarios/', 'GET');
            
            // Limpiar el select
            selectElement.innerHTML = '<option value="">Seleccione un supervisor...</option>';
            
            // Filtrar solo los supervisores (Jefes de Laboratorio)
            const supervisores = response.filter(usuario => usuario.rol === 'Jefe de Laboratorio');
            
            // Agregar cada supervisor al select
            supervisores.forEach(supervisor => {
                const option = document.createElement('option');
                option.value = supervisor.id;
                option.textContent = `${supervisor.nombre} ${supervisor.apellido} - ${supervisor.area}`;
                selectElement.appendChild(option);
            });

        } catch (error) {
            console.error('Error al cargar supervisores:', error);
            mostrarMensaje('Error al cargar lista de supervisores', true);
            selectElement.innerHTML = '<option value="">Error al cargar supervisores</option>';
        }
    }

})(); // Fin de la IIFE
