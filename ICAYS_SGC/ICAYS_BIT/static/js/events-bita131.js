document.addEventListener('DOMContentLoaded', function () {
    console.log("✅ Script cargado.");
        // Función para agregar filas a la tabla
        var addRowBtn = document.getElementById('add-row-btn'); // Botón para agregar filas
        var removeRowBtn = document.getElementById('remove-row-btn'); // Botón para eliminar filas
        var tableBody = document.getElementById('tabla-body'); // Cuerpo de la tabla

        // Función para configurar los checkboxes
        function setupCheckboxes(row) {
            const checkboxes = row.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const hiddenInput = checkbox.nextElementSibling;
                    if (checkbox.checked) {
                        checkbox.dataset.value = checkbox.value;
                        hiddenInput.disabled = true;
                    } else {
                        checkbox.dataset.value = '0';
                        hiddenInput.disabled = false;
                    }
                });
            });
        }

        // Configurar los checkboxes en las filas existentes al cargar la página
        const rows = document.querySelectorAll('#tabla-body tr');
        rows.forEach(row => {
            setupCheckboxes(row);
        });

        addRowBtn.addEventListener('click', function() {
            var newRow = document.createElement('tr');

            // Array con los nombres de los campos
            var campos = [
                'clave_c_m[]', 'cantidad_c_m[]', 'dE_1[]', 'dE_2[]', 'dE_3[]', 'dE_4[]',
                'placa_dD[]', 'placa_dD2[]', 'promedio_dD[]', 'placa_d[]',
                'placa_d2[]', 'promedio_d[]', 'placa_d_2[]', 'placa_d2_2[]',
                'promedio_d_2[]', 'resultado_r[]', 'ufC_placa_r[]', 'diferencia_r[]'
            ];

            // Valores para los checkboxes (usando strings para mantener la precisión decimal)
            const dilucionesValues = {
                'dE_1': '1.0',
                'dE_2': '0.10',
                'dE_3': '0.010',
                'dE_4': '0.001'
            };

            // Crear las celdas de la fila
            campos.forEach((campo) => {
                var newCell = document.createElement('td');

                if (campo.startsWith('dE_')) {
                    // Crear checkbox y hidden input para las diluciones
                    var checkboxInput = document.createElement('input');
                    checkboxInput.type = 'checkbox';
                    checkboxInput.name = campo;
                    
                    // Obtener el valor con la precisión correcta
                    const baseValue = dilucionesValues[campo.replace('[]', '')];
                    checkboxInput.value = baseValue;
                    checkboxInput.dataset.value = baseValue;

                    var hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = campo;
                    
                    // Establecer el valor por defecto con la precisión correcta
                    const fieldNumber = campo.replace('dE_', '').replace('[]', '');
                    const decimals = fieldNumber === '1' ? '0.0' :
                                    fieldNumber === '2' ? '0.00' : '0.000';
                    hiddenInput.value = decimals;

                    newCell.appendChild(checkboxInput);
                    newCell.appendChild(hiddenInput);
                } else {
                    // Para los demás campos, crear input de texto normal
                    var textInput = document.createElement('input');
                    textInput.type = 'text';
                    textInput.name = campo;

                    // Asignar clases específicas según el campo
                    if (campo === 'placa_dD') {
                        textInput.classList.add('placa1');
                    } else if (campo === 'placa_dD2') {
                        textInput.classList.add('placa2');
                    } else if (campo === 'placa_d') {
                        textInput.classList.add('placa3');
                    } else if (campo === 'placa_d2') {
                        textInput.classList.add('placa4');
                    } else if (campo === 'placa_d_2') {
                        textInput.classList.add('placa5');
                    } else if (campo === 'placa_d2_2') {
                        textInput.classList.add('placa6');
                    } else if (campo === 'promedio_dD') {
                        textInput.classList.add('promedio');
                    } else if (campo === 'promedio_d') {
                        textInput.classList.add('promedio2');
                    } else if (campo === 'promedio_d_2') {
                        textInput.classList.add('promedio3');
                    }

                    newCell.appendChild(textInput);
                }

                newRow.appendChild(newCell);
            });

            // Añadir la nueva fila al cuerpo de la tabla
            tableBody.appendChild(newRow);
            removeRowBtn.disabled = false;

            // Configurar los checkboxes en la nueva fila
            setupCheckboxes(newRow);
        });

        // Modificar el event listener del formulario
        document.querySelector('form').addEventListener('submit', function(e) {
            e.preventDefault();

            // Preparar los datos de los checkboxes
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                const hiddenInput = checkbox.nextElementSibling;
                if (checkbox.checked) {
                    checkbox.dataset.value = checkbox.value;
                    hiddenInput.disabled = true;
                } else {
                    checkbox.dataset.value = '0';
                    hiddenInput.disabled = false;
                }
            });
        });


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

    // Funcionalidad para mostrar/ocultar contenido con el botón
    const toggleButton = document.getElementById("toggleFormulario");

    toggleButton.addEventListener("click", function () {
        console.log("🔘 Botón clickeado!");
        let formulario = document.getElementById("contenidoOculto");
        let icono = this.querySelector("i"); // Selecciona el ícono dentro del botón

        if (formulario.classList.contains("oculto")) {
            formulario.classList.remove("oculto");
            // Cambiar el ícono a una flecha hacia arriba (para ocultar)
            icono.classList.remove("bi-arrow-down-circle");
            icono.classList.add("bi-arrow-up-circle");
        } else {
            formulario.classList.add("oculto");
            // Cambiar el ícono a una flecha hacia abajo (para mostrar)
            icono.classList.remove("bi-arrow-up-circle");
            icono.classList.add("bi-arrow-down-circle");
        }
    });

    // Escuchar cambios en los inputs
    document.addEventListener('input', function (event) {
        // Obtener la fila actual donde se realizó el cambio
        const fila = event.target.closest('tr');
        if (!fila) return; // Salir si no hay fila encontrada

        // Calcular promedio1 (placa1 y placa2)
        if (event.target.classList.contains('placa1') || event.target.classList.contains('placa2')) {
            const placa1 = parseFloat(fila.querySelector('.placa1').value) || 0;
            const placa2 = parseFloat(fila.querySelector('.placa2').value) || 0;
            const promedio1 = (placa1 + placa2) / 2;
            fila.querySelector('.promedio').value = promedio1.toFixed(2);
        }

        // Calcular promedio2 (placa3 y placa4)
        if (event.target.classList.contains('placa3') || event.target.classList.contains('placa4')) {
            const placa3 = parseFloat(fila.querySelector('.placa3').value) || 0;
            const placa4 = parseFloat(fila.querySelector('.placa4').value) || 0;
            const promedio2 = (placa3 + placa4) / 2;
            fila.querySelector('.promedio2').value = promedio2.toFixed(2);
        }

        // Calcular promedio3 (placa5 y placa6)
        if (event.target.classList.contains('placa5') || event.target.classList.contains('placa6')) {
            const placa5 = parseFloat(fila.querySelector('.placa5').value) || 0;
            const placa6 = parseFloat(fila.querySelector('.placa6').value) || 0;
            const promedio3 = (placa5 + placa6) / 2;
            fila.querySelector('.promedio3').value = promedio3.toFixed(2);
        }
    });
});