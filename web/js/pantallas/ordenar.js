/* Pantalla de ordenar palabra: escribir la palabra con letras desordenadas.
   Espejo de interfaz/ordenar.py: las letras mezcladas en celdas; el
   jugador escribe en un <input> (como Leer en PSeInt) Enter ≡ botón;
   vacío → aviso en la burbuja de Pipo; validar_palabra ignora
   mayúsculas. El anagrama lo arma juegos.ordenar, no esta pantalla. */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.ordenar = (function () {
  "use strict";

  function mostrarOrdenar(padre, argumentos) {
    const a = argumentos || [];
    const ronda = a[0] || 0;
    const total = a[1] || 1;
    const aciertos = a[2] || 0;
    const puntosActividad = a[3] || 0;
    const respondida = !!a[4];
    const palabra = a[5];
    const ultimaCorrecta = !!a[6];

    const irAlMenu = function () {
      PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
    };
    PEA.ui.encabezadoActivar(PEA.estado.leerNombre(), irAlMenu);

    padre.append(PEA.ui.titulo("Ordenar palabra"));
    padre.append(PEA.ui.texto(
      PEA.ui.h("p", "texto-secundario fuente-num text-center mb-1"),
      "Ronda " + (ronda + 1) + " de " + total));

    const barra = PEA.ui.barraProgreso(Math.round(((ronda + 1) * 100) / total));
    barra.classList.add("seccion");
    padre.append(barra);

    /* Las letras desordenadas, separadas en celdas para que se lean. */
    const celdas = PEA.ui.h("div", "letras-mesa seccion");
    palabra.desordenada.split("").forEach(function (letra) {
      const celda = PEA.ui.h("span", "letra-celda");
      celda.textContent = letra;
      celdas.append(celda);
    });
    padre.append(celdas);

    if (!respondida) {
      mostrarEntrada(padre, ronda, total, aciertos, puntosActividad, palabra);
    } else {
      mostrarFeedback(padre, ronda, total, aciertos, puntosActividad,
        palabra, ultimaCorrecta);
    }
  }

  function mostrarEntrada(padre, ronda, total, aciertos, puntosActividad,
                          palabra) {
    /* Pipo da la instrucción; si se envía vacío, la burbuja se
       reutiliza para el aviso (como burbuja.config en Tk). */
    const burbuja = PEA.ui.crearPipo(padre,
      "Escribe la palabra correcta usando las letras desordenadas.",
      { ancho: "520px" });

    const form = PEA.ui.h("form", "seccion d-flex flex-column align-items-center gap-3",
      { novalidate: "novalidate", autocomplete: "off" });

    const entrada = PEA.ui.h("input", "pea-input", {
      type: "text",
      "aria-label": "Palabra a ordenar",
      autocomplete: "off",
      spellcheck: "false",
      style: "width:14rem;text-align:center;",
    });
    form.append(entrada);

    form.append(PEA.ui.h("button", "btn btn-pea", {
      type: "submit",
      html: "<i class=\"bi bi-check2-circle\" aria-hidden=\"true\"></i> Comprobar",
    }));

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      const intento = entrada.value;
      if (intento.trim() === "") {
        burbuja.textContent = "Escribe una palabra antes de comprobar.";
        entrada.focus();
        return;
      }
      const esCorrecta = PEA.juegos.ordenar.validarPalabra(
        intento, palabra.original);
      PEA.estado.sumarRespuesta(esCorrecta);
      PEA.sonidos.reproducir(esCorrecta ? "correcto" : "error");
      PEA.ui.refrescarEncabezado();
      PEA.ui.navegar(mostrarOrdenar, ronda, total,
        aciertos + (esCorrecta ? 1 : 0), puntosActividad, true,
        palabra, esCorrecta);
    });

    padre.append(form);
    entrada.focus();
  }

  function mostrarFeedback(padre, ronda, total, aciertos, puntosActividad,
                           palabra, ultimaCorrecta) {
    padre.append(PEA.ui.texto(
      PEA.ui.h("p", "fs-5 fw-semibold text-center seccion mb-0",
        { style: "color:" + (ultimaCorrecta
          ? "var(--correcto)" : "var(--incorrecto)") + ";" }),
      ultimaCorrecta ? "¡Correcto! +10 puntos" : "¡Incorrecto!"));

    /* Pipo muestra la palabra correcta. */
    PEA.ui.crearPipo(padre,
      "La palabra correcta era: " + palabra.original,
      { ancho: "520px" });

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
        const nuevaPalabra = PEA.juegos.ordenar.crearPalabra(
          PEA.estado.leerNivel());
        PEA.ui.navegar(mostrarOrdenar, ronda + 1, total, aciertos,
          puntosActividad, false, nuevaPalabra, null);
        return;
      }
      PEA.estado.completarActividad("ordenar");
      PEA.estado.sumarBonificacion();
      PEA.sonidos.reproducir("ganar");
      PEA.ui.navegar(PEA.pantallas.resultado.mostrarResultado,
        "¡Ordenar palabra terminado!", puntosActividad, total,
        aciertos);
    }
  }

  return { mostrarOrdenar: mostrarOrdenar };
})();
