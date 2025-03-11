document.addEventListener('DOMContentLoaded', function () {
    console.log("✅ Script cargado.");

    // Botones y elementos de la tabla
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
                    hiddenInput.value = checkbox.value;
                } else {
                    hiddenInput.value = '0';
                }
            });
        });
    }

    // Configurar los checkboxes en las filas existentes al cargar la página
    const rows = document.querySelectorAll('#tabla-body tr');
    rows.forEach(row => {
        setupCheckboxes(row);
    });

    // Agregar una nueva fila
    addRowBtn.addEventListener('click', function() {
        const rowIndex = tableBody.getElementsByTagName('tr').length; // Índice de la nueva fila
        const newRow = document.createElement('tr');
    
        // Array con los nombres de los campos
        const campos = [
            'clave_c_m', 'cantidad_c_m', 'dE_1', 'dE_2', 'dE_3', 'dE_4',
            'placa_dD', 'placa_dD2', 'promedio_dD', 'placa_d',
            'placa_d2', 'promedio_d', 'placa_d_2', 'placa_d2_2',
            'promedio_d_2', 'resultado_r', 'ufC_placa_r', 'diferencia_r'
        ];
    
        // Crear las celdas de la fila
        campos.forEach((campo) => {
            const newCell = document.createElement('td');
    
            if (campo.startsWith('dE_')) {
                // Crear checkbox y hidden input para las diluciones
                const checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkboxInput.name = `${campo}_${rowIndex}`;
                checkboxInput.value = campo === 'dE_1' ? '1' : 
                                     campo === 'dE_2' ? '0.1' : 
                                     campo === 'dE_3' ? '0.01' : '0.001';
    
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = `${campo}_${rowIndex}`;
                hiddenInput.value = '0';
    
                newCell.appendChild(checkboxInput);
                newCell.appendChild(hiddenInput);
            } else {
                // Crear input de texto para los demás campos
                const textInput = document.createElement('input');
                textInput.type = 'text';
                textInput.name = `${campo}_${rowIndex}`;
    
                // Asignar clases específicas según el campo
                switch(campo) {
                    case 'placa_dD':
                        textInput.classList.add('placa1');
                        break;
                    case 'placa_dD2':
                        textInput.classList.add('placa2');
                        break;
                    case 'placa_d':
                        textInput.classList.add('placa3');
                        break;
                    case 'placa_d2':
                        textInput.classList.add('placa4');
                        break;
                    case 'placa_d_2':
                        textInput.classList.add('placa5');
                        break;
                    case 'placa_d2_2':
                        textInput.classList.add('placa6');
                        break;
                    case 'promedio_dD':
                        textInput.classList.add('promedio');
                        break;
                    case 'promedio_d':
                        textInput.classList.add('promedio2');
                        break;
                    case 'promedio_d_2':
                        textInput.classList.add('promedio3');
                        break;
                }
    
                newCell.appendChild(textInput);
            }
    
            newRow.appendChild(newCell);
        });
    
        // Añadir la nueva fila al cuerpo de la tabla
        tableBody.appendChild(newRow);
        removeRowBtn.disabled = false; // Habilitar el botón de eliminar fila
    
        // Configurar los checkboxes en la nueva fila
        setupCheckboxes(newRow);
        actualizarNumFilas();
    });
    

    // Eliminar la última fila
    removeRowBtn.addEventListener('click', function () {
        var rows = tableBody.getElementsByTagName('tr');

        // Si hay más de una fila, eliminar la última
        if (rows.length > 1) {
            tableBody.removeChild(rows[rows.length - 1]);
            actualizarNumFilas();
        }

        // Si solo queda una fila, deshabilitar el botón de eliminar
        if (rows.length === 1) {
            removeRowBtn.disabled = true;
        }
    });

    // Mostrar/ocultar contenido con el botón
    const toggleButton = document.getElementById("toggleFormulario");
    toggleButton.addEventListener("click", function () {
        console.log("🔘 Botón clickeado!");
        let formulario = document.getElementById("contenidoOculto");
        let icono = this.querySelector("i");

        if (formulario.classList.contains("oculto")) {
            formulario.classList.remove("oculto");
            icono.classList.remove("bi-arrow-down-circle");
            icono.classList.add("bi-arrow-up-circle");
        } else {
            formulario.classList.add("oculto");
            icono.classList.remove("bi-arrow-up-circle");
            icono.classList.add("bi-arrow-down-circle");
        }
    });

    // Calcular promedios al cambiar los valores de las placas
    document.addEventListener('input', function (event) {
        const fila = event.target.closest('tr');
        if (!fila) return;

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

// Función para actualizar el número de filas
function actualizarNumFilas() {
    const filas = document.querySelectorAll('#tabla-body tr');
    const numFilas = filas.length;
    document.getElementById('num_filas').value = numFilas;
    console.log('Número de filas actualizado:', numFilas);
    
    // Verificar los índices de las filas
    filas.forEach((fila, index) => {
        console.log(`Fila ${index + 1}: `, {
            clave: fila.querySelector('[name^="clave_c_m_"]')?.value,
            cantidad: fila.querySelector('[name^="cantidad_c_m_"]')?.value,
            dE_1: fila.querySelector('[name^="dE_1_"]')?.value,
            dE_2: fila.querySelector('[name^="dE_2_"]')?.value,
            dE_3: fila.querySelector('[name^="dE_3_"]')?.value,
            dE_4: fila.querySelector('[name^="dE_4_"]')?.value,
            placa_dD: fila.querySelector('[name^="placa_dD_"]')?.value,
            placa_dD2: fila.querySelector('[name^="placa_dD2_"]')?.value,
            promedio_dD: fila.querySelector('[name^="promedio_dD_"]')?.value,
            placa_d: fila.querySelector('[name^="placa_d_"]')?.value,
            placa_d2: fila.querySelector('[name^="placa_d2_"]')?.value,
            promedio_d: fila.querySelector('[name^="promedio_d_"]')?.value,
            placa_d_2: fila.querySelector('[name^="placa_d_2_"]')?.value,
            placa_d2_2: fila.querySelector('[name^="placa_d2_2_"]')?.value,
            promedio_d_2: fila.querySelector('[name^="promedio_d_2_"]')?.value,
            resultado_r: fila.querySelector('[name^="resultado_r_"]')?.value,
            ufC_placa_r: fila.querySelector('[name^="ufC_placa_r_"]')?.value,
            diferencia_r: fila.querySelector('[name^="diferencia_r_"]')?.value
        });
    });
}

export function recolectarDatosTabla() {
    const filas = [];  // Array para almacenar los datos de todas las filas

    $('#tabla-body tr').each(function(index) {
        const $fila = $(this);
        // Crear objeto con los datos de la fila actual
        const datosFila = {
            clave_c_m: $fila.find(`[name^="clave_c_m_"]`).val() || '',
            cantidad_c_m: $fila.find(`[name^="cantidad_c_m_"]`).val() || '',
            // Para los checkboxes, verificar si están marcados y convertir a números
            dE_1: $fila.find(`[name^="dE_1_"]:checked`).val() ? parseFloat($fila.find(`[name^="dE_1_"]:checked`).val()) : 0,
            dE_2: $fila.find(`[name^="dE_2_"]:checked`).val() ? parseFloat($fila.find(`[name^="dE_2_"]:checked`).val()) : 0,
            dE_3: $fila.find(`[name^="dE_3_"]:checked`).val() ? parseFloat($fila.find(`[name^="dE_3_"]:checked`).val()) : 0,
            dE_4: $fila.find(`[name^="dE_4_"]:checked`).val() ? parseFloat($fila.find(`[name^="dE_4_"]:checked`).val()) : 0,
            // Para los campos numéricos
            placa_dD: parseFloat($fila.find(`[name^="placa_dD_"]`).val()) || 0,
            placa_dD2: parseFloat($fila.find(`[name^="placa_dD2_"]`).val()) || 0,
            promedio_dD: parseFloat($fila.find(`[name^="promedio_dD_"]`).val()) || 0,
            placa_d: parseFloat($fila.find(`[name^="placa_d_"]`).val()) || 0,
            placa_d2: parseFloat($fila.find(`[name^="placa_d2_"]`).val()) || 0,
            promedio_d: parseFloat($fila.find(`[name^="promedio_d_"]`).val()) || 0,
            placa_d_2: parseFloat($fila.find(`[name^="placa_d_2_"]`).val()) || 0,
            placa_d2_2: parseFloat($fila.find(`[name^="placa_d2_2_"]`).val()) || 0,
            promedio_d_2: parseFloat($fila.find(`[name^="promedio_d_2_"]`).val()) || 0,
            resultado_r: parseFloat($fila.find(`[name^="resultado_r_"]`).val()) || 0,
            ufC_placa_r: parseFloat($fila.find(`[name^="ufC_placa_r_"]`).val()) || 0,
            diferencia_r: parseFloat($fila.find(`[name^="diferencia_r_"]`).val()) || 0
        };

        filas.push(datosFila);
    });

    return {
        filas: filas,
        num_filas: filas.length
    };
}
