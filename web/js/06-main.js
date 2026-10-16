/* Arranque de la web, espejo de main.py.
   No contiene reglas de trivia ni dibuja actividades: aplica el tema,
   precarga los WAV y muestra la pantalla de carga (splash) sobre la
   pantalla inicial ya viva — así la disolución del splash no salta.
   La sesión vive en sessionStorage: si el jugador ya escribió su
   nombre en esta pestaña, el juego sigue en el menú. */
window.PEA = window.PEA || {};

(function () {
  "use strict";

  PEA.ui.iniciar();

  /* La pantalla real se pinta DEBAJO del splash: cuando el velo la
     disuelve, ya está lista (sin blanco de arranque). */
  if (PEA.estado.tieneNombre()) {
    PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
  } else {
    PEA.ui.navegar(PEA.pantallas.inicio.mostrarInicio);
  }

  /* El splash: siempre en cada apertura (como en videojuegos),
     2.2 s de secuencia, saltáble con un toque. */
  PEA.pantallas.carga.mostrar();
})();
