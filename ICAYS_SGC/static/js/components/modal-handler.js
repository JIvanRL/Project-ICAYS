class ModalHandler {
    static showConfirm(options = {}) {
        const {
            title = 'Confirmar',
            message = '¿Estás seguro?',
            confirmText = 'Aceptar',
            cancelText = 'Cancelar',
            onConfirm = () => {},
            onCancel = () => {}
        } = options;

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('confirmModal'));
        const modalEl = modal._element;

        modalEl.querySelector('.modal-title').textContent = title;
        modalEl.querySelector('.modal-body').textContent = message;
        modalEl.querySelector('#confirmBtn').textContent = confirmText;

        modalEl.querySelector('#confirmBtn').onclick = () => {
            onConfirm();
            modal.hide();
        };

        modal.show();
    }

    static showError(options = {}) {
        const {
            title = 'Error',
            message = 'Ha ocurrido un error',
            onClose = () => {}
        } = options;

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('errorModal'));
        const modalEl = modal._element;

        modalEl.querySelector('.modal-title').textContent = title;
        modalEl.querySelector('.modal-body').textContent = message;

        modalEl.addEventListener('hidden.bs.modal', onClose, { once: true });

        modal.show();
    }

    static showSuccess(options = {}) {
        const {
            message = 'Operación exitosa',
            autoClose = true,
            onClose = () => {}
        } = options;

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('successModal'));
        const modalEl = modal._element;

        modalEl.querySelector('.modal-body').textContent = message;
        modalEl.addEventListener('hidden.bs.modal', onClose, { once: true });

        modal.show();

        if (autoClose) {
            setTimeout(() => modal.hide(), 2000);
        }
    }
}
