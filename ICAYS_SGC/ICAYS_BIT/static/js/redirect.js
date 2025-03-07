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
});
