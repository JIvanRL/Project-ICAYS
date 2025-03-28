/**
 * Script para bloquear los elementos de entrada de datos en la página de revisión de bitácoras,
 * pero mantener funcionales todos los botones y la apariencia visual normal.
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando bloqueo de elementos de entrada para revisión...');
    
    // Bloquear solo los elementos de entrada de datos
    function bloquearElementosEntrada() {
        console.log('Bloqueando elementos de entrada para revisión...');
        
        // Obtener el formulario principal
        const form = document.getElementById('form-principal');
        if (!form) {
            console.error('No se encontró el formulario principal');
            return;
        }
        
        // Seleccionar solo los elementos de entrada de datos (no los botones)
        const elementosEntrada = form.querySelectorAll('input, select, textarea');
        console.log(`Encontrados ${elementosEntrada.length} elementos de entrada para deshabilitar`);
        
        // Deshabilitar todos los elementos de entrada
        elementosEntrada.forEach(element => {
            // Deshabilitar el elemento
            element.disabled = true;
            element.readOnly = true;
            
            // Para checkboxes y radios, también los hacemos no clickeables
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.style.pointerEvents = 'none';
                // También deshabilitar el label asociado
                if (element.id) {
                    const label = document.querySelector(`label[for="${element.id}"]`);
                    if (label) {
                        label.style.pointerEvents = 'none';
                    }
                }
            }
            
            // Solo cambiar el cursor para indicar que está deshabilitado
            // pero mantener los colores originales
            element.style.cursor = 'not-allowed';
        });
        
        // Agregar una clase al formulario para indicar visualmente que está bloqueado
        form.classList.add('formulario-bloqueado-parcial');
        
        // Verificar si ya existe un mensaje de bloqueo para no duplicarlo
        if (!document.querySelector('.mensaje-bloqueo')) {
            // Agregar un mensaje en la parte superior del formulario
            const mensajeBloqueo = document.createElement('div');
            mensajeBloqueo.className = 'alert alert-info mt-3 mensaje-bloqueo';
            mensajeBloqueo.innerHTML = '<strong>Formulario de solo lectura:</strong> Esta bitácora está en modo de revisión y los campos no pueden ser modificados.';
            form.prepend(mensajeBloqueo);
        }
        
        console.log('Elementos de entrada bloqueados exitosamente');
    }
    
    // Ejecutar la función de bloqueo
    bloquearElementosEntrada();
});