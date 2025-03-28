// Función para cargar los períodos disponibles

function cargarPeriodosDisponibles() {
    console.log('Cargando períodos disponibles...');
    
    $.ajax({
        url: '/microalimentos/periodos-bitacoras/',  // URL corregida
        type: 'GET',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(data) {
            console.log('Períodos obtenidos:', data);
            if (data.periodos) {
                mostrarPeriodosEnSidebar(data.periodos);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al cargar períodos:', {
                status: status,
                error: error,
                response: xhr.responseText
            });
            // Intentar mostrar un mensaje más amigable
            const contenedor = document.getElementById('periodos-container');
            if (contenedor) {
                contenedor.innerHTML = '<div class="alert alert-danger">Error al cargar períodos. Intente nuevamente más tarde.</div>';
            }
        }
    });
}
// Función para mostrar los períodos en el sidebar
function mostrarPeriodosEnSidebar(periodos) {
    const contenedor = document.getElementById('periodos-container');
    if (!contenedor) {
        console.error('Contenedor de períodos no encontrado');
        return;
    }
    
    // Limpiar el contenedor
    contenedor.innerHTML = '';
    
    // Si no hay períodos, mostrar mensaje
    if (periodos.length === 0) {
        contenedor.innerHTML = '<div class="alert alert-info">No hay bitácoras registradas.</div>';
        return;
    }
    
    // Crear el HTML para cada año y sus meses
    periodos.forEach(periodo => {
        const año = periodo.año;
        const meses = periodo.meses;
        
        // Crear el elemento para el año
        const añoElement = document.createElement('div');
        añoElement.className = 'año-container mb-3';
        
        // Crear el encabezado del año
        const añoHeader = document.createElement('h5');
        añoHeader.className = 'año-header bg-light p-2 rounded';
        añoHeader.textContent = año;
        añoHeader.setAttribute('data-toggle', 'collapse');
        añoHeader.setAttribute('data-target', `#meses-${año}`);
        añoHeader.style.cursor = 'pointer';
        
        // Crear el contenedor de meses (colapsable)
        const mesesContainer = document.createElement('div');
        mesesContainer.id = `meses-${año}`;
        mesesContainer.className = 'collapse';
        
        // Crear la lista de meses
        const mesesList = document.createElement('ul');
        mesesList.className = 'list-group';
        
        // Nombres de los meses
        const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        // Añadir cada mes a la lista
        meses.forEach(mes => {
            const mesItem = document.createElement('li');
            mesItem.className = 'list-group-item';
            
            const mesLink = document.createElement('a');
            mesLink.href = `/microalimentos/historial/${año}/${mes}/`;  // Cambiar microbiologia/bitacoras por microalimentos/historial
            mesLink.textContent = nombresMeses[mes - 1];
            mesLink.className = 'text-decoration-none';
            
            mesItem.appendChild(mesLink);
            mesesList.appendChild(mesItem);
        });
        
        // Ensamblar todo
        mesesContainer.appendChild(mesesList);
        añoElement.appendChild(añoHeader);
        añoElement.appendChild(mesesContainer);
        contenedor.appendChild(añoElement);
    });
    
    // Expandir el primer año por defecto
    if (periodos.length > 0) {
        const primerAño = periodos[0].año;
        $(`#meses-${primerAño}`).collapse('show');
    }
}

// Función para obtener el token CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Función para manejar clics en elementos con data-url
document.addEventListener('DOMContentLoaded', function() {
    cargarPeriodosDisponibles();
    // Seleccionar todos los elementos con el atributo data-url
    const elementosConUrl = document.querySelectorAll('[data-url]');
    
    // Añadir un event listener a cada elemento
    elementosConUrl.forEach(elemento => {
        elemento.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            if (url) {
                console.log('Redirigiendo a:', url);
                window.location.href = url;
            }
        });
    });
});