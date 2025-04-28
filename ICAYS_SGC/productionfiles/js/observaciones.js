// document.addEventListener('DOMContentLoaded', function() {
//     // Elementos del DOM
//     const btn = document.getElementById('observacionesBtn');
//     const modal = document.getElementById('observacionesModal');
//     const span = document.getElementsByClassName('close')[0];
//     const textarea = document.getElementById('observacionesText');
//     const guardarBtn = document.getElementById('guardarObservaciones');
    
//     // Cargar observaciones guardadas al iniciar
//     cargarObservaciones();
    
//     // Abrir modal al hacer clic en el botón
//     btn.onclick = function() {
//       modal.style.display = 'block';
//     }
    
//     // Cerrar modal al hacer clic en la X
//     span.onclick = function() {
//       modal.style.display = 'none';
//     }
    
//     // Cerrar modal al hacer clic fuera del contenido
//     window.onclick = function(event) {
//       if (event.target == modal) {
//         modal.style.display = 'none';
//       }
//     }
    
//     // Guardar observaciones
//     guardarBtn.onclick = function() {
//       guardarObservaciones();
//       modal.style.display = 'none';
//     }
    
//     // Función para cargar observaciones guardadas
//     function cargarObservaciones() {
//       const observacionesGuardadas = localStorage.getItem('documentoObservaciones');
//       if (observacionesGuardadas) {
//         textarea.value = observacionesGuardadas;
//       }
//     }
    
//     // Función para guardar observaciones en localStorage
//     function guardarObservaciones() {
//       const texto = textarea.value;
//       localStorage.setItem('documentoObservaciones', texto);
//     }

//     function guardarObservaciones() {
//         const textoExistente = localStorage.getItem('documentoObservaciones') || '';
//         const fecha = new Date().toLocaleString();
//         const textoNuevo = textarea.value;
        
//         const textoCompleto = textoExistente 
//           ? `${textoExistente}\n\n--- ${fecha} ---\n${textoNuevo}`
//           : `--- ${fecha} ---\n${textoNuevo}`;
          
//         localStorage.setItem('documentoObservaciones', textoCompleto);
//         textarea.value = textoCompleto;
//       }
      
//   });
/**
 * Script original para manejar el modal de observaciones
 * Modificado para ser compatible con campos-seleccionables.js
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando script de observaciones original...');
  
  // Verificar si el nuevo script ya está manejando el modal
  if (window.camposSeleccionablesActivo) {
      console.log('El script campos-seleccionables.js ya está manejando el modal de observaciones');
      return;
  }
  
  // Elementos del DOM
  const modal = document.getElementById("observacionesModal");
  const btn = document.getElementById("observacionesBtn");
  const span = document.getElementsByClassName("close")[0];
  const guardarBtn = document.getElementById("guardarObservaciones");
  
  // Marcar que este script está activo
  window.observacionesScriptActivo = true;
  
  // Solo configurar eventos si no están siendo manejados por el otro script
  if (!window.camposSeleccionablesActivo) {
      // Cuando el usuario hace clic en el botón, abrir el modal
      if (btn) {
          btn.onclick = function() {
              modal.style.display = "block";
          }
      }
      
      // Cuando el usuario hace clic en <span> (x), cerrar el modal
      if (span) {
          span.onclick = function() {
              modal.style.display = "none";
          }
      }
      
      // Cuando el usuario hace clic en cualquier lugar fuera del modal, cerrarlo
      window.onclick = function(event) {
          if (event.target == modal) {
              modal.style.display = "none";
          }
      }
      
      // Cuando el usuario hace clic en guardar, cerrar el modal
      if (guardarBtn) {
          guardarBtn.onclick = function() {
              // Aquí puedes agregar código para guardar las observaciones
              modal.style.display = "none";
          }
      }
  }
  
  console.log('Script de observaciones original inicializado');
});