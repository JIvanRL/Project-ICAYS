// Modal Base
function createModal(options = {}) {
    const {
        title = '',
        content = '',
        size = 'medium', // small, medium, large
        type = 'default', // default, warning, danger, success
        buttons = []
    } = options;

    const modal = document.createElement('div');
    modal.className = `modal fade modal-${type}`;
    modal.innerHTML = `
        <div class="modal-dialog modal-${size}">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    ${buttons.map(btn => `
                        <button type="button" 
                                class="btn ${btn.class || 'btn-secondary'}"
                                ${btn.dismiss ? 'data-bs-dismiss="modal"' : ''}
                                ${btn.id ? `id="${btn.id}"` : ''}>
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    return modal;
}

// Popover Base
function createPopover(element, options = {}) {
    const {
        title = '',
        content = '',
        placement = 'top',
        trigger = 'hover'
    } = options;

    return new bootstrap.Popover(element, {
        title,
        content,
        placement,
        trigger,
        html: true,
        template: `
            <div class="popover custom-popover" role="tooltip">
                <div class="popover-arrow"></div>
                <h3 class="popover-header"></h3>
                <div class="popover-body"></div>
            </div>
        `
    });
}

// Toast Base
function createToast(options = {}) {
    const {
        message = '',
        type = 'success', // success, warning, danger, info
        position = 'top-right',
        duration = 3000
    } = options;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} ${position}`;
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">${message}</div>
    `;

    return toast;
}
