// Función para resaltar campos requeridos
function resaltarCamposRequeridos(formId = 'form-principal') {
    console.log('Resaltando campos requeridos...');
    
    const form = document.getElementById(formId);
    if (!form) {
        console.error(`No se encontró el formulario con ID: ${formId}`);
        return;
    }
    
    // Obtener todos los campos requeridos
    const camposRequeridos = form.querySelectorAll('[required]');
    
    // Agregar clase visual a todos los campos requeridos
    camposRequeridos.forEach(campo => {
        campo.classList.add('required-field');
    });
}

// Función genérica de validación que puede ser reutilizada
function validarCamposRequeridos(formId = 'form-principal', mostrarAlerta = true) {
    console.log('Validando campos requeridos...');
    
    const form = document.getElementById(formId);
    
    // Si no encuentra el formulario, no continuar
    if (!form) {
        console.error(`No se encontró el formulario con ID: ${formId}`);
        return false;
    }
    
    // Añadir la clase de Bootstrap para la validación
    form.classList.add('was-validated');
    
    // Obtener todos los campos requeridos
    const camposRequeridos = form.querySelectorAll('[required]');
    let formValido = true;
    let primerCampoInvalido = null;
    
    // Verificar cada campo requerido
    camposRequeridos.forEach(campo => {
        let invalido = false;
        
        // Comprobar si el campo está vacío según su tipo
        if (campo.tagName === 'SELECT') {
            invalido = campo.value === '';
        } else if (campo.type === 'checkbox' || campo.type === 'radio') {
            invalido = !campo.checked;
        } else {
            invalido = campo.value.trim() === '';
        }
        
        if (invalido) {
            formValido = false;
            
            // Guardar el primer campo inválido para hacer scroll hasta él
            if (!primerCampoInvalido) {
                primerCampoInvalido = campo;
            }
            
            // Usando validación de Bootstrap
            campo.classList.add('is-invalid');
            
            // Buscar o crear el div de feedback para mensajes de error
            let feedbackDiv = campo.nextElementSibling;
            if (!feedbackDiv || !feedbackDiv.classList.contains('invalid-feedback')) {
                feedbackDiv = document.createElement('div');
                feedbackDiv.className = 'invalid-feedback';
                campo.parentNode.insertBefore(feedbackDiv, campo.nextSibling);
            }
            
            feedbackDiv.textContent = 'Este campo es obligatorio';
        } else {
            // Si es válido, marcar como válido
            campo.classList.remove('is-invalid');
            campo.classList.add('is-valid');
        }
    });
    
    // Si hay campos inválidos y se debe mostrar alerta
    if (primerCampoInvalido && mostrarAlerta) {
        primerCampoInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Mostrar alerta general usando Bootstrap
        const alertaExistente = document.querySelector('.alerta-validacion');
        if (alertaExistente) {
            alertaExistente.remove();
        }
        
        const alertaGeneral = document.createElement('div');
        alertaGeneral.className = 'alert alert-danger alert-dismissible fade show alerta-validacion';
        alertaGeneral.setAttribute('role', 'alert');
        alertaGeneral.innerHTML = `
            <strong>¡Atención!</strong> Por favor complete todos los campos obligatorios antes de continuar.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Insertar la alerta al principio del formulario
        form.insertBefore(alertaGeneral, form.firstChild);
        
        // Auto-cerrar la alerta después de 5 segundos
        setTimeout(() => {
            if (alertaGeneral.parentNode) {
                alertaGeneral.classList.remove('show');
                setTimeout(() => {
                    if (alertaGeneral.parentNode) {
                        alertaGeneral.remove();
                    }
                }, 500);
            }
        }, 5000);
    }
    
    return formValido;
}

// Función específica para validar al guardar
function validarCamposAlGuardar() {
    console.log('Validando campos al guardar...');
    return validarCamposRequeridos('form-principal', true);
}

// Función específica para validar al enviar (mantiene compatibilidad con código existente)
function validarCamposAlEnviar() {
    console.log('Validando campos al enviar...');
    return validarCamposRequeridos('form-principal', true);
}

// Función para interceptar los botones que abren modales y validar el formulario primero
function interceptarBotonesModal() {
    console.log('Configurando interceptación de botones de modal...');
    
    // Seleccionar todos los botones que abren modales
    const botonesModal = document.querySelectorAll('[data-bs-toggle="modal"]');
    
    botonesModal.forEach(boton => {
        // Solo interceptar botones que abren el modal de enviar o confirmar
        const targetModalId = boton.getAttribute('data-bs-target');
        if (targetModalId === '#enviar' || targetModalId === '#confirmar') {
            console.log(`Interceptando botón para modal: ${targetModalId}`);
            
            // Guardar el target original
            boton.setAttribute('data-modal-target', targetModalId);
            
            // Quitar el atributo que abre el modal automáticamente
            boton.removeAttribute('data-bs-toggle');
            boton.removeAttribute('data-bs-target');
            
            // Agregar nuestro event listener personalizado
            boton.addEventListener('click', function(event) {
                event.preventDefault();
                
                // Validar el formulario usando la función específica según el modal
                let esValido = false;
                
                if (targetModalId === '#enviar') {
                    esValido = validarCamposAlEnviar();
                } else if (targetModalId === '#confirmar') {
                    // Resaltar todos los campos requeridos antes de validar
                    resaltarCamposRequeridos('form-principal');
                    esValido = validarCamposAlGuardar();
                }
                
                if (esValido) {
                    // Si es válido, abrir el modal manualmente
                    const targetModal = document.querySelector(boton.getAttribute('data-modal-target'));
                    if (targetModal) {
                        const modal = new bootstrap.Modal(targetModal);
                        modal.show();
                    } else {
                        console.error(`Modal con selector ${boton.getAttribute('data-modal-target')} no encontrado`);
                    }
                } else {
                    console.log('Validación fallida, el modal no se abrirá');
                }
            });
        }
    });
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando validación Bootstrap...');
    
    // Añadir los estilos necesarios para la validación
    agregarEstilosValidacion();
    
    // Interceptar botones que abren modales
    interceptarBotonesModal();
    
    // También podemos agregar la validación para el envío del formulario completo
    const form = document.getElementById('form-principal');
    if (form) {
        form.addEventListener('submit', function(event) {
            if (!validarCamposAlEnviar()) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }
});

// Agregar estilos adicionales para mejorar la validación de Bootstrap
function agregarEstilosValidacion() {
    const style = document.createElement('style');
    style.textContent = `
        /* Asegurar que los mensajes de error sean visibles */
        .invalid-feedback {
            display: block;
            width: 100%;
            margin-top: 0.25rem;
            font-size: 0.875em;
            color: #dc3545;
        }
        
        /* Resaltar los campos con error */
        .was-validated .form-control:invalid,
        .form-control.is-invalid {
            border-color: #dc3545;
            padding-right: calc(1.5em + 0.75rem);
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right calc(0.375em + 0.1875rem) center;
            background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
        }
        
        /* Estilo para los campos válidos */
        .was-validated .form-control:valid,
        .form-control.is-valid {
            border-color: #198754;
            padding-right: calc(1.5em + 0.75rem);
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right calc(0.375em + 0.1875rem) center;
            background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
        }
        
        /* Ajustes para la alerta */
        .alerta-validacion {
            position: sticky;
            top: 0;
            z-index: 1050;
            margin-bottom: 1rem;
        }
        
        /* Estilo para campos requeridos */
        .required-field {
            position: relative;
        }
        
        .required-field::after {
            content: '*';
            color: #dc3545;
            position: absolute;
            top: 0;
            right: 10px;
            font-weight: bold;
        }
        
        /* Ajuste para campos select requeridos */
        select.required-field::after {
            right: 30px;
        }
    `;
    document.head.appendChild(style);
}

// Exportar funciones para uso global
window.validarCamposRequeridos = validarCamposRequeridos;
window.validarCamposAlGuardar = validarCamposAlGuardar;
window.validarCamposAlEnviar = validarCamposAlEnviar;
window.resaltarCamposRequeridos = resaltarCamposRequeridos;
