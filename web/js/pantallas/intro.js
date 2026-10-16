/* Pantalla breve de explicación justo antes de cada actividad.
   Espejo de interfaz/intro.py: Pipo explica **esa** actividad
   (PEA_DATOS.intros es datos, no un modelo de lenguaje) y "Empezar"
   llama a la pantalla del juego con su estado inicial; "Volver al
   menú" no arranca nada. */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.intro = (function () {
  "use strict";

  /* El dict "arranques" de intro.py, hoy como funciones reales:
     cada rama prepara el estado inicial de su juego con el nivel
     actual (el CEFR cambia rondas, parejas y preguntas). */
  function empezar(clave) {
    const nivel = PEA.estado.leerNivel();
    if (clave === "trivia") {
      PEA.ui.navegar(PEA.pantallas.trivia.mostrarTrivia,
        PEA.juegos.trivia.obtenerPreguntas(null, nivel),
        0, 0, 0, false, null);
    } else if (clave === "completar") {
      PEA.ui.navegar(PEA.pantallas.completar.mostrarCompletar,
        0, PEA.juegos.completar.cantidadRondas(nivel), 0, 0, false,
        PEA.juegos.completar.crearPregunta(nivel), null);
    } else if (clave === "ordenar") {
      PEA.ui.navegar(PEA.pantallas.ordenar.mostrarOrdenar,
        0, PEA.juegos.ordenar.cantidadRondas(nivel), 0, 0, false,
        PEA.juegos.ordenar.crearPalabra(nivel), null);
    } else if (clave === "memoria") {
      PEA.ui.navegar(PEA.pantallas.memoria.mostrarMemoria,
        PEA.juegos.memoria.crearTablero(nivel), 0, [], 0, false);
    } else {
      PEA.ui.navegar(PEA.pantallas.vocabulario.mostrarVocabulario, null, 0);
    }
  }

  function mostrarIntro(padre, argumentos) {
    const clave = (argumentos && argumentos[0]) || "vocabulario";
    const datos = PEA_DATOS.intros[clave] || PEA_DATOS.intros.vocabulario;
    const irAlMenu = function () {
      PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
    };

    PEA.ui.encabezadoActivar(PEA.estado.leerNombre(), irAlMenu);

    padre.append(
      PEA.ui.titulo(datos.titulo),
      PEA.ui.texto(PEA.ui.h("p", "texto-secundario text-center mb-0"),
        "Antes de empezar, esto es lo que vas a hacer:")
    );

    PEA.ui.crearPipo(padre, datos.pipo, { ancho: "560px" });

    const marco = PEA.ui.h(
      "div", "seccion d-flex justify-content-center gap-2 flex-wrap");
    marco.append(
      PEA.ui.h("button", "btn btn-pea btn-pea-acento", {
        type: "button",
        html: "<i class=\"bi bi-play\" aria-hidden=\"true\"></i> Empezar",
        "aria-label": "Empezar " + datos.titulo,
        onclick: function () {
          PEA.sonidos.reproducir("clic");
          empezar(clave);
        },
      }),
      PEA.ui.h("button", "btn btn-pea-ghost", {
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

  return { mostrarIntro: mostrarIntro };
})();
