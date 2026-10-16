/* Arranque de la web, espejo de main.py.
   No contiene reglas de trivia ni dibuja actividades: aplica el tema,
   precarga los WAV y muestra la pantalla inicial. La sesión vive en
   sessionStorage: si el jugador ya escribió su nombre en esta
   pestaña, se retoma el menú (en el escritorio los puntos empiezan en
   cero en cada arranque — diferencia documentada en 02-estado.js). */
window.PEA = window.PEA || {};

(function () {
  "use strict";

  PEA.ui.iniciar();

  if (PEA.estado.tieneNombre()) {
    PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
  } else {
    PEA.ui.navegar(PEA.pantallas.inicio.mostrarInicio);
  }
})();
