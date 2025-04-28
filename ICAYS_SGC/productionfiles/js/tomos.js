document.addEventListener("DOMContentLoaded", function() {
    function llenarSelectsAnio(className) {
        console.log("Llenando select con clase:", className);
        const selects = document.getElementsByClassName(className);
        const anioActual = new Date().getFullYear();

        for (let select of selects) {
            // Guardar el año seleccionado de la base de datos
            const savedYear = select.getAttribute('data-selected-year');
            console.log("Año guardado en BD:", savedYear);
            
            // Limpiar opciones existentes (excepto la primera que es "Año")
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Agregar opciones de años
            for (let i = anioActual; i >= anioActual - 10; i--) {
                const option = document.createElement("option");
                option.value = i;
                option.text = i;
                
                // Seleccionar el año guardado en la BD
                if (i.toString() === savedYear) {
                    option.selected = true;
                    console.log("Seleccionando año:", i);
                }
                
                select.appendChild(option);
            }
            
            // Si el año guardado no está en el rango, agregarlo como opción
            if (savedYear && parseInt(savedYear) < anioActual - 10) {
                const option = document.createElement("option");
                option.value = savedYear;
                option.text = savedYear;
                option.selected = true;
                select.appendChild(option);
                console.log("Agregando año fuera de rango:", savedYear);
            }
        }
    }

    // Llamar a la función para llenar los selects con la clase "anio-select"
    llenarSelectsAnio("anio-select");
});