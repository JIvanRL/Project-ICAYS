//////////////////////////////////////////////////////
//        Años automaticamnte para los select       //
//////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function() {
    function llenarSelectsAnio(className) {
        console.log("Llenando select con clase:", className);
        const selects = document.getElementsByClassName(className);
        const anioActual = new Date().getFullYear();

        for (let select of selects) {
            for (let i = anioActual; i >= anioActual - 10; i--) {
                const option = document.createElement("option");
                option.value = i;
                option.text = i;
                select.appendChild(option);
            }
        }
    }

    // Llamar a la función para llenar los selects con la clase "anio-select"
    llenarSelectsAnio("anio-select");
});

/////////////////////////////////////////////////////////
//      Boton para aumentar Filas tabla de mohos       //
/////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
    // Seleccionar el botón por clase (o id, si prefieres)
    const botonAgregar = document.getElementById("agregarFila");

    botonAgregar.addEventListener("click", function () {
        // Seleccionar todas las tablas que tengan la clase "agregar1"
        const tablas = document.querySelectorAll(".agregar1");

        tablas.forEach((tabla) => {
            const tbody = tabla.querySelector("tbody");

            if (tbody) {
                // Clonar la última fila de la tabla
                const ultimaFila = tbody.lastElementChild.cloneNode(true);

                // Limpiar los valores de los inputs en la nueva fila
                const inputs = ultimaFila.querySelectorAll("input");
                inputs.forEach((input) => {
                    if (!input.disabled) {
                        // Limpiar el valor de los inputs de texto
                        if (input.type === "text" || input.type === "number") {
                            input.value = "";
                        }
                        // Limpiar el estado del checkbox
                        if (input.type === "checkbox") {
                            input.checked = false; // Reiniciar el checkbox
                        }
                    }
                });

                // Actualizar el índice de los nombres de los inputs
                const indice = tbody.children.length - 1;
                ultimaFila.querySelectorAll("input").forEach((input) => {
                    if (input.name) {
                        input.name = input.name.replace(/\[\d+\]/, `[${indice}]`);
                    }
                });

                // Agregar la nueva fila al tbody
                tbody.appendChild(ultimaFila);
            }
        });
    });
});

/////////////////////////////////////////////////////////////////////////////////////////
// Inicia procedimiento para eliminar filas de mas en los registros de tabla de mohos
////////////////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
    const botonEliminar = document.getElementById("eliminarFila");
    const confirmarEliminarModal = new bootstrap.Modal(document.getElementById("confirmarEliminarModal2"));
    const confirmarEliminarBtn = document.getElementById("confirmarEliminar2");

    let filasAEliminar = []; // Arreglo para almacenar las filas que se intentan eliminar

    botonEliminar.addEventListener("click", function () {
        // Seleccionar todas las tablas que tengan la clase "agregar2"
        const tablas = document.querySelectorAll(".agregar1");

        // Reiniciar el arreglo de filas a eliminar
        filasAEliminar = [];

        // Variable para verificar si hay filas con datos
        let hayFilasConDatos = false;

        tablas.forEach((tabla) => {
            const tbody = tabla.querySelector("tbody");

            if (tbody) {
                // Determinar el límite de filas según la clase de la tabla
                const limiteFilas = tabla.classList.contains("tabla-especial") ? 3 : 5;

                if (tbody.children.length > limiteFilas) {
                    const ultimaFila = tbody.lastElementChild;

                    // Verificar si la fila tiene datos
                    const inputs = ultimaFila.querySelectorAll("input");
                    const tieneDatos = Array.from(inputs).some(input => input.value.trim() !== "");

                    if (tieneDatos) {
                        // Si la fila tiene datos, marcar que hay filas con datos
                        hayFilasConDatos = true;
                    }

                    // Agregar la fila al arreglo de filas a eliminar (tenga o no datos)
                    filasAEliminar.push(ultimaFila);
                }
            }
        });

        // Si hay filas con datos, mostrar el modal de confirmación
        if (hayFilasConDatos) {
            confirmarEliminarModal.show();
        } else {
            // Si no hay filas con datos, eliminar todas las filas directamente
            eliminarFilas();
        }
    });

    // Confirmar eliminación al hacer clic en el botón del modal
    confirmarEliminarBtn.addEventListener("click", function () {
        eliminarFilas(); // Eliminar todas las filas
        confirmarEliminarModal.hide(); // Ocultar el modal
    });

    // Función para eliminar las filas almacenadas en el arreglo
    function eliminarFilas() {
        filasAEliminar.forEach((fila) => {
            const tbody = fila.parentElement;
            tbody.removeChild(fila);
        });

        // Limpiar el arreglo
        filasAEliminar = [];
    }
});

/////////////////////////////////////////////////////////////////////
//      Boton para aumentar Filas tabla de levaduras              //
////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
    // Seleccionar el botón por clase (o id, si prefieres)
    const botonAgregar = document.getElementById("agregarFila2");

    botonAgregar.addEventListener("click", function () {
        // Seleccionar todas las tablas que tengan la clase "agregar1"
        const tablas = document.querySelectorAll(".agregar2");

        tablas.forEach((tabla) => {
            const tbody = tabla.querySelector("tbody");

            if (tbody) {
                // Clonar la última fila de la tabla
                const ultimaFila = tbody.lastElementChild.cloneNode(true);

                // Limpiar los valores de los inputs en la nueva fila
                const inputs = ultimaFila.querySelectorAll("input");
                inputs.forEach((input) => {
                    if (!input.disabled) {
                        // Limpiar el valor de los inputs de texto
                        if (input.type === "text" || input.type === "number") {
                            input.value = "";
                        }
                        // Limpiar el estado del checkbox
                        if (input.type === "checkbox") {
                            input.checked = false; // Reiniciar el checkbox
                        }
                    }
                });

                // Actualizar el índice de los nombres de los inputs
                const indice = tbody.children.length - 1;
                ultimaFila.querySelectorAll("input").forEach((input) => {
                    if (input.name) {
                        input.name = input.name.replace(/\[\d+\]/, `[${indice}]`);
                    }
                });

                // Agregar la nueva fila al tbody
                tbody.appendChild(ultimaFila);
            }
        });
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////
//     Procedimiento para eliminar filas de mas en los registros de tabla de Levaduras    //
////////////////////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
    // Seleccionar el botón de eliminar por clase (o id, si prefieres)
    const botonEliminar = document.getElementById("eliminarFila2");
    const confirmarEliminarModal = new bootstrap.Modal(document.getElementById("confirmarEliminarModal"));
    const confirmarEliminarBtn = document.getElementById("confirmarEliminar");

    let filasAEliminar = []; // Arreglo para almacenar las filas que se intentan eliminar

    botonEliminar.addEventListener("click", function () {
        // Seleccionar todas las tablas que tengan la clase "agregar2"
        const tablas = document.querySelectorAll(".agregar2");

        // Reiniciar el arreglo de filas a eliminar
        filasAEliminar = [];

        // Variable para verificar si hay filas con datos
        let hayFilasConDatos = false;

        tablas.forEach((tabla) => {
            const tbody = tabla.querySelector("tbody");

            if (tbody) {
                // Determinar el límite de filas según la clase de la tabla
                const limiteFilas = tabla.classList.contains("tabla-especial") ? 3 : 5;

                if (tbody.children.length > limiteFilas) {
                    const ultimaFila = tbody.lastElementChild;

                    // Verificar si la fila tiene datos
                    const inputs = ultimaFila.querySelectorAll("input");
                    const tieneDatos = Array.from(inputs).some(input => input.value.trim() !== "" || (input.type === "checkbox" && input.checked) );

                    if (tieneDatos) {
                        // Si la fila tiene datos, marcar que hay filas con datos
                        hayFilasConDatos = true;
                    }

                    // Agregar la fila al arreglo de filas a eliminar (tenga o no datos)
                    filasAEliminar.push(ultimaFila);
                }
            }
        });

        // Si hay filas con datos, mostrar el modal de confirmación
        if (hayFilasConDatos) {
            confirmarEliminarModal.show();
        } else {
            // Si no hay filas con datos, eliminar todas las filas directamente
            eliminarFilas();
        }
    });

    // Confirmar eliminación al hacer clic en el botón del modal
    confirmarEliminarBtn.addEventListener("click", function () {
        eliminarFilas(); // Eliminar todas las filas
        confirmarEliminarModal.hide(); // Ocultar el modal
    });

    // Función para eliminar las filas almacenadas en el arreglo
    function eliminarFilas() {
        filasAEliminar.forEach((fila) => {
            const tbody = fila.parentElement;
            tbody.removeChild(fila);
        });

        // Limpiar el arreglo
        filasAEliminar = [];
    }
});

//////////////////////////////////////////////////////////////////
//        Opcion para regresar a los botones de arriba          // 
//////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function() {
    const botonSubir = document.getElementById("boton-subir");

    // Mostrar u ocultar el botón según el desplazamiento
    window.addEventListener("scroll", function() {
        if (window.scrollY > 100) { // Mostrar el botón después de 100px de desplazamiento
            botonSubir.style.display = "block";
        } else {
            botonSubir.style.display = "none";
        }
    });

    // Hacer que el botón lleve al usuario al principio de la página
    botonSubir.addEventListener("click", function() {
        window.scrollTo({
            top: 0,
            behavior: "smooth" // Desplazamiento suave
        });
    });
});

//////////////////////////////////////////////////////////////////////////
// Divicion de numeros Procedimiento de lectura entre dilucion empleada //
//////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function() {
    const inputNumero1 = document.getElementById("Pl");
    const inputNumero2 = document.getElementById("De");
    const resultado = document.getElementById("ReDiv");

    // Función para dividir los números y mostrar el resultado
    function dividirNumeros() {
        const valor1 = parseFloat(inputNumero1.value) || 0; // Si no hay valor, usa 0
        const valor2 = parseFloat(inputNumero2.value) || 0; // Si no hay valor, usa 1 (evitar división por 0)
    
        const division = valor1 / valor2;
        
        if (isNaN(division)) {
            resultado.textContent = "0";
        } else if (!isFinite(division)) {
            resultado.textContent = "0";
        } else {
            resultado.textContent = division.toFixed(2);
        }
        
    }

    // Escuchar cambios en los inputs
    inputNumero1.addEventListener("input", dividirNumeros);
    inputNumero2.addEventListener("input", dividirNumeros);
});

/////////////////////////////////////////////////////////////////
//  Calculo de resultados de superficies vivas e inertes       //
/////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function() {
    const inputNumero1 = document.getElementById("Pl2");
    const inputNumero2 = document.getElementById("De2");
    const inputNumero3 = document.getElementById("Vmt");
    const resultado = document.getElementById("Rpdv");

    // Función para realizar la operación y mostrar el resultado
    function calcularResultado() {
        const valor1 = parseFloat(inputNumero1.value) || 0; // Si no hay valor, usa 0
        const valor2 = parseFloat(inputNumero2.value) || 0; // Si no hay valor, usa 0
        const valor3 = parseFloat(inputNumero3.value) || 0; // Si no hay valor, usa 0

        const operacion = (valor1 / valor2) * valor3;
        
        if (isNaN(operacion)) {
            resultado.textContent = "0";
        } else if (!isFinite(operacion)) {
            resultado.textContent = "0";
        } else {
            resultado.textContent = operacion.toFixed(2);
        }
    }

    // Escuchar cambios en los inputs
    inputNumero1.addEventListener("input", calcularResultado);
    inputNumero2.addEventListener("input", calcularResultado);
    inputNumero3.addEventListener("input", calcularResultado);
});

/////////////////////////////////////////////////////////////////////////
//             Calculo diferencial entre duplicados                    //
/////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function() {
    const inputNumero1 = document.getElementById("CP1");
    const inputNumero2 = document.getElementById("CP2");
    const inputNumero3 = document.getElementById("Pmd");
    const resultado = document.getElementById("Rp1p2pmd");

    // Función para realizar la operación y mostrar el resultado
    function calcularResultado() {
        const valor1 = parseFloat(inputNumero1.value) || 0; // Si no hay valor, usa 0
        const valor2 = parseFloat(inputNumero2.value) || 0; // Si no hay valor, usa 0
        const valor3 = parseFloat(inputNumero3.value) || 0; // Si no hay valor, usa 0

        const operacion = ((valor1 - valor2) / valor3) * 100;
        
        if (isNaN(operacion)) {
            resultado.textContent = "0";
        } else if (!isFinite(operacion)) {
            resultado.textContent = "0";
        } else {
            resultado.textContent = operacion.toFixed(2);
        }
    }

    // Escuchar cambios en los inputs
    inputNumero1.addEventListener("input", calcularResultado);
    inputNumero2.addEventListener("input", calcularResultado);
    inputNumero3.addEventListener("input", calcularResultado);
});