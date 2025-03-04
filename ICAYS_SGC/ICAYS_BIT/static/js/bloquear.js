//<input type="text" id="miInput3" placeholder="Escribe algo...">

// Obtener el elemento input
var input = document.getElementById("T1");

// Agregar un evento "blur" al input
input.addEventListener("blur", function() {
// Verificar si el input tiene un valor
    if (input.value.trim() !== "") {
    // Deshabilitar el input
        input.disabled = true;
        }
});