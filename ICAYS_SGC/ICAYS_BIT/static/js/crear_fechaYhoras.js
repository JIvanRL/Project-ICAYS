// Función para crear fechas y horas (sin export para que sea accesible globalmente)
function crearFechasYHoras() {
    console.log("Inicializando función crearFechasYHoras");
    
    // Botones para la primera tarjeta (fechas y horas de siembra e incubación)
    const fecha_campo = document.getElementById('date_campo');
    const horaS_campo = document.getElementById('horaS_campo');
    const horaI_campo = document.getElementById('horaI-campo');
    
    // Botones para la tercera tarjeta (fechas y horas de lectura)
    const fecha_campo_lectura = document.getElementById('date_campo_lectura');
    const hora_campo_lectura = document.getElementById('hora_campo_lectura');
    
    console.log("Botones encontrados:", 
        fecha_campo ? "✓" : "✗", 
        horaS_campo ? "✓" : "✗", 
        horaI_campo ? "✓" : "✗",
        fecha_campo_lectura ? "✓" : "✗",
        hora_campo_lectura ? "✓" : "✗"
    );
    
    // Configurar eventos para los botones de la primera tarjeta
    if (fecha_campo) {
        fecha_campo.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto
            console.log("Botón fecha siembra clickeado");
            agregarNuevaFecha();
        });
    }
    
    if (horaS_campo) {
        horaS_campo.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto
            console.log("Botón hora siembra clickeado");
            agregarNuevaHoraSiembra();
        });
    }
    
    if (horaI_campo) {
        horaI_campo.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto
            console.log("Botón hora incubación clickeado");
            agregarNuevaHoraIncubacion();
        });
    }
    
    // Configurar eventos para los botones de la tercera tarjeta
    if (fecha_campo_lectura) {
        fecha_campo_lectura.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto
            console.log("Botón fecha lectura clickeado");
            agregarNuevaFechaLectura();
        });
    }
    
    if (hora_campo_lectura) {
        hora_campo_lectura.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto
            console.log("Botón hora lectura clickeado");
            agregarNuevaHoraLectura();
        });
    }
    
    // FUNCIONES PARA LA PRIMERA TARJETA
    
    // Función para agregar una nueva fecha de siembra
    function agregarNuevaFecha() {
        const contenedorFechas = document.getElementById('contenedor-fechas');
        if (!contenedorFechas) {
            console.error("No se encontró el contenedor de fechas");
            return;
        }
        
        // Contar cuántas fechas ya existen (sin contar la primera que es fija)
        const fechasExistentes = contenedorFechas.querySelectorAll('input[id^="fecha_siembra_"]').length;
        const nuevoIndice = fechasExistentes + 1;
        
        // Crear nuevo elemento para fecha
        const nuevoElemento = document.createElement('div');
        nuevoElemento.className = 'fecha-siembra-container mb-3';
        nuevoElemento.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="form-floating flex-grow-1">
                    <input type="date" class="form-control form-control-sm" id="fecha_siembra_${nuevoIndice}" name="fecha_siembra_${nuevoIndice}" placeholder="Fecha">
                    <label for="fecha_siembra_${nuevoIndice}">Fecha de siembra ${nuevoIndice}</label>
                </div>
                <button type="button" class="btn btn-sm btn-danger ms-2 eliminar-fecha-btn">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        // Agregar al contenedor
        contenedorFechas.appendChild(nuevoElemento);
        
        // Configurar el botón de eliminar
        const eliminarBtn = nuevoElemento.querySelector('.eliminar-fecha-btn');
        if (eliminarBtn) {
            eliminarBtn.addEventListener('click', function(e) {
                e.preventDefault(); // Prevenir comportamiento por defecto
                nuevoElemento.remove();
                actualizarIndicesFechas();
            });
        }
    }
    
    // Función para agregar una nueva hora de siembra
    function agregarNuevaHoraSiembra() {
        const contenedorHoras = document.getElementById('contenedor-horas-siembra');
        if (!contenedorHoras) {
            console.error("No se encontró el contenedor de horas de siembra");
            return;
        }
        
        // Contar cuántas horas ya existen (sin contar la primera que es fija)
        const horasExistentes = contenedorHoras.querySelectorAll('input[id^="hora_siembra_"]').length;
        const nuevoIndice = horasExistentes + 1;
        
        // Crear nuevo elemento para hora
        const nuevoElemento = document.createElement('div');
        nuevoElemento.className = 'hora-siembra-container mb-3';
        nuevoElemento.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="form-floating flex-grow-1">
                    <input type="time" class="form-control form-control-sm" id="hora_siembra_${nuevoIndice}" name="hora_siembra_${nuevoIndice}" placeholder="Hora">
                    <label for="hora_siembra_${nuevoIndice}">Hora de siembra ${nuevoIndice}</label>
                </div>
                <button type="button" class="btn btn-sm btn-danger ms-2 eliminar-hora-siembra-btn">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        // Agregar al contenedor
        contenedorHoras.appendChild(nuevoElemento);
        
        // Configurar el botón de eliminar
        const eliminarBtn = nuevoElemento.querySelector('.eliminar-hora-siembra-btn');
        if (eliminarBtn) {
            eliminarBtn.addEventListener('click', function(e) {
                e.preventDefault(); // Prevenir comportamiento por defecto
                nuevoElemento.remove();
                actualizarIndicesHorasSiembra();
            });
        }
    }
    
    // Función para agregar una nueva hora de incubación
    function agregarNuevaHoraIncubacion() {
        const contenedorHoras = document.getElementById('contenedor-horas-incubacion');
        if (!contenedorHoras) {
            console.error("No se encontró el contenedor de horas de incubación");
            return;
        }
        
        // Contar cuántas horas ya existen (sin contar la primera que es fija)
        const horasExistentes = contenedorHoras.querySelectorAll('input[id^="hora_incubacion_"]').length;
        const nuevoIndice = horasExistentes + 1;
        
        // Crear nuevo elemento para hora
        const nuevoElemento = document.createElement('div');
        nuevoElemento.className = 'hora-incubacion-container mb-3';
        nuevoElemento.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="form-floating flex-grow-1">
                    <input type="time" class="form-control form-control-sm" id="hora_incubacion_${nuevoIndice}" name="hora_incubacion_${nuevoIndice}" placeholder="Hora">
                    <label for="hora_incubacion_${nuevoIndice}">Hora de incubación ${nuevoIndice}</label>
                </div>
                <button type="button" class="btn btn-sm btn-danger ms-2 eliminar-hora-incubacion-btn">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        // Agregar al contenedor
        contenedorHoras.appendChild(nuevoElemento);
        
        // Configurar el botón de eliminar
        const eliminarBtn = nuevoElemento.querySelector('.eliminar-hora-incubacion-btn');
        if (eliminarBtn) {
            eliminarBtn.addEventListener('click', function(e) {
                e.preventDefault(); // Prevenir comportamiento por defecto
                nuevoElemento.remove();
                actualizarIndicesHorasIncubacion();
            });
        }
    }
    
    // FUNCIONES PARA LA TERCERA TARJETA
    
    // Función para agregar una nueva fecha de lectura
    function agregarNuevaFechaLectura() {
        const contenedorFechas = document.getElementById('contenedor-fechas-lectura');
        if (!contenedorFechas) {
            console.error("No se encontró el contenedor de fechas de lectura");
            return;
        }
        
        // Contar cuántas fechas ya existen (sin contar las dos primeras que son fijas)
        const fechasExistentes = contenedorFechas.querySelectorAll('.fecha-lectura-container').length;
        const nuevoIndice = fechasExistentes + 3; // Empezamos desde 3 porque ya existen fecha_lectura_1 y fecha_lectura_2
        
        // Crear nuevo elemento para fecha
        const nuevoElemento = document.createElement('div');
        nuevoElemento.className = 'fecha-lectura-container mb-3';
        nuevoElemento.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="form-floating flex-grow-1">
                    <input type="date" class="form-control form-control-sm" id="fecha_lectura_${nuevoIndice}" name="fecha_lectura_${nuevoIndice}" placeholder="Fecha">
                    <label for="fecha_lectura_${nuevoIndice}">Fecha de lectura ${nuevoIndice}</label>
                </div>
                <button type="button" class="btn btn-sm btn-danger ms-2 eliminar-fecha-lectura-btn">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        // Agregar al contenedor
        contenedorFechas.appendChild(nuevoElemento);
        
        // Configurar el botón de eliminar
        const eliminarBtn = nuevoElemento.querySelector('.eliminar-fecha-lectura-btn');
        if (eliminarBtn) {
            eliminarBtn.addEventListener('click', function(e) {
                e.preventDefault(); // Prevenir comportamiento por defecto
                nuevoElemento.remove();
                actualizarIndicesFechasLectura();
            });
        }
    }
    
    // Función para agregar una nueva hora de lectura
    function agregarNuevaHoraLectura() {
        const contenedorHoras = document.getElementById('contenedor-horas-lectura');
        if (!contenedorHoras) {
            console.error("No se encontró el contenedor de horas de lectura");
            return;
        }
        
        // Contar cuántas horas ya existen (sin contar las dos primeras que son fijas)
        const horasExistentes = contenedorHoras.querySelectorAll('.hora-lectura-container').length;
        const nuevoIndice = horasExistentes + 3; // Empezamos desde 3 porque ya existen hora_lectura_1 y hora_lectura_2
        
        // Crear nuevo elemento para hora
        const nuevoElemento = document.createElement('div');
        nuevoElemento.className = 'hora-lectura-container mb-3';
        nuevoElemento.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="form-floating flex-grow-1">
                    <input type="time" class="form-control form-control-sm" id="hora_lectura_${nuevoIndice}" name="hora_lectura_${nuevoIndice}" placeholder="Hora">
                    <label for="hora_lectura_${nuevoIndice}">Hora de lectura ${nuevoIndice}</label>
                </div>
                <button type="button" class="btn btn-sm btn-danger ms-2 eliminar-hora-lectura-btn">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        // Agregar al contenedor
        contenedorHoras.appendChild(nuevoElemento);
        
        // Configurar el botón de eliminar
        const eliminarBtn = nuevoElemento.querySelector('.eliminar-hora-lectura-btn');
        if (eliminarBtn) {
            eliminarBtn.addEventListener('click', function(e) {
                e.preventDefault(); // Prevenir comportamiento por defecto
                nuevoElemento.remove();
                actualizarIndicesHorasLectura();
            });
        }
    }
    
    // FUNCIONES PARA ACTUALIZAR ÍNDICES
    
    // Función para actualizar los índices de las fechas de siembra
    function actualizarIndicesFechas() {
        const fechaContainers = document.querySelectorAll('.fecha-siembra-container');
        
        fechaContainers.forEach((container, index) => {
            const nuevoIndice = index + 1;
            
            const input = container.querySelector('input[type="date"]');
            const label = container.querySelector('label');
            
            if (input && label) {
                input.id = `fecha_siembra_${nuevoIndice}`;
                input.name = `fecha_siembra_${nuevoIndice}`;
                label.setAttribute('for', `fecha_siembra_${nuevoIndice}`);
                label.textContent = `Fecha de siembra ${nuevoIndice}`;
            }
        });
    }
    
    // Función para actualizar los índices de las horas de siembra
    function actualizarIndicesHorasSiembra() {
        const horaContainers = document.querySelectorAll('.hora-siembra-container');
        
        horaContainers.forEach((container, index) => {
            const nuevoIndice = index + 1;
            
            const input = container.querySelector('input[type="time"]');
            const label = container.querySelector('label');
            
            if (input && label) {
                input.id = `hora_siembra_${nuevoIndice}`;
                input.name = `hora_siembra_${nuevoIndice}`;
                label.setAttribute('for', `hora_siembra_${nuevoIndice}`);
                label.textContent = `Hora de siembra ${nuevoIndice}`;
            }
        });
    }
    
    // Función para actualizar los índices de las horas de incubación
    function actualizarIndicesHorasIncubacion() {
        const horaContainers = document.querySelectorAll('.hora-incubacion-container');
        
        horaContainers.forEach((container, index) => {
            const nuevoIndice = index + 1;
            
            const input = container.querySelector('input[type="time"]');
            const label = container.querySelector('label');
            
            if (input && label) {
                input.id = `hora_incubacion_${nuevoIndice}`;
                input.name = `hora_incubacion_${nuevoIndice}`;
                label.setAttribute('for', `hora_incubacion_${nuevoIndice}`);
                label.textContent = `Hora de incubación ${nuevoIndice}`;
            }
        });
    }
    
    // Función para actualizar los índices de las fechas de lectura
    function actualizarIndicesFechasLectura() {
        const fechaContainers = document.querySelectorAll('.fecha-lectura-container');
        
        fechaContainers.forEach((container, index) => {
            const nuevoIndice = index + 3; // Empezamos desde 3 porque ya existen fecha_lectura_1 y fecha_lectura_2
            
            const input = container.querySelector('input[type="date"]');
            const label = container.querySelector('label');
            
            if (input && label) {
                input.id = `fecha_lectura_${nuevoIndice}`;
                input.name = `fecha_lectura_${nuevoIndice}`;
                label.setAttribute('for', `fecha_lectura_${nuevoIndice}`);
                label.textContent = `Fecha de lectura ${nuevoIndice}`;
            }
        });
    }
    
    // Función para actualizar los índices de las horas de lectura
    function actualizarIndicesHorasLectura() {
        const horaContainers = document.querySelectorAll('.hora-lectura-container');
        
        horaContainers.forEach((container, index) => {
            const nuevoIndice = index + 3; // Empezamos desde 3 porque ya existen hora_lectura_1 y hora_lectura_2
            
            const input = container.querySelector('input[type="time"]');
            const label = container.querySelector('label');
            
            if (input && label) {
                input.id = `hora_lectura_${nuevoIndice}`;
                input.name = `hora_lectura_${nuevoIndice}`;
                label.setAttribute('for', `hora_lectura_${nuevoIndice}`);
                label.textContent = `Hora de lectura ${nuevoIndice}`;
            }
        });
    }
}

// Función para recolectar todas las fechas y horas dinámicas
function recolectarFechasHorasDinamicas() {
    console.log('Recolectando fechas y horas dinámicas...');
    
    // Objeto para almacenar todos los datos
    const datos = {
        // Primera tarjeta
        fechas_siembra: [],
        horas_siembra: [],
        horas_incubacion: [],
        
        // Tercera tarjeta
        fechas_lectura: [],
        horas_lectura: []
    };
    
    // Recolectar fechas de siembra dinámicas
    const fechasSiembra = document.querySelectorAll('input[id^="fecha_siembra_"]');
    fechasSiembra.forEach(input => {
        if (input.value) {
            datos.fechas_siembra.push({
                id: input.id,
                valor: input.value
            });
        }
    });
    
    // Recolectar horas de siembra dinámicas
    const horasSiembra = document.querySelectorAll('input[id^="hora_siembra_"]');
    horasSiembra.forEach(input => {
        if (input.value) {
            datos.horas_siembra.push({
                id: input.id,
                valor: input.value
            });
        }
    });
    
    // Recolectar horas de incubación dinámicas
    const horasIncubacion = document.querySelectorAll('input[id^="hora_incubacion_"]');
    horasIncubacion.forEach(input => {
        if (input.value) {
            datos.horas_incubacion.push({
                id: input.id,
                valor: input.value
            });
        }
    });
    
    // Recolectar fechas de lectura dinámicas (a partir de la 3 porque las dos primeras son fijas)
    const fechasLectura = document.querySelectorAll('input[id^="fecha_lectura_"]');
    fechasLectura.forEach(input => {
        // Extraer el número del ID
        const match = input.id.match(/fecha_lectura_(\d+)/);
        if (match && parseInt(match[1]) >= 3 && input.value) {
            datos.fechas_lectura.push({
                id: input.id,
                valor: input.value
            });
        }
    });
    
    // Recolectar horas de lectura dinámicas (a partir de la 3 porque las dos primeras son fijas)
    const horasLectura = document.querySelectorAll('input[id^="hora_lectura_"]');
    horasLectura.forEach(input => {
        // Extraer el número del ID
        const match = input.id.match(/hora_lectura_(\d+)/);
        if (match && parseInt(match[1]) >= 3 && input.value) {
            datos.horas_lectura.push({
                id: input.id,
                valor: input.value
            });
        }
    });
    
    // También incluir los campos fijos para tener todos los datos en un solo lugar
    const fechaSiembraFija = document.getElementById('fecha_siembra');
    if (fechaSiembraFija && fechaSiembraFija.value) {
        datos.fecha_siembra_fija = fechaSiembraFija.value;
    }
    
    const horaSiembraFija = document.getElementById('hora_siembra');
    if (horaSiembraFija && horaSiembraFija.value) {
        datos.hora_siembra_fija = horaSiembraFija.value;
    }
    
    const horaIncubacionFija = document.getElementById('hora_incubacion');
    if (horaIncubacionFija && horaIncubacionFija.value) {
        datos.hora_incubacion_fija = horaIncubacionFija.value;
    }
    
    const fechaLectura1 = document.getElementById('fecha_lectura_1');
    if (fechaLectura1 && fechaLectura1.value) {
        datos.fecha_lectura_1 = fechaLectura1.value;
    }
    
    const horaLectura1 = document.getElementById('hora_lectura_1');
    if (horaLectura1 && horaLectura1.value) {
        datos.hora_lectura_1 = horaLectura1.value;
    }
    
    const fechaLectura2 = document.getElementById('fecha_lectura_2');
    if (fechaLectura2 && fechaLectura2.value) {
        datos.fecha_lectura_2 = fechaLectura2.value;
    }
    
    const horaLectura2 = document.getElementById('hora_lectura_2');
    if (horaLectura2 && horaLectura2.value) {
        datos.hora_lectura_2 = horaLectura2.value;
    }
    
    // Agregar contadores para facilitar el procesamiento en el backend
    datos.num_fechas_siembra = datos.fechas_siembra.length;
    datos.num_horas_siembra = datos.horas_siembra.length;
    datos.num_horas_incubacion = datos.horas_incubacion.length;
    datos.num_fechas_lectura = datos.fechas_lectura.length;
    datos.num_horas_lectura = datos.horas_lectura.length;
    
    console.log('Datos recolectados:', datos);
    return datos;
}

// Inicializar la función cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado en crear_fechaYhoras.js, inicializando funciones...');
    
    // Verificar si estamos en la página correcta antes de inicializar
    if (document.getElementById('date_campo') || 
        document.getElementById('horaS_campo') || 
        document.getElementById('horaI-campo') ||
        document.getElementById('date_campo_lectura') ||
        document.getElementById('hora_campo_lectura')) {
        console.log('Página correcta detectada, inicializando crearFechasYHoras()');
        crearFechasYHoras();
    } else {
        console.log('No se encontraron los elementos necesarios para crearFechasYHoras()');
    }
});