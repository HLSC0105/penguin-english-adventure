/* Pantalla de ayuda: explica cada actividad, el CEFR y los puntos.
   Espejo de interfaz/ayuda.py: manual estático en tres bloques dentro
   de una tarjeta; no cambia el puntaje. Pipo usa mensaje "ayuda". */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.ayuda = (function () {
  "use strict";

  /* Mismo contenido que ayuda.py: cada renglón es una línea propia
     (en Tk era "\n" dentro de un Label, acá un <p> por línea). */
  const BLOQUES = [
    ["Actividades",
      ["1. Aprender vocabulario: mira las palabras y sus imágenes.",
       "2. Trivia: responde preguntas de opción múltiple.",
       "3. Completar palabra: elige la letra que falta.",
       "4. Ordenar palabra: escribe la palabra con sus letras desordenadas.",
       "5. Juego de memoria: encuentra cada palabra con su imagen."]],
    ["Puntos",
      ["Cada respuesta correcta vale 10 puntos y, al terminar una",
       "actividad, ganas 20 puntos de bonificación. El progreso está",
       "en la barra del menú."]],
    ["Niveles CEFR",
      ["A1: palabras del día a día. A2: escuela, casa y clima.",
       "B1: ideas más abstractas y collocations. El nivel más alto",
       "incluye el vocabulario de los anteriores (filtro acumulativo)."]],
  ];

  function mostrarAyuda(padre) {
    const irAlMenu = function () {
      PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
    };

    PEA.ui.encabezadoActivar(PEA.estado.leerNombre(), irAlMenu);

    padre.append(
      PEA.ui.titulo("¿Cómo jugar?"),
      PEA.ui.subtitulo("El manual corto de Penguin English Adventure")
    );

    PEA.ui.crearPipo(padre, PEA.ui.mensajePipo("ayuda"));

    const tarjeta = PEA.ui.h("div", "pea-tarjeta seccion medida mx-auto");
    BLOQUES.forEach(function (bloque) {
      const caja = PEA.ui.h("div", "bloque-ayuda");
      caja.append(PEA.ui.texto(PEA.ui.h("h3"), bloque[0]));
      bloque[1].forEach(function (linea) {
        caja.append(PEA.ui.texto(PEA.ui.h("p"), linea));
      });
      tarjeta.append(caja);
    });
    padre.append(tarjeta);

    const marco = PEA.ui.h(
      "div", "seccion d-flex justify-content-center");
    marco.append(
      PEA.ui.h("button", "btn btn-pea", {
        type: "button",
        html: "<i class=\"bi bi-arrow-left\" aria-hidden=\"true\"></i> Volver al menú",
        onclick: function () {
          PEA.sonidos.reproducir("clic");
          irAlMenu();
        },
      })
    );
    padre.append(marco);
  }

  return { mostrarAyuda: mostrarAyuda };
})();
