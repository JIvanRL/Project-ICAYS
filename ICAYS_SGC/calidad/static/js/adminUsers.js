document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    const btnEliminar = document.getElementById('btn-eliminar');
    const btnEditar = document.getElementById('btn-editar');
    const form = document.getElementById('form-usuarios');
    // Instancias de los modales de Bootstrap
    const modalSeleccion = new bootstrap.Modal(document.getElementById('modal-seleccion'));
    const modalConfirmacion = new bootstrap.Modal(document.getElementById('modal-confirmacion'));

    // Función para verificar el estado de los checkboxes
    function verificarSeleccion() {
        const seleccionados = document.querySelectorAll('.row-checkbox:checked');

        // Habilitar/deshabilitar botones
        btnEliminar.disabled = seleccionados.length === 0;
        btnEditar.disabled = seleccionados.length !== 1;
    }

    // Escuchar cambios en los checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', verificarSeleccion);
    });

    // Manejar clic en el botón de eliminar
    btnEliminar.addEventListener('click', function() {
        const seleccionados = document.querySelectorAll('.row-checkbox:checked');
        if (seleccionados.length === 0) {
            modalSeleccion.show();
        } else {
            modalConfirmacion.show();
        }
    });
    document.getElementById('btn-confirmar-eliminar').addEventListener('click', function() {
        // Crear un input oculto para la acción
        const inputAccion = document.createElement('input');
        inputAccion.type = 'hidden';
        inputAccion.name = 'accion';
        inputAccion.value = 'eliminar';
        form.appendChild(inputAccion);

        // Enviar el formulario
        form.submit();
    });


    btnEditar.addEventListener('click', function() {
        const seleccionados = document.querySelectorAll('.row-checkbox:checked');
        if (seleccionados.length === 0) {
            modalSeleccion.show();
        } else if (seleccionados.length > 1) {
            alert('Solo puedes editar un ítem a la vez.');
        } else {
            const usuarioID = seleccionados[0].value; // Obtener el ID del ítem seleccionado

            // Crear un input oculto para la acción
            const inputAccion = document.createElement('input');
            inputAccion.type = 'hidden';
            inputAccion.name = 'accion';
            inputAccion.value = 'editar';
            form.appendChild(inputAccion);

            // Crear un input oculto para el ID del ítem
            const inputItemId = document.createElement('input');
            inputItemId.type = 'hidden';
            inputItemId.name = 'item_id';
            inputItemId.value = usuarioID;
            form.appendChild(inputItemId);

            // Enviar el formulario
            form.submit();
        }
    });
});


    
