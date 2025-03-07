function DetallesBita(bitacoraId) {
    if (!bitacoraId) {
        alert('No se proporcionó ID de bitácora');
        return;
    }

    try {
        window.location.href = `/detallesBita/${bitacoraId}/`;
    } catch (error) {
        console.error('Error:', error);
        alert('Error al acceder a la bitácora');
    }
}
//Funcion para actualizar el contador 

function actualizarContador() {
    $.ajax({
        url: "{% url 'contar_bitacoras' %}",
        type: 'GET',
        success: function(response) {
            const badge = $('.badge');
            const oldValue = parseInt(badge.text().trim());
            const newValue = response.cantidad;
            
            if (oldValue !== newValue) {
                badge.text(newValue);
                // Animar el icono
                $('.fa-bell').addClass('fa-shake');
                setTimeout(() => {
                    $('.fa-bell').removeClass('fa-shake');
                }, 1000);
            }
        }
    });
}

// Actualizar cada 30 segundos
setInterval(actualizarContador, 30000);

