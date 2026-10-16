/* Pantalla de completar palabra: elegir la letra que falta.
   Espejo de interfaz/completar.py: la palabra con hueco en celdas
   (.letra-celda.hueco) y tres botones de letra; la pregunta de cada
   ronda la crea juegos.completar.crearPregunta(nivel) — incluida la
   regla B1 de no ocultar la inicial. En feedback el guion bajo sigue
   visible (paridad con el escritorio: MEJORAS 4.7 está pendiente
   ahí también). */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.completar = (function () {
  "use strict";

  function mostrarCompletar(padre, argumentos) {
    const a = argumentos || [];
    const ronda = a[0] || 0;
    const total = a[1] || 1;
    const aciertos = a[2] || 0;
    const puntosActividad = a[3] || 0;
    const respondida = !!a[4];
    const pregunta = a[5];
    const elegida = a[6] || null;

    const irAlMenu = function () {
      PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
    };
    PEA.ui.encabezadoActivar(PEA.estado.leerNombre(), irAlMenu);

    padre.append(PEA.ui.titulo("Completar palabra"));
    padre.append(PEA.ui.texto(
      PEA.ui.h("p", "texto-secundario fuente-num text-center mb-1"),
      "Ronda " + (ronda + 1) + " de " + total));

    const barra = PEA.ui.barraProgreso(Math.round(((ronda + 1) * 100) / total));
    barra.classList.add("seccion");
    padre.append(barra);

    /* La palabra con un guion bajo en la letra que falta. */
    const celdas = PEA.ui.h("div", "letras-mesa seccion");
    PEA.juegos.completar.letrasConHueco(pregunta.palabra, pregunta.posicion)
      .forEach(function (letra) {
        const celda = PEA.ui.h("span", "letra-celda" +
          (letra === "_" ? " hueco" : ""));
        celda.textContent = letra;
        celdas.append(celda);
      });
    padre.append(celdas);

    const marco = PEA.ui.h("div",
      "row g-3 justify-content-center mx-auto", { style: "max-width:480px;" });
    marco.classList.add("mt-2");   /* separación extra de la mesa */
    if (!respondida) {
      mostrarOpciones(marco, padre, ronda, total, aciertos,
        puntosActividad, pregunta);
    } else {
      mostrarFeedback(padre, ronda, total, aciertos, puntosActividad,
        pregunta, elegida);
    }
    padre.append(marco);
  }

  function mostrarOpciones(marco, padre, ronda, total, aciertos,
                           puntosActividad, pregunta) {
    function responder(letra) {
      const esCorrecta = letra === pregunta.correcta;
      const ganados = PEA.estado.sumarRespuesta(esCorrecta);
      PEA.sonidos.reproducir(esCorrecta ? "correcto" : "error");
      PEA.ui.refrescarEncabezado();
      PEA.ui.navegar(mostrarCompletar, ronda, total,
        aciertos + (esCorrecta ? 1 : 0), puntosActividad + ganados,
        true, pregunta, letra);
    }

    pregunta.opciones.forEach(function (letra) {
      const col = PEA.ui.h("div", "col-auto");
      const boton = PEA.ui.h("button", "btn btn-letra", {
        type: "button",
        "aria-label": "Letra " + letra,
        onclick: function () { responder(letra); },
      });
      boton.append(document.createTextNode(letra));
      col.append(boton);
      marco.append(col);
    });
  }

  function mostrarFeedback(padre, ronda, total, aciertos, puntosActividad,
                           pregunta, elegida) {
    /* Las tres letras coloreadas: correcta verde (y con pulso, el
       equivalente web de _pulsar_letra_correcta), la elegida roja. */
    const marcoLetras = PEA.ui.h(
      "div", "row g-3 justify-content-center mx-auto");
    marcoLetras.style.maxWidth = "480px";

    pregunta.opciones.forEach(function (letra) {
      const col = PEA.ui.h("div", "col-auto");
      const boton = PEA.ui.h("button", "btn btn-letra", {
        type: "button",
        disabled: "disabled",
        "aria-disabled": "true",
      });
      if (letra === pregunta.correcta) {
        boton.classList.add("esta-correcta", "pulso-acierto");
      } else if (letra === elegida) {
        boton.classList.add("esta-incorrecta");
      }
      boton.append(document.createTextNode(letra));
      col.append(boton);
      marcoLetras.append(col);
    });
    padre.append(marcoLetras);

    const esCorrecta = elegida === pregunta.correcta;
    mostrarVeredicto(padre,
      esCorrecta
        ? "¡Correcto! +10 puntos"
        : "¡Incorrecto! La letra era: " + pregunta.correcta,
      esCorrecta ? "var(--correcto)" : "var(--incorrecto)",
      "La palabra completa es: " + pregunta.palabra, ronda, total,
      aciertos, puntosActividad);
  }

  function mostrarVeredicto(padre, textoVeredicto, colorVeredicto,
                            mensajePipo, ronda, total, aciertos,
                            puntosActividad) {
    padre.append(PEA.ui.texto(
      PEA.ui.h("p", "fs-5 fw-semibold text-center seccion mb-0",
        { style: "color:" + colorVeredicto + ";" }),
      textoVeredicto));

    PEA.ui.crearPipo(padre, mensajePipo, { ancho: "520px" });

    const pie = PEA.ui.h("div", "d-flex justify-content-center seccion");
    pie.append(PEA.ui.h("button", "btn btn-pea", {
      type: "button",
      html: "<i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i> Siguiente",
      "aria-label": "Siguiente ronda",
      onclick: siguiente,
    }));
    padre.append(pie);

    function siguiente() {
      PEA.sonidos.reproducir("clic");
      if (ronda + 1 < total) {
        const nuevaPregunta = PEA.juegos.completar.crearPregunta(
          PEA.estado.leerNivel());
        PEA.ui.navegar(mostrarCompletar, ronda + 1, total, aciertos,
          puntosActividad, false, nuevaPregunta, null);
        return;
      }
      PEA.estado.completarActividad("completar");
      PEA.estado.sumarBonificacion();
      PEA.sonidos.reproducir("ganar");
      PEA.ui.navegar(PEA.pantallas.resultado.mostrarResultado,
        "¡Completar palabra terminado!", puntosActividad, total,
        aciertos);
    }
  }

  return { mostrarCompletar: mostrarCompletar };
})();
