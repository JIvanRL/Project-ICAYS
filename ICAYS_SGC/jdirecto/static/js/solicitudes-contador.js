function actualizarContadorSolicitudes() {
    fetch('/jdirecto/api/solicitudes/contador/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Actualizar contador en la navegación
                const contadorNav = document.getElementById('solicitudes-contador');
                if (contadorNav) {
                    contadorNav.textContent = data.count;
                    contadorNav.style.display = data.count > 0 ? 'inline' : 'none';
                }
            }
        })
        .catch(error => console.error('Error al actualizar contador:', error));
}

// Actualizar cada 30 segundos
setInterval(actualizarContadorSolicitudes, 30000);

// Actualizar al cargar la página
document.addEventListener('DOMContentLoaded', actualizarContadorSolicitudes);
