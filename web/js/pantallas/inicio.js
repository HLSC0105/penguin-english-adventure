/* Pantalla de inicio: Pipo saluda y el jugador escribe su nombre.
   Espejo de interfaz/inicio.py: strip y validación; vacío → mensaje
   "Escribe tu nombre para continuar."; Enter equivale al botón. */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.inicio = (function () {
  "use strict";

  function mostrarInicio(padre) {
    PEA.ui.encabezadoOcultar();

    padre.append(
      PEA.ui.titulo("Penguin English Adventure"),
      PEA.ui.subtitulo("¡Aprende inglés con un pingüino!")
    );

    PEA.ui.crearPipo(
      padre,
      "¡Hola! Soy Pipo. Escribe tu nombre, elige tu nivel y " +
      "comencemos a aprender."
    );

    const bloque = PEA.ui.h("div", "seccion-acto medida text-center");
    padre.append(bloque);

    const etiqueta = PEA.ui.texto(
      PEA.ui.h("h2", "fs-5 fw-semibold mb-2"), "¿Cómo te llamas?");
    bloque.append(etiqueta);

    const form = PEA.ui.h("form", "mx-auto", {
      style: "max-width:22rem;",
      novalidate: "novalidate",
    });
    bloque.append(form);

    const entrada = PEA.ui.h("input", "pea-input w-100 mb-2", {
      type: "text",
      placeholder: "Tu nombre",
      maxlength: "24",
      "aria-label": "Tu nombre",
      autocomplete: "off",
    });
    form.append(entrada);

    const error = PEA.ui.h("div", "error-mensaje min-height-1", {
      style: "min-height:1.4rem;",
    });
    form.append(error);

    /* Selector de nivel: el activo usa el acento (como en Tk). */
    const eleccion = { nivel: PEA.estado.leerNivel() };
    const marcoNivel = PEA.ui.h("div", "d-flex justify-content-center align-items-baseline flex-wrap mt-1 mb-3");
    const rotuloNivel = PEA.ui.texto(
      PEA.ui.h("span", "texto-secundario me-2"), "Nivel CEFR");
    marcoNivel.append(rotuloNivel);
    const chips = [];

    function pintarNiveles() {
      chips.forEach(function (chip) {
        const activo = chip.dataset.nivel === eleccion.nivel;
        chip.classList.toggle("activa", activo);
        chip.setAttribute("aria-pressed", String(activo));
      });
    }

    PEA.niveles.NIVELES.forEach(function (nivel) {
      const chip = PEA.ui.h("button", "btn pea-chip", {
        type: "button",
        "data-nivel": nivel,
        html: nivel,
        onclick: function () {
          eleccion.nivel = nivel;
          PEA.estado.establecerNivel(nivel);
          pintarNiveles();
          PEA.sonidos.reproducir("clic");
        },
      });
      chips.push(chip);
      marcoNivel.append(chip);
    });
    pintarNiveles();
    form.append(marcoNivel);

    const botonComenzar = PEA.ui.h("button", "btn btn-pea btn-pea-acento w-100", {
      type: "submit",
      html: "<i class=\"bi bi-play\" aria-hidden=\"true\"></i> ¡Comenzar!",
    });
    form.append(botonComenzar);

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      const nombre = entrada.value.trim();
      if (nombre === "") {
        error.textContent = "Escribe tu nombre para continuar.";
        entrada.focus();
        return;
      }
      error.textContent = "";
      PEA.estado.establecerNombre(nombre);
      PEA.estado.establecerNivel(eleccion.nivel);
      PEA.sonidos.reproducir("clic");
      PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
    });
  }

  return { mostrarInicio: mostrarInicio };
})();
