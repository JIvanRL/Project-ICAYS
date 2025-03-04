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

document.querySelector('form').addEventListener('submit', function(event) {
    const selectedArea = document.querySelector('.area-checkbox:checked');
    if (!selectedArea) {
        alert('Por favor, selecciona un área.');
        event.preventDefault(); // Evita que el formulario se envíe
    }
});

