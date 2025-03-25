document.addEventListener('DOMContentLoaded', function () {
    console.log("✅ Script cargado.");

    // Botones y elementos de la tabla
    var addRowBtn = document.getElementById('add-row-btn'); // Botón para agregar filas
    var removeRowBtn = document.getElementById('remove-row-btn'); // Botón para eliminar filas
    var tableBody = document.getElementById('tabla-body'); // Cuerpo de la tabla

    // Mapeo de opciones de medición a valores de UFC/placa
    const medicionToUFC = {
        'Aguas': 'ml',
        'Alimentos': 'g',
        'Blancos': 'placa',
        'Inertes': ['100 cm²', 'cm²', 'piezas', '25cm²', 'pieza'],
        'Vivas': ['manos', 'mano']
    };

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

    // Función para hacer que los campos de promedio sean no editables
    function setPromedioFieldsReadOnly() {
        // Seleccionar todos los campos de promedio existentes y hacerlos readonly
        const promedioFields = document.querySelectorAll('.promedio, .promedio2, .promedio3');
        promedioFields.forEach(field => {
            field.setAttribute('readonly', true);
        });
    }

    // Función para actualizar el campo UFC/placa basado en la selección de medición
    function actualizarUFCPlaca(fila, medicionValue) {
        const ufcPlacaInput = fila.querySelector('[name^="ufC_placa_r_"]');
        if (!ufcPlacaInput) return;

        // Si la medición es Inertes o Vivas, crear un select
        if (medicionValue === 'Inertes' || medicionValue === 'Vivas') {
            // Verificar si ya existe un select
            let ufcSelect = fila.querySelector('.ufc-select');
            
            if (!ufcSelect) {
                // Crear un nuevo select
                ufcSelect = document.createElement('select');
                ufcSelect.classList.add('form-select', 'form-select-sm', 'ufc-select');
                
                // Agregar evento para actualizar el input original cuando cambie el select
                ufcSelect.addEventListener('change', function() {
                    // Aquí ya no añadimos el prefijo porque las opciones ya lo incluyen
                    ufcPlacaInput.value = this.value;
                });
                
                // Reemplazar el input con el select
                ufcPlacaInput.parentNode.insertBefore(ufcSelect, ufcPlacaInput);
                ufcPlacaInput.style.display = 'none';
            }
            
            // Limpiar opciones existentes
            ufcSelect.innerHTML = '';
            
            // Agregar opciones según la medición seleccionada
            const opciones = medicionToUFC[medicionValue];
            
            // Opción por defecto
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Seleccione...';
            ufcSelect.appendChild(defaultOption);
            
            // Agregar las opciones específicas con el prefijo "UFC/ " incluido
            opciones.forEach(opcion => {
                const option = document.createElement('option');
                option.value = "UFC/ " + opcion; // Incluir el prefijo en el valor
                option.textContent = "UFC/ " + opcion; // Incluir el prefijo en el texto mostrado
                ufcSelect.appendChild(option);
            });
            
            // Extraer el valor actual (que puede o no tener el prefijo)
            const valorActual = ufcPlacaInput.value;
            
            // Seleccionar la opción actual si existe
            if (valorActual) {
                // Buscar la opción que coincida con el valor actual
                const opciones = Array.from(ufcSelect.options);
                const opcionCoincidente = opciones.find(opt => opt.value === valorActual);
                
                if (opcionCoincidente) {
                    ufcSelect.value = valorActual;
                } else {
                    ufcSelect.selectedIndex = 0;
                }
            } else {
                ufcSelect.selectedIndex = 0;
            }
        } else {
            // Para otras mediciones, mostrar el valor directamente
            const ufcSelect = fila.querySelector('.ufc-select');
            if (ufcSelect) {
                // Si había un select, ocultarlo y mostrar el input
                ufcSelect.style.display = 'none';
                ufcPlacaInput.style.display = '';
            }
            
            // Asignar el valor correspondiente con el formato "UFC/ valor"
            const valorMedicion = medicionToUFC[medicionValue] || '';
            if (valorMedicion) {
                ufcPlacaInput.value = "UFC/ " + valorMedicion;
            } else {
                ufcPlacaInput.value = "";
            }
        }
    }

    // Función para copiar el valor de cantidad_c_m de la primera fila a todas las filas con clave_c_m
    function copiarCantidadDePrimeraFila() {
        const primeraFila = tableBody.querySelector('tr');
        if (!primeraFila) return;
        
        const cantidadPrimeraFila = primeraFila.querySelector('.cantidad-muestra');
        if (!cantidadPrimeraFila || !cantidadPrimeraFila.value) return;
        
        const todasLasFilas = tableBody.querySelectorAll('tr');
        
        // Empezar desde la segunda fila (índice 1)
        for (let i = 1; i < todasLasFilas.length; i++) {
            const fila = todasLasFilas[i];
            const claveInput = fila.querySelector('.clave-muestra');
            const cantidadInput = fila.querySelector('.cantidad-muestra');
            
            // Solo copiar a filas que tengan un valor en clave_c_m
            if (claveInput && cantidadInput && claveInput.value.trim() !== '') {
                cantidadInput.value = cantidadPrimeraFila.value;
            }
        }
    }

    // Configurar los checkboxes en las filas existentes al cargar la página
    const rows = document.querySelectorAll('#tabla-body tr');
    rows.forEach(row => {
        setupCheckboxes(row);
    });

    // Hacer que los campos de promedio sean no editables al cargar la página
    setPromedioFieldsReadOnly();

    // Agregar una nueva fila
    addRowBtn.addEventListener('click', function() {
        const rowIndex = tableBody.getElementsByTagName('tr').length; // Índice de la nueva fila
        const newRow = document.createElement('tr');
    
        // Array con los nombres de los campos
        const campos = [
            'clave_c_m', 'medicion_c_m', 'cantidad_c_m', 'dE_1', 'dE_2', 'dE_3', 'dE_4',
            'placa_dD', 'placa_dD2', 'promedio_dD', 'placa_d',
            'placa_d2', 'promedio_d', 'placa_d_2', 'placa_d2_2',
            'promedio_d_2', 'resultado_r', 'ufC_placa_r', 'diferencia_r'
        ];
    
        // Crear las celdas de la fila
        campos.forEach((campo) => {
            const newCell = document.createElement('td');

            if (campo.startsWith('dE_')) {
                // Código para los checkboxes de diluciones (sin cambios)
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
            } else if (campo === 'medicion_c_m') {
                // Crear un select para el campo medicion_c_m
                const selectInput = document.createElement('select');
                selectInput.name = `${campo}_${rowIndex}`;
                selectInput.classList.add('form-select', 'form-select-sm', 'medicion-select');
                
                // Agregar opciones al select
                const optionDefault = document.createElement('option');
                optionDefault.value = '';
                optionDefault.textContent = 'Seleccione...';
                selectInput.appendChild(optionDefault);
                
                // Agregar opciones de medición
                Object.keys(medicionToUFC).forEach(opcion => {
                    const optionElement = document.createElement('option');
                    optionElement.value = opcion;
                    optionElement.textContent = opcion;
                    selectInput.appendChild(optionElement);
                });
                
                // Agregar evento para actualizar UFC/placa cuando cambie la medición
                selectInput.addEventListener('change', function() {
                    actualizarUFCPlaca(newRow, this.value);
                });
                
                newCell.appendChild(selectInput);
            } else {
                // Crear input de texto para los demás campos
                const textInput = document.createElement('input');
                textInput.type = 'text';
                textInput.name = `${campo}_${rowIndex}`;
    
                // Asignar clases específicas según el campo
                switch(campo) {
                    case 'clave_c_m':
                        textInput.classList.add('clave-muestra');
                        break;
                    case 'cantidad_c_m':
                        textInput.classList.add('cantidad-muestra');
                        break;
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
                        textInput.setAttribute('readonly', true); // Hacer el campo no editable
                        break;
                    case 'promedio_d':
                        textInput.classList.add('promedio2');
                        textInput.setAttribute('readonly', true); // Hacer el campo no editable
                        break;
                    case 'promedio_d_2':
                        textInput.classList.add('promedio3');
                        textInput.setAttribute('readonly', true); // Hacer el campo no editable
                        break;
                    case 'ufC_placa_r':
                        textInput.classList.add('ufc-placa');
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
        
        // Copiar el valor de cantidad_c_m de la primera fila a la nueva fila
        copiarCantidadDePrimeraFila();
        
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
    if (toggleButton) {
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
    }

    // Calcular promedios y manejar eventos de input
    document.addEventListener('input', function (event) {
        const fila = event.target.closest('tr');
        if (!fila) return;

        // Función para formatear el promedio con >250 o valor** si está fuera del rango 25-250
        function formatearPromedio(valor) {
            // Redondear según la regla estándar: .5 o mayor hacia arriba, menor que .5 hacia abajo
            const valorRedondeado = Math.round(valor);
            
            console.log(`Valor original: ${valor}, Valor redondeado: ${valorRedondeado}`); // Para depuración
            
            if (valorRedondeado > 250) {
                return ">250";
            } else if (valorRedondeado < 25) {
                return valorRedondeado + "**";
            } else {
                return valorRedondeado.toString();
            }
        }

        // Calcular promedio1 (placa1 y placa2)
        if (event.target.classList.contains('placa1') || event.target.classList.contains('placa2')) {
            const placa1 = parseFloat(fila.querySelector('.placa1').value) || 0;
            const placa2 = parseFloat(fila.querySelector('.placa2').value) || 0;
            const promedio1 = (placa1 + placa2) / 2;
            fila.querySelector('.promedio').value = formatearPromedio(promedio1);
        }

        // Calcular promedio2 (placa3 y placa4)
        if (event.target.classList.contains('placa3') || event.target.classList.contains('placa4')) {
            const placa3 = parseFloat(fila.querySelector('.placa3').value) || 0;
            const placa4 = parseFloat(fila.querySelector('.placa4').value) || 0;
            const promedio2 = (placa3 + placa4) / 2;
            fila.querySelector('.promedio2').value = formatearPromedio(promedio2);
        }

        // Calcular promedio3 (placa5 y placa6)
        if (event.target.classList.contains('placa5') || event.target.classList.contains('placa6')) {
            const placa5 = parseFloat(fila.querySelector('.placa5').value) || 0;
            const placa6 = parseFloat(fila.querySelector('.placa6').value) || 0;
            const promedio3 = (placa5 + placa6) / 2;
            fila.querySelector('.promedio3').value = formatearPromedio(promedio3);
        }
        
        // Manejar cambios en el select de medición
        if (event.target.classList.contains('medicion-select')) {
            actualizarUFCPlaca(fila, event.target.value);
        }
        
        // Manejar la copia de cantidad_c_m cuando se modifica clave_c_m
        if (event.target.classList.contains('clave-muestra')) {
            // Si se está escribiendo en clave_c_m en una fila que no es la primera
            const filaActual = event.target.closest('tr');
            const primeraFila = tableBody.querySelector('tr');
            
            // Solo si no es la primera fila y la clave tiene algún valor
            if (primeraFila && filaActual !== primeraFila && event.target.value.trim() !== '') {
                const cantidadPrimeraFila = primeraFila.querySelector('.cantidad-muestra');
                const cantidadFilaActual = filaActual.querySelector('.cantidad-muestra');
                
                // Copiar el valor si la primera fila tiene un valor
                if (cantidadPrimeraFila && cantidadPrimeraFila.value && cantidadFilaActual) {
                    cantidadFilaActual.value = cantidadPrimeraFila.value;
                }
            }
        }
        
        // Si se modifica cantidad_c_m en la primera fila, copiar a todas las demás filas con clave
        if (event.target.classList.contains('cantidad-muestra')) {
            const filaActual = event.target.closest('tr');
            const primeraFila = tableBody.querySelector('tr');
            
            // Solo si es la primera fila la que se está modificando
            if (primeraFila && filaActual === primeraFila) {
                copiarCantidadDePrimeraFila();
            }
        }
    });
    
    // Configurar los selects de medición existentes
    document.querySelectorAll('.medicion-select').forEach(select => {
        select.addEventListener('change', function() {
            actualizarUFCPlaca(this.closest('tr'), this.value);
        });
        
        // Actualizar UFC/placa con el valor actual del select
        if (select.value) {
            actualizarUFCPlaca(select.closest('tr'), select.value);
        }
    });
    
    // Agregar las clases a los inputs existentes al cargar la página
    document.querySelectorAll('[name^="clave_c_m_"]').forEach(input => {
        input.classList.add('clave-muestra');
    });
    
    document.querySelectorAll('[name^="cantidad_c_m_"]').forEach(input => {
        input.classList.add('cantidad-muestra');
    });
    
    document.querySelectorAll('[name^="ufC_placa_r_"]').forEach(input => {
        input.classList.add('ufc-placa');
    });
});

// Función para actualizar el número de filas
function actualizarNumFilas() {
    const filas = document.querySelectorAll('#tabla-body tr');
    const numFilas = filas.length;
    document.getElementById('num_filas').value = numFilas;
    console.log('Número de filas actualizado:', numFilas);
}

//fuction para recolectar los datos de las filas dinamicas
export function recolectarDatosTabla() {
    const filas = [];  // Array para almacenar los datos de todas las filas

    $('#tabla-body tr').each(function(index) {
        const $fila = $(this);
        
        // Función auxiliar para convertir valores a números o 0
        const toNumber = (value) => {
            if (value === '' || value === null || value === undefined) {
                return 0;
            }
            
            // Manejar valores especiales
            if (value === ">250") {
                return 250;
            } else if (value === "<25") {
                return 25;
            }
            
            // Eliminar los asteriscos si existen (por compatibilidad con datos antiguos)
            const cleanValue = String(value).replace(/\*+$/, '');
            const num = parseFloat(cleanValue);
            return isNaN(num) ? 0 : num;
        };
        
        // Función auxiliar para redondear a enteros
        const toInteger = (value) => {
            return Math.round(toNumber(value));
        };
        
        // Función para obtener el valor original (con formato especial)
        const getOriginalValue = (selector) => {
            return $fila.find(selector).val() || '0';
        };
        
        // Crear objeto con los datos de la fila actual
        const datosFila = {
            clave_c_m: $fila.find(`[name^="clave_c_m_"]`).val() || '',
            cantidad_c_m: $fila.find(`[name^="cantidad_c_m_"]`).val() || '',
            // Para los checkboxes, verificar si están marcados y convertir a números
            dE_1: $fila.find(`[name^="dE_1_"]:checked`).val() ? toNumber($fila.find(`[name^="dE_1_"]:checked`).val()) : 0,
            dE_2: $fila.find(`[name^="dE_2_"]:checked`).val() ? toNumber($fila.find(`[name^="dE_2_"]:checked`).val()) : 0,
            dE_3: $fila.find(`[name^="dE_3_"]:checked`).val() ? toNumber($fila.find(`[name^="dE_3_"]:checked`).val()) : 0,
            dE_4: $fila.find(`[name^="dE_4_"]:checked`).val() ? toNumber($fila.find(`[name^="dE_4_"]:checked`).val()) : 0,
            // Para los campos numéricos
            placa_dD: toNumber($fila.find(`[name^="placa_dD_"]`).val()),
            placa_dD2: toNumber($fila.find(`[name^="placa_dD2_"]`).val()),
            // Para los promedios, guardar el valor numérico pero mantener el formato original
            promedio_dD: toInteger($fila.find(`[name^="promedio_dD_"]`).val()),
            promedio_dD_original: getOriginalValue(`[name^="promedio_dD_"]`),
            placa_d: toNumber($fila.find(`[name^="placa_d_"]`).val()),
            placa_d2: toNumber($fila.find(`[name^="placa_d2_"]`).val()),
            promedio_d: toInteger($fila.find(`[name^="promedio_d_"]`).val()),
            promedio_d_original: getOriginalValue(`[name^="promedio_d_"]`),
            placa_d_2: toNumber($fila.find(`[name^="placa_d_2_"]`).val()),
            placa_d2_2: toNumber($fila.find(`[name^="placa_d2_2_"]`).val()),
            promedio_d_2: toInteger($fila.find(`[name^="promedio_d_2_"]`).val()),
            promedio_d_2_original: getOriginalValue(`[name^="promedio_d_2_"]`),
            // Estos campos pueden ser texto o número según tu necesidad
            resultado_r: $fila.find(`[name^="resultado_r_"]`).val() || '0',
            ufC_placa_r: $fila.find(`[name^="ufC_placa_r_"]`).val() || '0',
            diferencia_r: $fila.find(`[name^="diferencia_r_"]`).val() || '0'
        };

        filas.push(datosFila);
    });

    return {
        filas: filas,
        num_filas: filas.length
    };
}