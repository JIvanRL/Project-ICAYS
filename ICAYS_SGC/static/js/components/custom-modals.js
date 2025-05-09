// Función para crear modales personalizados
class CustomModals {
    static confirmDelete(options = {}) {
        const {
            title = 'Eliminar',
            message = '¿Estás seguro de eliminar?',
            confirmText = 'Eliminar',
            cancelText = 'Cancelar',
            onConfirm = () => {}
        } = options;

        const modalHtml = `
            <div class="modal fade custom-modal delete-modal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0">
                        <div class="modal-header bg-danger text-white border-0">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <i class="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
                            <p class="mb-0">${message}</p>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
                            <button type="button" class="btn btn-danger" id="confirmBtn">${confirmText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar modal en el DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modalElement = document.querySelector('.delete-modal');
        const modal = new bootstrap.Modal(modalElement);
        
        // Configurar evento de confirmación
        modalElement.querySelector('#confirmBtn').onclick = () => {
            onConfirm();
            modal.hide();
        };

        // Limpiar modal al cerrar
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });

        modal.show();
    }

    static success(options = {}) {
        const {
            title = 'Éxito',
            message = 'Operación completada exitosamente',
            buttonText = 'Aceptar'
        } = options;

        const modalHtml = `
            <div class="modal fade custom-modal success-modal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0">
                        <div class="modal-header bg-success text-white border-0">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <i class="fas fa-check-circle text-success fa-3x mb-3"></i>
                            <p class="mb-0">${message}</p>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-success" data-bs-dismiss="modal">${buttonText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar y mostrar modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalElement = document.querySelector('.success-modal');
        const modal = new bootstrap.Modal(modalElement);

        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });

        modal.show();
    }

    static error(options = {}) {
        const {
            title = 'Error',
            message = 'Ha ocurrido un error',
            buttonText = 'Cerrar'
        } = options;

        const modalHtml = `
            <div class="modal fade custom-modal error-modal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0">
                        <div class="modal-header bg-danger text-white border-0">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <i class="fas fa-times-circle text-danger fa-3x mb-3"></i>
                            <p class="mb-0">${message}</p>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-danger" data-bs-dismiss="modal">${buttonText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalElement = document.querySelector('.error-modal');
        const modal = new bootstrap.Modal(modalElement);

        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });

        modal.show();
    }
}
