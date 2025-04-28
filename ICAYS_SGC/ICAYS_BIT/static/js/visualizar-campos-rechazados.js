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
     * @param {object} [data] - Datos a enviar (para POST).
     * @returns {Promise<object>} - Promesa que resuelve con la respuesta JSON.
     */
    function ajaxRequest(url, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            // Asegurarse de que la URL comience con /
            if (!url.startsWith('/')) {
                url = '/' + url;
            }

            const headers = {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            };

            // Si es FormData, no establecer Content-Type
            // Si no es FormData, establecer application/json
            if (!(data instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
            }

            const config = {
                url: url,
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
            if (data) {
                if (data instanceof FormData) {
                    config.processData = false;
                    config.contentType = false;
                    config.data = data;
                } else {
                    config.data = JSON.stringify(data);
                }
            }

            // Log de depuración
            console.log('Configuración de la petición:', {
                url: config.url,
                method: config.type,
                headers: config.headers,
                data: data instanceof FormData ? 
                    Object.fromEntries(data.entries()) : 
                    data
            });

            $.ajax(config);
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
                estado: obs.estado || 'pendiente' // Asegurar que siempre haya un estado
            };

            // Si no es la observación general, buscar el campo y crear overlay
            if (campoId !== 'observacion_general') {
                const campo = mapaCamposFormulario[campoId];
                if (campo) {
                    crearOverlayParaCampo(campo, campoId);
                    // Actualizar visualmente el campo con el valor cargado
                    actualizarCampoVisualmente(
                        campo, 
                        observacionesPorCampo[campoId].valor_actual,
                        observacionesPorCampo[campoId].estado === 'editado'
                    );
                }
            }
        });

        console.log('Estado de observacionesPorCampo actualizado:', observacionesPorCampo);
    }

    /**
     * Guarda los datos de un campo específico (corrección/observación) en el servidor.
     * @param {string} campoIdAGuardar - El ID del campo a guardar.
     */
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
                formData
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

            // Verificar que tengamos un ID de usuario válido
            if (!usuarioId || usuarioId === '0') {
                console.error('ID de usuario actual:', usuarioId); // Para debug
                throw new Error('ID de usuario no disponible');
            }

            const datosCampo = observacionesPorCampo[campoSeleccionadoId] || {};
            
            const formData = new FormData();
            formData.append('bitacora_id', bitacoraId);
            formData.append('campo_id', campoSeleccionadoId);
            formData.append('campo_nombre', datosCampo.campo_nombre || obtenerNombreDescriptivoCampo(campoSeleccionado));
            formData.append('valor_actual', obtenerValorCampo(campoSeleccionado));
            formData.append('solicitante_id', usuarioId.toString());  // Usar el ID actualizado
            formData.append('supervisor_id', supervisorId.toString());
            formData.append('estado', 'pendiente');

            // Log para debug
            console.log('Datos de la solicitud:', {
                bitacora_id: bitacoraId,
                campo_id: campoSeleccionadoId,
                solicitante_id: usuarioId,
                supervisor_id: supervisorId,
                valor_actual: obtenerValorCampo(campoSeleccionado)
            });

            const response = await ajaxRequest(
                '/microbiologia/api/solicitar-autorizacion/',
                'POST',
                formData
            );

            if (response.success) {
                mostrarMensaje('Solicitud enviada correctamente', false);
                return response;
            } else {
                throw new Error(response.message || 'Error al procesar la solicitud');
            }

        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            mostrarMensaje('Error al enviar la solicitud: ' + error.message, true);
            throw error;
        }
    }

    async function cargarSupervisores(selectElement) {
        try {
            const response = await ajaxRequest('/microbiologia/api/usuarios/', 'GET');
            const supervisores = response.filter(user => user.rol === 'Jefe de Laboratorio');
            
            selectElement.innerHTML = '<option value="">Seleccione un supervisor...</option>';
            supervisores.forEach(supervisor => {
                const option = document.createElement('option');
                option.value = supervisor.id;  // Usar el id del supervisor
                option.textContent = `${supervisor.nombre} ${supervisor.apellido} - ${supervisor.area}`;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar supervisores:', error);
            mostrarMensaje('Error al cargar lista de supervisores', true);
        }
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
                modalPermiso.hide();
                
                if (response.success) {
                    mostrarNotificacionSolicitud('success', 'Solicitud enviada', 'Su solicitud ha sido enviada al supervisor.');
                    
                    // Marcar el campo visualmente como "en espera de aprobación"
                    if (campoSeleccionado) {
                        campoSeleccionado.classList.add('esperando-aprobacion');
                        crearOverlayEsperaAprobacion(campoSeleccionado);
                    }
                } else {
                    mostrarNotificacionSolicitud('error', 'Error', response.message || 'Error al enviar la solicitud');
                }
            } catch (error) {
                console.error('Error al enviar solicitud:', error);
                mostrarNotificacionSolicitud('error', 'Error', error.message || 'Error al procesar la solicitud');
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

    function crearOverlayEsperaAprobacion(campo) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay-espera-aprobacion';
        overlay.innerHTML = `
            <div class="overlay-content">
                <i class="fas fa-clock text-warning"></i>
                <span>Esperando aprobación...</span>
            </div>
        `;
        
        campo.parentElement.style.position = 'relative';
        campo.parentElement.appendChild(overlay);
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
            z-index: 5;
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
                    mostrarModalPermiso();
                } else {
                    abrirModalObservaciones(datosCampo.estado);
                }
            };
        }

        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'campo-overlay';
        overlay.dataset.targetField = campoId;
        overlay.dataset.estado = datosCampo?.estado || 'pendiente';

        // Estilos del overlay
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.cursor = 'pointer';
        overlay.style.zIndex = '10';
        overlay.style.backgroundColor = 'transparent';
        
        // Añadir borde y fondo si está pendiente
        if (datosCampo?.estado === 'pendiente') {
            overlay.style.border = '2px solid #ff5252';
            overlay.style.boxSizing = 'border-box';
        }

        // Asegurar que el contenedor tenga posición relativa
        if (window.getComputedStyle(campo.parentNode).position === 'static') {
            campo.parentNode.style.position = 'relative';
        }

        // Modificar el evento click del overlay
        overlay.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Click en overlay:', {
                campoId,
                estado: datosCampo?.estado,
                observacion: datosCampo?.observacion
            });
            
            // Establecer el campo seleccionado antes de verificar permisos
            campoSeleccionado = campo;
            campoSeleccionadoId = campoId;
            
            if (!tienePermisoEdicion(campoId)) {
                mostrarModalPermiso();
            } else {
                abrirModalObservaciones(datosCampo?.estado || 'pendiente');
            }
        };

        campo.parentNode.appendChild(overlay);
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

        if (datosCampo) {
            switch (datosCampo.estado) {
                case 'pendiente':
                    campo.classList.add('tiene-observacion'); // Rojo
                    // Asegurar que el campo sea interactivo
                    campo.style.pointerEvents = 'auto';
                    break;
                case 'editado':
                    campo.classList.add('corregido'); // Verde
                    // Asegurar que el campo sea interactivo
                    campo.style.pointerEvents = 'auto';
                    break;
                case 'aprobado':
                    // Remover todas las clases de estado y deshabilitar interacción
                    campo.style.pointerEvents = 'none';
                    campo.style.backgroundColor = 'transparent';
                    campo.style.cursor = 'default';
                    break;
                case 'rechazado':
                    campo.classList.add('tiene-observacion'); // Rojo
                    // Asegurar que el campo sea interactivo
                    campo.style.pointerEvents = 'auto';
                    break;
                default:
                    if ((datosCampo.observacion || '').trim() !== '') {
                        campo.classList.add('tiene-observacion');
                        campo.style.pointerEvents = 'auto';
                    }
            }
        }

        console.log(`Campo ${campo.id || campo.name} actualizado visualmente. Estado: ${datosCampo?.estado}`);
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
        if (!observacionesModalGeneralElement) {
            console.error('Elemento del modal general no encontrado.');
            mostrarMensaje('Error: No se pudo abrir el modal general.', true);
            return;
        }
        if (!observacionesModalGeneralInstance) {
            observacionesModalGeneralInstance = new bootstrap.Modal(observacionesModalGeneralElement);
        }

        const tituloModal = document.getElementById('observacionesTituloGeneral');
        const comentarioDiv = document.getElementById('comentarioObservacionGeneral'); // Asumiendo que existe para general

        if (esResumen) {
            if (tituloModal) tituloModal.textContent = 'Resumen de Observaciones';
            if (comentarioDiv) comentarioDiv.style.display = 'none';
            if (observacionesTextGeneralElement) {
                observacionesTextGeneralElement.value = generarTextoResumen();
                observacionesTextGeneralElement.readOnly = true;
            }
            if (guardarObservacionesGeneralBtn) guardarObservacionesGeneralBtn.style.display = 'none';
            console.log('Abriendo modal en modo Resumen.');

        } else { // Modo Observación General
            if (tituloModal) tituloModal.textContent = 'Agregar Observación General';
            if (comentarioDiv) comentarioDiv.style.display = 'none'; // No aplica comentario previo para general
            if (observacionesTextGeneralElement) {
                observacionesTextGeneralElement.value = observacionesPorCampo['observacion_general']?.observacion || '';
                observacionesTextGeneralElement.readOnly = false;
                observacionesTextGeneralElement.placeholder = 'Escriba aquí una observación general sobre la bitácora...';
            }
            if (guardarObservacionesGeneralBtn) guardarObservacionesGeneralBtn.style.display = 'inline-block';
            console.log('Abriendo modal para Observación General.');
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
        let resumen = "RESUMEN DE OBSERVACIONES:\n\n";
        let contador = 1;
        let hayObservaciones = false;

        // Observación General
        const obsGeneral = observacionesPorCampo['observacion_general'];
        if (obsGeneral && (obsGeneral.observacion || '').trim()) {
            resumen += `OBSERVACIÓN GENERAL:\n${obsGeneral.observacion.trim()}\n\n`;
            hayObservaciones = true;
        }

        // Observaciones por Campo
        for (const [id, datos] of Object.entries(observacionesPorCampo)) {
            if (id !== 'observacion_general' && (datos.observacion || '').trim()) {
                hayObservaciones = true;
                const nombreCampo = datos.campo_nombre || id;
                const valorOriginal = datos.valor_original || '---';
                const valorActual = datos.valor_actual || valorOriginal; // Mostrar valor actual o el original si no hay actual
                const observacion = datos.observacion.trim();
                const estaCorregido = verificarCampoCorregido(id);
                const estado = estaCorregido ? '(Corregido)' : '(Pendiente)';

                resumen += `${contador}. Campo: "${nombreCampo}" ${estado}\n`;
                resumen += `   Valor Original: ${valorOriginal}\n`;
                if (estaCorregido) { // Solo mostrar valor actual si cambió
                    resumen += `   Valor Corregido: ${valorActual}\n`;
                }
                resumen += `   Observación: ${observacion}\n\n`;
                contador++;
            }
        }

        if (!hayObservaciones) {
            resumen += "No hay observaciones registradas.\n";
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

})(); // Fin de la IIFE
