document.addEventListener('DOMContentLoaded', function () {
    console.log("✅ Script cargado.");

    // Funcionalidad de redirección
    let buttons = document.querySelectorAll("[data-url]");
    console.log("🔍 Botones encontrados:", buttons.length);

    buttons.forEach(button => {
        console.log("🔹 Botón detectado:", button);

        button.addEventListener("click", function () {
            let url = button.getAttribute("data-url");
            console.log("➡ Redirigiendo a:", url);
            window.location.href = url;
        });
    });

    // Función para agregar filas a la tabla
    var addRowBtn = document.getElementById('add-row-btn'); // Botón para agregar filas
    var removeRowBtn = document.getElementById('remove-row-btn'); // Botón para eliminar filas
    var tableBody = document.getElementById('tabla-body'); // Cuerpo de la tabla

    addRowBtn.addEventListener('click', function () {
        // Crear la nueva fila
        var newRow = document.createElement('tr');

        // Array con los nombres de los campos (ajusta según tu tabla)
        var campos = [
            'clave', 'cantidad', 'dil1', 'dil2', 'dil3', 'dil4',
            'dir_placa1', 'dir_placa2', 'promedio1', 'dil_placa1',
            'dil_placa2', 'promedio2', 'dil_placa1_dup', 'dil_placa2_dup',
            'promedio3', 'resultado', 'ufc_placa', 'diferencia'
        ];

        // Crear las celdas de la fila
        campos.forEach((campo, index) => {
            var newCell = document.createElement('td');

            if (campo === 'ufc_placa') {
                // Celda para "UFC/placa" (editable en nuevas filas)
                var inputUFC = document.createElement('input');
                inputUFC.type = 'text';
                inputUFC.name = 'ufc_placa[]'; // Nombre del campo
                // inputUFC.readOnly = true; // Comentado para que sea editable
                newCell.appendChild(inputUFC);
            } else if (campo === 'resultado') {
                // Celda para "Resultado" (editable)
                var inputResultado = document.createElement('input');
                inputResultado.type = 'text';
                inputResultado.name = 'resultado[]'; // Nombre del campo
                newCell.appendChild(inputResultado);
            } else {
                // Para el resto de las celdas, creamos un input normal
                var input = document.createElement('input');
                input.type = 'text';
                input.name = `${campo}[]`; // Nombre del campo
                newCell.appendChild(input);
            }

            // Añadir la celda a la fila
            newRow.appendChild(newCell);
        });

        // Añadir la nueva fila al cuerpo de la tabla
        tableBody.appendChild(newRow);

         // Habilitar el botón de eliminar fila
         removeRowBtn.disabled = false;
    });

    // Hacer que la celda "UFC/placa" en la fila inicial sea no editable
    var filaBlanco = tableBody.querySelector('tr'); // Selecciona la primera fila (fila de "Blanco")
    if (filaBlanco) {
        var celdaUFC = filaBlanco.querySelector('input[name="ufc_placa[]"]'); // Selecciona el input de "UFC/placa"
        if (celdaUFC) {
            celdaUFC.readOnly = true; // Hacer que no sea editable
            celdaUFC.value = 'UFC/placa'; // Asignar el valor estático solo en la fila inicial
        }
    }
     // Función para eliminar la última fila
     removeRowBtn.addEventListener('click', function () {
        var rows = tableBody.getElementsByTagName('tr');
        
        // Si hay más de una fila (para no borrar la fila de "Blanco"), eliminar la última
        if (rows.length > 1) {
            tableBody.removeChild(rows[rows.length - 1]);
        }

        // Si solo queda la fila "Blanco", deshabilitar el botón de eliminar
        if (rows.length === 1) {
            removeRowBtn.disabled = true;
        }
    });
});