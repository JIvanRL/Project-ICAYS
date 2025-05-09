document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.area-checkbox');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                // Deshabilitar los otros checkboxes
                checkboxes.forEach(otherCheckbox => {
                    if (otherCheckbox !== this) {
                        otherCheckbox.disabled = true;
                    }
                });
            } else {
                // Si se deselecciona, habilitar todos los checkboxes
                checkboxes.forEach(otherCheckbox => {
                    otherCheckbox.disabled = false;
                });
            }
        });
    });
});

document.querySelector('form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const selectedArea = document.querySelector('.area-checkbox:checked');
    
    if (!selectedArea) {
        showNotification('Por favor, selecciona un área.', 'danger');
        return;
    }

    try {
        const formData = new FormData(this);
        const response = await fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            setTimeout(() => {
                window.location.href = data.redirect_url;
            }, 2000);
        } else {
            showNotification(data.message || 'Error al procesar la solicitud', 'danger');
        }
    } catch (error) {
        showNotification('Error al procesar la solicitud', 'danger');
    }
});

// Agregar manejador para eliminación
document.querySelectorAll('[data-action="delete"]').forEach(button => {
    button.addEventListener('click', async (e) => {
        if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            try {
                const response = await fetch(e.target.dataset.url, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    }
                });
                
                const data = await response.json();
                showNotification(data.message, data.success ? 'success' : 'danger');
                
                if (data.success) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            } catch (error) {
                showNotification('Error al eliminar el usuario', 'danger');
            }
        }
    });
});

