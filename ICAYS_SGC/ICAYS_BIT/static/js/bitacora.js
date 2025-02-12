// bitacora.js
document.addEventListener('DOMContentLoaded', function () {
    var addRowBtn = document.getElementById('add-row-btn'); // Botón para agregar filas
    var tableBody = document.getElementById('tabla-body'); // Cuerpo de la tabla

    // Función para agregar una fila
    addRowBtn.addEventListener('click', function () {
        var newRow = tableBody.rows[1].cloneNode(true); // Clonar la segunda fila (de inputs)
        tableBody.appendChild(newRow); // Añadir la nueva fila al cuerpo de la tabla
    });
});
