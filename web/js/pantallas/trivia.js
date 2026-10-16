/* Pantalla de trivia: preguntas de opción múltiple.
   Espejo de interfaz/trivia.py: la UI no elige preguntas; recibe la
   lista de PEA.juegos.trivia (opciones ya barajadas). El estado
   (índice, aciertos, respondida, elegida) viaja en los argumentos de
   navegar: responder vuelve a llamar mostrarTrivia con los valores
   nuevos — un ciclo PSeInt desenrollado en callbacks. */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.trivia = (function () {
  "use strict";

  function mostrarTrivia(padre, argumentos) {
    const a = argumentos || [];
    const preguntas = a[0] || [];
    const indice = a[1] || 0;
    const aciertos = a[2] || 0;
    const puntosActividad = a[3] || 0;
    const respondida = !!a[4];
    const elegida = a[5] || null;

    const irAlMenu = function () {
      PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
    };
    PEA.ui.encabezadoActivar(PEA.estado.leerNombre(), irAlMenu);

    const pregunta = preguntas[indice];
    const total = preguntas.length;

    padre.append(PEA.ui.titulo("Trivia"));
    padre.append(PEA.ui.texto(
      PEA.ui.h("p", "texto-secundario fuente-num text-center mb-1"),
      "Pregunta " + (indice + 1) + " de " + total));

    /* La barra crece con la transición de Bootstrap (0 → objetivo). */
    const barra = PEA.ui.barraProgreso(Math.round(
      ((indice + 1) * 100) / total));
    barra.classList.add("seccion");
    padre.append(barra);

    padre.append(PEA.ui.texto(
      PEA.ui.h("p", "fs-4 fw-semibold text-center mb-3"),
      pregunta.pregunta));

    /* Grilla 2×2 de botones A–D; en feedback quedan coloreados y
       muertos, como los botones deshabilitados de Tk. */
    const marco = PEA.ui.h("div", "row g-3 mx-auto",
      { style: "max-width:660px;" });
    if (!respondida) {
      mostrarOpciones(marco, preguntas, indice, aciertos,
        puntosActividad, pregunta);
    } else {
      mostrarFeedback(marco, padre, preguntas, indice, aciertos,
        puntosActividad, pregunta, elegida);
    }
    padre.append(marco);
  }

  function mostrarOpciones(marco, preguntas, indice, aciertos,
                           puntosActividad, pregunta) {
    const letras = ["A", "B", "C", "D"];

    function responder(textoOpcion) {
      const esCorrecta = PEA.juegos.trivia.validarRespuesta(pregunta, textoOpcion);
      const ganados = PEA.estado.sumarRespuesta(esCorrecta);
      PEA.sonidos.reproducir(esCorrecta ? "correcto" : "error");
      PEA.ui.refrescarEncabezado();   /* los puntos del HUD cambiaron */
      PEA.ui.navegar(mostrarTrivia, preguntas, indice,
        aciertos + (esCorrecta ? 1 : 0), puntosActividad + ganados,
        true, textoOpcion);
    }

    pregunta.opciones.forEach(function (opcion, posicion) {
      const col = PEA.ui.h("div", "col-12 col-sm-6");
      const boton = PEA.ui.h("button", "btn btn-opcion", {
        type: "button",
        onclick: function () { responder(opcion); },
      });
      boton.append(document.createTextNode(
        letras[posicion] + ". " + opcion));
      col.append(boton);
      marco.append(col);
    });
  }

  function mostrarFeedback(marco, padre, preguntas, indice, aciertos,
                           puntosActividad, pregunta, elegida) {
    const letras = ["A", "B", "C", "D"];

    pregunta.opciones.forEach(function (opcion, posicion) {
      const col = PEA.ui.h("div", "col-12 col-sm-6");
      const boton = PEA.ui.h("button", "btn btn-opcion", {
        type: "button",
        disabled: "disabled",
        "aria-disabled": "true",
      });
      if (opcion === pregunta.correcta) {
        boton.classList.add("esta-correcta", "pulso-acierto");
      } else if (opcion === elegida) {
        boton.classList.add("esta-incorrecta");
      } else {
        boton.classList.add("quieto");   /* neutra: apagada durante la revisión */
      }
      boton.append(document.createTextNode(letras[posicion] + ". " + opcion));
      col.append(boton);
      marco.append(col);
    });

    /* Etiqueta del veredicto, igual que las dos cadenas de Tk. */
    if (elegida === pregunta.correcta) {
      padre.append(PEA.ui.texto(
        PEA.ui.h("p", "fs-5 fw-semibold text-center seccion mb-0",
          { style: "color:var(--correcto);" }),
        "¡Correcto! +10 puntos"));
    } else {
      padre.append(PEA.ui.texto(
        PEA.ui.h("p", "fs-5 fw-semibold text-center seccion mb-0",
          { style: "color:var(--incorrecto);" }),
        "¡Incorrecto! La respuesta era: " + pregunta.correcta));
    }

    PEA.ui.crearPipo(padre, pregunta.explicacion, { ancho: "520px" });

    const pie = PEA.ui.h("div", "d-flex justify-content-center seccion");
    pie.append(PEA.ui.h("button", "btn btn-pea", {
      type: "button",
      html: "<i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i> Siguiente",
      "aria-label": "Siguiente pregunta",
      onclick: siguiente,
    }));
    padre.append(pie);

    function siguiente() {
      PEA.sonidos.reproducir("clic");
      if (indice + 1 < preguntas.length) {
        PEA.ui.navegar(mostrarTrivia, preguntas, indice + 1, aciertos,
          puntosActividad, false, null);
        return;
      }
      /* Fin: bonificación ya sumada al entrar a resultado (si se
         sumara tras el redibujo del tema, se duplicaría — mismo orden
         que resultado.py pide en su docstring). */
      PEA.estado.completarActividad("trivia");
      PEA.estado.sumarBonificacion();
      PEA.sonidos.reproducir("ganar");
      PEA.ui.navegar(PEA.pantallas.resultado.mostrarResultado,
        "¡Trivia completada!", puntosActividad, preguntas.length,
        aciertos);
    }
  }

  return { mostrarTrivia: mostrarTrivia };
})();
