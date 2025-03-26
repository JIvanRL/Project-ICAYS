/**
 * Script para deshabilitar todos los campos del formulario excepto los botones específicos
 * Este script se debe cargar después de que el DOM esté completamente cargado
 */

document.addEventListener('DOMContentLoaded', function() {
    // Seleccionar todos los elementos de entrada del formulario
    const formInputs = document.querySelectorAll('input, select, textarea');
    
    // Deshabilitar todos los campos de entrada
    formInputs.forEach(function(input) {
        // Verificar si el elemento es un botón o está dentro de un botón
        const isButton = input.type === 'button' || 
                         input.type === 'submit' || 
                         input.type === 'reset' ||
                         input.closest('button');
        
        // Verificar si el elemento tiene la clase 'no-disable' (opcional, para excepciones específicas)
        const hasNoDisableClass = input.classList.contains('no-disable');
        
        // Verificar si es un campo oculto (hidden)
        const isHidden = input.type === 'hidden';
        
        // Si no es un botón y no tiene la clase de excepción, deshabilitar
        if (!isButton && !hasNoDisableClass && !isHidden) {
            input.disabled = true;
            
            // Agregar clase para estilo visual de deshabilitado (opcional)
            input.classList.add('disabled-field');
        }
    });
    
    // Habilitar específicamente los botones que necesitan seguir funcionando
    const buttonsToEnable = [
        'button[data-url]',                        // Botón "Regresar"
        '.enviar-custom',                          // Botón "Enviar"
        '.cancelar-custom',                        // Botón "Rechazar"
        '#toggleFormulario',                       // Botón para mostrar/ocultar contenido
        'button[data-bs-toggle="modal"]',          // Botones que abren modales
        'button[type="button"]'                    // Todos los botones de tipo button
    ];
    
    // Selector combinado para todos los botones que deben permanecer habilitados
    const buttonsSelector = buttonsToEnable.join(', ');
    const buttons = document.querySelectorAll(buttonsSelector);
    
    // Asegurarse de que los botones estén habilitados
    buttons.forEach(function(button) {
        button.disabled = false;
        button.classList.remove('disabled-field');
    });
    
    // Agregar estilo visual para campos deshabilitados
    const style = document.createElement('style');
    style.textContent = `
        .disabled-field {
            background-color: #f8f9fa;
            opacity: 0.8;
            cursor: not-allowed;
        }
        
        /* Mantener el estilo de los botones habilitados */
        button:not([disabled]), 
        input[type="button"]:not([disabled]), 
        input[type="submit"]:not([disabled]), 
        input[type="reset"]:not([disabled]) {
            cursor: pointer;
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
    
    // Opcional: Mostrar un mensaje indicando que el formulario está en modo de solo lectura
    const formElement = document.getElementById('form-principal');
    if (formElement) {
        const readOnlyMessage = document.createElement('div');
        readOnlyMessage.className = 'alert alert-info mt-2 mb-3';
        readOnlyMessage.innerHTML = '<i class="bi bi-info-circle"></i> Este formulario está en modo de solo lectura. Solo puede usar los botones de acción.';
        formElement.insertBefore(readOnlyMessage, formElement.firstChild);
    }
});