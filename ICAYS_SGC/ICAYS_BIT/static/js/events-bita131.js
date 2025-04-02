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
            checkbox.addEventListener('change', function () {
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
        const cantidadInput = fila.querySelector('[name^="cantidad_c_m_"]'); // Obtener el campo de cantidad
        
        if (!ufcPlacaInput) return;

        // Actualizar el campo de cantidad según la medición seleccionada
        if (cantidadInput) {
            switch (medicionValue) {
                case 'Aguas':
                    cantidadInput.value = '1 ml';
                    break;
                case 'Alimentos':
                    cantidadInput.value = '10 g';
                    break;
                case 'Blancos':
                    cantidadInput.value = 'placa';
                    break;
                case 'Inertes':
                    cantidadInput.value = '1 ml';
                    break;
                case 'Vivas':
                    cantidadInput.value = '1 ml';
                    break;
            }
        }

        // Si la medición es Inertes o Vivas, crear un select
        if (medicionValue === 'Inertes' || medicionValue === 'Vivas') {
            // Verificar si ya existe un select
            let ufcSelect = fila.querySelector('.ufc-select');

            if (!ufcSelect) {
                // Crear un nuevo select
                ufcSelect = document.createElement('select');
                ufcSelect.classList.add('form-select', 'form-select-sm', 'ufc-select');

                // Agregar evento para actualizar el input original cuando cambie el select
                ufcSelect.addEventListener('change', function () {
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
    addRowBtn.addEventListener('click', function () {
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

                newCell.appendChild(checkboxInput); /////////////////aqui me quede leyendo
                newCell.appendChild(hiddenInput);   ////// aqui mas abajo
            } else if (campo === 'medicion_c_m') {          // estaba checando como hacerle para que automaticamente se ponga 1ml o 10g
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
                selectInput.addEventListener('change', function () {
                    actualizarUFCPlaca(newRow, this.value);
                });

                newCell.appendChild(selectInput);
            } else {
                // Crear input de texto para los demás campos
                const textInput = document.createElement('input');
                textInput.type = 'text';
                textInput.name = `${campo}_${rowIndex}`;

                // Asignar clases específicas según el campo
                switch (campo) {
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
                    case 'resultado_r':
                        textInput.classList.add('resultadoF');
                        textInput.setAttribute('readonly', true); // Hacer el campo no editable
                        break;
                    case 'ufC_placa_r':
                        textInput.classList.add('ufc-placa');
                        break;
                    case 'diferencia_r':
                        textInput.classList.add('diferencia');
                        textInput.setAttribute('readonly', true); // Hacer el campo no editable
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

        if (event.target.matches('.placa1, .placa2, .placa3, .placa4, .placa5, .placa6, input[type="checkbox"], .medicion-select')) {
            ResultadoCalculo(fila);
            calcularDiferenciaEntreDuplicados(fila);
        }


    });

    // Asegurar que los campos de resultado sean readonly
    document.querySelectorAll('[name^="resultado_r_"]').forEach(input => {
        input.setAttribute('readonly', true);
    });

    // Configurar los selects de medición existentes
    document.querySelectorAll('.medicion-select').forEach(select => {
        select.addEventListener('change', function () {
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

    document.querySelectorAll('[name^="diferencia_r_"]').forEach(input => {
        input.classList.add('diferencia');
        input.setAttribute('readonly', true);
    });

    // function ResultadoCalculo(fila) {
    //     const resultadoInput = fila.querySelector('[name^="resultado_r_"]');
    //     if (!resultadoInput) return;

    //     // Obtener la medición seleccionada
    //     const medicionSelect = fila.querySelector('.medicion-select');
    //     const medicionValue = medicionSelect ? medicionSelect.value : '';

    //     // Verificar si hay medición seleccionada
    //     if (!medicionValue) {
    //         mostrarModal('Advertencia', 'No se ha seleccionado ninguna medición.');
    //         resultadoInput.value = '0**';
    //         return;
    //     }

    //     // Obtener estado de los checkboxes de dilución
    //     const dE1 = fila.querySelector('[name^="dE_1_"]:checked');
    //     const dE2 = fila.querySelector('[name^="dE_2_"]:checked');
    //     const dE3 = fila.querySelector('[name^="dE_3_"]:checked');
    //     const dE4 = fila.querySelector('[name^="dE_4_"]:checked');

    //     // Obtener los tres promedios
    //     const promedio1 = parseFloat(fila.querySelector('.promedio').value.replace('**', '')) || 0;
    //     const promedio2 = parseFloat(fila.querySelector('.promedio2').value.replace('**', '')) || 0;
    //     const promedio3 = parseFloat(fila.querySelector('.promedio3').value.replace('**', '')) || 0;

    //     // Determinar qué promedio usar (prioridad: 1 > 2 > 3)
    //     let promedioSeleccionado = 0;
    //     if (promedio1 >= 25 && promedio1 <= 250) {
    //         promedioSeleccionado = promedio1;
    //     } else if (promedio2 >= 25 && promedio2 <= 250) {
    //         promedioSeleccionado = promedio2;
    //     } else if (promedio3 >= 25 && promedio3 <= 250) {
    //         promedioSeleccionado = promedio3;
    //     } else {
    //         // Si ningún promedio está en rango, usar el mayor
    //         promedioSeleccionado = Math.max(promedio1, promedio2, promedio3);
    //     }

    //     // Para mediciones que requieren volumen (Vm)
    //     const requiereVm = ['Vivas', 'Inertes', 'Blancos'].includes(medicionValue);
    //     let vm = 1; // Valor por defecto

    //     if (requiereVm) {
    //         // Verificar si ya tenemos Vm almacenado en la fila
    //         if (!fila.dataset.vm) {
    //             mostrarModalVolumen((vmInput) => {
    //                 if (vmInput && !isNaN(vmInput)) {
    //                     fila.dataset.vm = vmInput;
    //                     calcularResultadoFinal();
    //                 } else {
    //                     resultadoInput.value = '0**';
    //                 }
    //             });
    //             return; // Salir temporalmente hasta que se ingrese Vm
    //         } else {
    //             vm = parseFloat(fila.dataset.vm);
    //         }
    //     }

    //     calcularResultadoFinal();

    //     function calcularResultadoFinal() {
    //         let resultado = 0;
    //         let factorDilucion = 1; // Valor por defecto

    //         // Determinar el factor de dilución basado en los checkboxes marcados
    //         if (dE1) {
    //             factorDilucion = 1;
    //         } else if (dE2) {
    //             factorDilucion = 0.1;
    //         } else if (dE3) {
    //             factorDilucion = 0.01;
    //         } else if (dE4) {
    //             factorDilucion = 0.001;
    //         } else {
    //             // Ninguna dilución seleccionada
    //             resultadoInput.value = '0**';
    //             return;
    //         }

    //         // Calcular el resultado según el tipo de medición
    //         if (medicionValue === 'Alimentos' || medicionValue === 'Aguas') {
    //             resultado = promedioSeleccionado / factorDilucion;
    //         } else {
    //             resultado = (promedioSeleccionado / factorDilucion) * vm;
    //         }

    //         // Asignar el resultado formateado
    //         resultadoInput.value = resultado > 0 ? formatearResultado(resultado) : '0**';
        
    //         // Calcular la diferencia entre duplicados después de asignar el resultado
    //         calcularDiferenciaEntreDuplicados(fila);
    //     }
    // }
    function ResultadoCalculo(fila) {
        const resultadoInput = fila.querySelector('[name^="resultado_r_"]');
        let r1 = 0, r2 = 0, r3 = 0, resultado = 0, VMH = 0;
        if (!resultadoInput) return;

        // Obtener la medición seleccionada
        const medicionSelect = fila.querySelector('.medicion-select');
        const medicionValue = medicionSelect ? medicionSelect.value : '';

        // Obtener estado y valores de los checkboxes de dilución
        const dE1 = fila.querySelector('[name^="dE_1_"]:checked');
        const dE2 = fila.querySelector('[name^="dE_2_"]:checked');
        const dE3 = fila.querySelector('[name^="dE_3_"]:checked');
        const dE4 = fila.querySelector('[name^="dE_4_"]:checked');

        // Obtener los tres promedios
        const promedio1 = parseFloat(fila.querySelector('.promedio').value) || 0;
        const promedio2 = parseFloat(fila.querySelector('.promedio2').value) || 0;
        const promedio3 = parseFloat(fila.querySelector('.promedio3').value) || 0;


        // Verificar si hay medición seleccionada
        if (!medicionValue) {
            mostrarModal('Advertencia', 'No se ha seleccionado ninguna medición.');
            resultadoInput.value = '0**';
            return;
        }


        //Para mediciones que requieren volumen (Vm)
        const requiereVm = ['Vivas', 'Inertes', 'Blancos'].includes(medicionValue);
        let vm = 1; // Valor por defecto

        // Si requiere Vm y no está almacenado, mostrar modal
        if (requiereVm && !fila.dataset.vm) {
            mostrarModalVolumen((vmInput) => {
                if (vmInput && !isNaN(vmInput)) {
                    fila.dataset.vm = vmInput; // Almacenar Vm en la fila
                    calcularResultadoFinal(); // Recalcular con el nuevo Vm
                } else {
                    resultadoInput.value = '0**'; // Valor inválido
                }
            });
            return; // Salir hasta que se ingrese Vm
        } else if (requiereVm) {
            vm = parseFloat(fila.dataset.vm); // Usar Vm almacenado
        }


        if (promedio1 >= 5 && promedio1 <= 250 && promedio2 >= 5 && promedio2 <= 250 && promedio3 >= 5 && promedio1 <= 250) {
            if (medicionValue === 'Alimentos' || medicionValue === 'Aguas') {
                if (dE1 && dE2 && dE3) {
                    r1 = promedio1 / 1;
                    r2 = promedio2 / 0.1;
                    r3 = promedio3 / 0.01;
                    resultado = (r1 + r2 + r3) / 3;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE1 && dE2 && dE4) {
                    r1 = promedio1 / 1;
                    r2 = promedio2 / 0.1;
                    r3 = promedio3 / 0.001;
                    resultado = (r1 + r2 + r3) / 3;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE1 && dE3 && dE4) {
                    r1 = promedio1 / 1;
                    r2 = promedio2 / 0.01;
                    r3 = promedio3 / 0.001;
                    resultado = (r1 + r2 + r3) / 3;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE2 && dE3 && dE4) {
                    r1 = promedio1 / 0.1;
                    r2 = promedio2 / 0.01;
                    r3 = promedio3 / 0.001;
                    resultado = (r1 + r2 + r3) / 3;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                }
            } else if (medicionValue === 'Vivas' || medicionValue === 'Blancos' || medicionValue === 'Inertes') {
                if (dE1 && dE2 && dE3) {
                    r1 = (promedio1 / 1) * vm;
                    r2 = (promedio2 / 0.1) * vm;
                    r3 = (promedio3 / 0.01) * vm;
                    resultado = (r1 + r2 + r3) / 3;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE1 && dE2 && dE4) {
                    r1 = (promedio1 / 1) * vm;
                    r2 = (promedio2 / 0.1) * vm;
                    r3 = (promedio3 / 0.001) * vm;
                    resultado = (r1 + r2 + r3) / 3;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE1 && dE3 && dE4) {
                    r1 = (promedio1 / 1) * vm;
                    r2 = (promedio2 / 0.01) * vm;
                    r3 = (promedio3 / 0.001) * vm;
                    resultado = (r1 + r2 + r3) / 3;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE2 && dE3 && dE4) {
                    r1 = (promedio1 / 0.1) * vm;
                    r2 = (promedio2 / 0.01) * vm;
                    r3 = (promedio3 / 0.001) * vm;
                    resultado = (r1 + r2 + r3) / 3;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                }
            }
        }   ///////////////////// Dos promedios (promedio 1 y 2)///////////////////////////////
        else if (promedio1 >= 5 && promedio1 <= 250 && promedio2 >= 5 && promedio2 <= 250) {
            if (medicionValue === 'Alimentos' || medicionValue === 'Aguas') {
                if (dE1 && dE2) {
                    r1 = promedio1 / 1;
                    r2 = promedio2 / 0.1;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE1 && dE3) {
                    r1 = promedio1 / 1;
                    r2 = promedio2 / 0.01;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE2 && dE3) {
                    r1 = promedio1 / 0.1;
                    r2 = promedio2 / 0.01;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE3 && dE4) {
                    r1 = promedio1 / 0.01;
                    r2 = promedio2 / 0.001;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                }
            } else if (medicionValue === 'Vivas' || medicionValue === 'Blancos' || medicionValue === 'Inertes') {
                if (dE1 && dE2) {
                    r1 = promedio1 / 1 * vm;
                    r2 = promedio2 / 0.1 * vm;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE1 && dE3) {
                    r1 = promedio1 / 1 * vm;
                    r2 = promedio2 / 0.01 * vm;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE2 && dE3) {
                    r1 = promedio1 / 0.1 * vm;
                    r2 = promedio2 / 0.01 * vm;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE3 && dE4) {
                    r1 = promedio1 / 0.01 * vm;
                    r2 = promedio2 / 0.001 * vm;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                }
            } ///////////////////// Dos promedios (1 y 3) /////////////////////////////////
        } else if (promedio1 >= 5 && promedio1 <= 250 && promedio3 >= 5 && promedio3 <= 250) {
            if (medicionValue === 'Alimentos' || medicionValue === 'Aguas') {
                if (dE1 && dE2 && dE3) {
                    r1 = promedio1 / 1;
                    r2 = promedio3 / 0.01;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE1 && dE3 && dE4) {
                    r1 = promedio1 / 1;
                    r2 = promedio3 / 0.001;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE2 && dE3 && dE4) {
                    r1 = promedio1 / 0.1;
                    r2 = promedio3 / 0.001;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                }
            } else if (medicionValue === 'Vivas' || medicionValue === 'Blancos' || medicionValue === 'Inertes') {
                if (dE1 && dE2 && dE3) {
                    r1 = promedio1 / 1 * vm;
                    r2 = promedio3 / 0.01 * vm;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE1 && dE3 && dE4) {
                    r1 = promedio1 / 1 * vm;
                    r2 = promedio3 / 0.001 * vm;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE2 && dE3 && dE4) {
                    r1 = promedio1 / 0.1 * vm;
                    r2 = promedio3 / 0.001 * vm;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                }
            }
            //////////////////////////Dos promedios (2 y 3)//////////////////////////
        } else if (promedio2 >= 5 && promedio2 <= 250 && promedio3 >= 5 && promedio3 <= 250) {
            if (medicionValue === 'Alimentos' || medicionValue === 'Aguas') {
                if (dE1 && dE2 && dE3) {
                    r1 = promedio2 / 0.1;
                    r2 = promedio3 / 0.01;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE1 && dE3 && dE4) {
                    r1 = promedio2 / 0.01;
                    r2 = promedio3 / 0.001;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE2 && dE3 && dE4) {
                    r1 = promedio2 / 0.01;
                    r2 = promedio3 / 0.001;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                }
            } else if (medicionValue === 'Vivas' || medicionValue === 'Blancos' || medicionValue === 'Inertes') {
                if (dE1 && dE2 && dE3) {
                    r1 = promedio2 / 0.1 * vm;
                    r2 = promedio3 / 0.01 * vm;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE1 && dE3 && dE4) {
                    r1 = promedio2 / 0.01 * vm;
                    r2 = promedio3 / 0.001 * vm;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE2 && dE3 && dE4) {
                    r1 = promedio1 / 0.01 * vm;
                    r2 = promedio3 / 0.001 * vm;
                    resultado = (r1 + r2) / 2;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                }
            }
            //////////////////////////Promedio numero 1 //////////////////////////
        } else if (promedio1 >= 5 && promedio1 <= 250 || promedio1 > promedio2 && promedio1 > promedio3) {
            if (medicionValue === 'Alimentos' || medicionValue === 'Aguas') {
                if (dE1) {
                    resultado = promedio1 / 1;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE2) {
                    resultado = promedio1 / 0.1;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE3) {
                    resultado = promedio1 / 0.01;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE4) {
                    resultado = promedio1 / 0.001;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                }
            } else if (medicionValue === 'Vivas' || medicionValue === 'Blancos' || medicionValue === 'Inertes') {
                if (dE1) {
                    resultado = (promedio1 / 1) * vm;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE2) {
                    resultado = (promedio1 / 0.1) * vm;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE3) {
                    resultado = (promedio1 / 0.01) * vm;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                } else if (dE4) {
                    resultado = (promedio1 / 0.001) * vm;
                    resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                    return;
                }
            }
        }
        /////////////////////////////////////////
        //           Promedio numero 2        //
        /////////////////////////////////////////
        if (promedio2 >= 5 && promedio2 <= 250 || promedio2 > promedio1 && promedio2 > promedio3) {
            if (medicionValue === 'Alimentos' || medicionValue === 'Aguas') {
                if (dE1) {
                    if (dE2) {
                        resultado = promedio2 / 0.1;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    } else if (dE3) {
                        resultado = promedio2 / 0.01;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    } else if (dE4) {
                        resultado = promedio2 / 0.001;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    }
                } else if (dE2) {
                    if (dE3) {
                        resultado = promedio2 / 0.01;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    } else if (dE4) {
                        resultado = promedio2 / 0.001;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    }
                } else if (dE3) {
                    if (dE4) {
                        resultado = promedio2 / 0.001;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    }
                } else if (dE4) {
                    resultado = '0**';
                    resultadoInput.value = resultado;
                    return;
                }
            } else if (medicionValue === 'Vivas' || medicionValue === 'Blancos' || medicionValue === 'Inertes') {
                if (dE1) {
                    if (dE2) {
                        resultado = (promedio2 / 0.1) * vm;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    } else if (dE3) {
                        resultado = (promedio2 / 0.01) * vm;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    } else if (dE4) {
                        resultado = (promedio2 / 0.001) * vm;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    }
                } else if (dE2) {
                    if (dE3) {
                        resultado = (promedio2 / 0.01) * vm;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    } else if (dE4) {
                        resultado = (promedio2 / 0.001) * vm;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    }
                } else if (dE3) {
                    if (dE4) {
                        resultado = (promedio2 / 0.001) * vm;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    }
                    return;
                } else if (dE4) {
                    resultado = '0**';
                    resultadoInput.value = resultado;
                    return;
                }
            }
        }
        /////////////////////////////////////////
        //           Promedio numero 3         //
        /////////////////////////////////////////
        if (promedio3 >= 5 && promedio3 <= 250 || promedio3 > promedio1 && promedio3 > promedio2) {
            if (medicionValue === 'Alimentos' || medicionValue === 'Aguas') {
                if (dE1) {
                    if (dE2) {
                        if (dE3) {
                            resultado = promedio3 / 0.01;
                            resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                            return;
                        } else if (dE4) {
                            resultado = promedio3 / 0.001;
                            resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                            return;
                        } else {
                            resultado = '0**';
                            resultadoInput.value = resultado;
                            return;
                        }
                    }
                } else if (dE2) {
                    if (dE3) {
                        if (dE4) {
                            resultado = promedio3 / 0.001;
                            resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                            return;
                        } else {
                            resultado = '0**';
                            resultadoInput.value = resultado;
                            return;
                        }
                    }
                }else if(dE3) 
                    {
                        resultado = promedio3 / 0.01;
                        resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                        return;
                    }
                    else if(dE4) 
                        {
                            resultado = promedio3 / 0.001;
                            resultadoInput.value = resultado > 0 ? redondearNumero(resultado) : '0**';
                            return;
                        }
                else {
                    resultado = '0**';
                    resultadoInput.value = resultado;
                    return;
                }
            } else if (medicionValue === 'Vivas' || medicionValue === 'Blancos' || medicionValue === 'Inertes') {
                if (dE1) {
                    if (dE2) {
                        if (dE3) {
                            resultado = (promedio3 / 0.01) * vm;
                            resultadoInput.value = resultado > 0 ? (resultado) : '0**';
                            return;
                        } else if (dE4) {
                            resultado = (promedio3 / 0.001) * vm;
                            resultadoInput.value = resultado > 0 ? (resultado) : '0**';
                            return;
                        } else {
                            resultado = '0**';
                            resultadoInput.value = resultado;
                            return;
                        }
                    }
                } else if (dE2) {
                    if (dE3) {
                        if (dE4) {
                            resultado = (promedio3 / 0.001) * vm;
                            resultadoInput.value = resultado > 0 ? (resultado) : '0**';
                            return;
                        } else {
                            resultado = '0**';
                            resultadoInput.value = resultado;
                            return;
                        }
                    }
                } else {
                    resultado = '0**';
                    resultadoInput.value = resultado;
                    return;
                }
            }
        }

    }

    function formatearResultado(valor) {
        if (valor > 1000) {
            return valor.toExponential(2); // Notación científica para valores muy grandes
        } else if (valor % 1 === 0) {
            return valor.toString();
        } else {
            return valor.toFixed(2); // 2 decimales para valores con decimales
        }
    }

    /**
     * Calcula la diferencia porcentual entre las placas duplicadas.
     * La fórmula es: |placa1 - placa2| / promedio * 100
     * Maneja correctamente los valores cero.
     * 
     * @param {HTMLElement} fila - La fila de la tabla donde se realizará el cálculo
     * @returns {void} - No retorna valor, actualiza directamente el campo diferencia_r
     */
    function calcularDiferenciaEntreDuplicados(fila) {
        // Obtener el campo donde se mostrará la diferencia
        const diferenciaInput = fila.querySelector('[name^="diferencia_r_"]');
        if (!diferenciaInput) return;

        // Obtener los tres promedios para determinar cuál está en el rango 25-250
        const promedio1 = parseFloat(fila.querySelector('.promedio').value.replace('**', '').replace('>', '')) || 0;
        const promedio2 = parseFloat(fila.querySelector('.promedio2').value.replace('**', '').replace('>', '')) || 0;
        const promedio3 = parseFloat(fila.querySelector('.promedio3').value.replace('**', '').replace('>', '')) || 0;

        // Variables para almacenar las placas y el promedio que se usarán en el cálculo
        let placa1 = 0, placa2 = 0, promedioUsado = 0;

        // Determinar qué par de placas usar basado en cuál promedio está en el rango 25-250
        if (promedio1 >= 25 && promedio1 <= 250) {
            // Usar placas de Dilución Directa (placa1 y placa2)
            placa1 = parseFloat(fila.querySelector('.placa1').value) || 0;
            placa2 = parseFloat(fila.querySelector('.placa2').value) || 0;
            promedioUsado = promedio1;
        } else if (promedio2 >= 25 && promedio2 <= 250) {
            // Usar placas de primera Dilución (placa3 y placa4)
            placa1 = parseFloat(fila.querySelector('.placa3').value) || 0;
            placa2 = parseFloat(fila.querySelector('.placa4').value) || 0;
            promedioUsado = promedio2;
        } else if (promedio3 >= 25 && promedio3 <= 250) {
            // Usar placas de segunda Dilución (placa5 y placa6)
            placa1 = parseFloat(fila.querySelector('.placa5').value) || 0;
            placa2 = parseFloat(fila.querySelector('.placa6').value) || 0;
            promedioUsado = promedio3;
        } else {
            // Si ningún promedio está en el rango, usar el que tenga valor más alto
            if (promedio1 >= promedio2 && promedio1 >= promedio3) {
                placa1 = parseFloat(fila.querySelector('.placa1').value) || 0;
                placa2 = parseFloat(fila.querySelector('.placa2').value) || 0;
                promedioUsado = promedio1;
            } else if (promedio2 >= promedio1 && promedio2 >= promedio3) {
                placa1 = parseFloat(fila.querySelector('.placa3').value) || 0;
                placa2 = parseFloat(fila.querySelector('.placa4').value) || 0;
                promedioUsado = promedio2;
            } else {
                placa1 = parseFloat(fila.querySelector('.placa5').value) || 0;
                placa2 = parseFloat(fila.querySelector('.placa6').value) || 0;
                promedioUsado = promedio3;
            }
        }

        // Calcular la diferencia porcentual
        let diferenciaPorcentual = 0;
        
        // Si ambas placas son cero, la diferencia es 0%
        if (placa1 === 0 && placa2 === 0) {
            diferenciaPorcentual = 0;
        } 
        // Si solo una placa es cero y la otra no, la diferencia es 100%
        else if ((placa1 === 0 && placa2 !== 0) || (placa1 !== 0 && placa2 === 0)) {
            diferenciaPorcentual = 100;
        }
        // Si el promedio es cero pero ambas placas no son cero (caso raro), usar 100%
        else if (promedioUsado === 0) {
            diferenciaPorcentual = 100;
        }
        // Caso normal: calcular la diferencia porcentual
        else {
            const diferenciaAbsoluta = Math.abs(placa1 - placa2);
            diferenciaPorcentual = (diferenciaAbsoluta / promedioUsado) * 100;
        }
        
        // Formatear el resultado a dos decimales
        const diferenciaFormateada = diferenciaPorcentual.toFixed(2);
        
        // Determinar si la diferencia es aceptable (menor al 5%)
        const esAceptable = diferenciaPorcentual < 5;
        
        // Mostrar el resultado con indicador visual
        diferenciaInput.value = diferenciaFormateada + "%" + (esAceptable ? " ✓" : " ✗");
        
        // Opcional: Cambiar el color del campo según si es aceptable o no
        diferenciaInput.style.color = esAceptable ? "green" : "red";
    }

    // function redondearNumero(num) {
    //     // Convertimos el número en una cadena para separar los dígitos
    //     //let numStr = valor.toString();
    //     let numStr = Array.from(str, num => `[${num}]`);

    //     // Caso cuando el número tiene más de 2 cifras
    //     if (numStr.length > 2) {
    //         let cientos = parseInt(numStr.charAt(0)); // Primer dígito (centenas)
    //         let decenas = parseInt(numStr.charAt(1)); // Segundo dígito (decenas)
    //         let unidades = parseInt(numStr.charAt(2)); // Tercer dígito (unidades)

    //         if (unidades > 5) {
    //             decenas += 1; // Aumentamos el segundo dígito
    //             unidades = 0; // El tercer dígito se pone a 0

    //             if (decenas === 10) {
    //                 decenas = 0; // Si el segundo dígito es 9, lo reseteamos
    //                 cientos += 1; // Aumentamos el primer dígito
    //             }
    //         }

    //         // Comprobamos si el primer dígito es 10, lo corregimos
    //         if (cientos >= 10) {
    //             cientos = 9;
    //         }

    //         // Volvemos a formar el número con los tres dígitos
    //         return parseInt(`${cientos}${decenas}${unidades}`);
    //     }
    //     // Caso cuando el número tiene 2 cifras
    //     else if (numStr.length === 2) {
    //         let decenas = parseInt(numStr.charAt(0)); // Primer dígito (decenas)
    //         let unidades = parseInt(numStr.charAt(1)); // Segundo dígito (unidades)

    //         if (unidades > 5) {
    //             decenas += 1; // Aumentamos el primer dígito
    //             unidades = 0; // El segundo dígito se pone a 0
    //         } else {
    //             unidades = 0; // El segundo dígito se pone a 0 si es menor o igual a 5
    //         }

    //         return parseInt(`${decenas}${unidades}`);
    //     }
    //     // Si es un número de una sola cifra, simplemente lo retornamos como está
    //     return num;
    // }
    function redondearNumero(numero) {
        // Convertir el número a string para manipular dígitos
        const numStr = Math.floor(numero).toString(); // Usamos Math.floor para evitar decimales
        let resultado;

        if (numStr.length <= 2) {
            // Si tiene 1 o 2 dígitos, no se modifica
            return parseInt(numStr, 10);
        } else {
            // Tomar los primeros 3 dígitos
            const primerosTres = numStr.slice(0, 3);
            const tercerDigito = parseInt(primerosTres[2], 10);

            // Redondear basado en el tercer dígito
            if (tercerDigito >= 5) {
                // Redondear hacia arriba (ej: 125 → 130)
                const primerosDos = parseInt(primerosTres.slice(0, 2), 10);
                resultado = (primerosDos + 1) * 10;
            } else {
                // Redondear hacia abajo (ej: 123 → 120)
                resultado = parseInt(primerosTres.slice(0, 2), 10) * 10;
            }

            // Si el número original tenía más de 3 dígitos, agregar ceros
            if (numStr.length > 3) {
                const ceros = '0'.repeat(numStr.length - 3);
                resultado = parseInt(resultado.toString() + ceros, 10);
            }
        }

        return resultado;
    }

    // Función para mostrar modal de volumen
    function mostrarModalVolumen(callback) {
        // Implementación básica - deberías adaptar esto a tu sistema de modales
        const vm = prompt('Por favor ingrese el volumen de la medición (Vm):');
        callback(parseFloat(vm));
    }

    // Función para mostrar modal genérico
    function mostrarModal(titulo, mensaje) {
        // Implementación básica - deberías adaptar esto a tu sistema de modales
        alert(`${titulo}\n${mensaje}`);
    }



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

    $('#tabla-body tr').each(function (index) {
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
