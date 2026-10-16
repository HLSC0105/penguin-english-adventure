/* Menú principal: cinco actividades, progreso y selector CEFR.
   Espejo de interfaz/menu.py: cada actividad abre ``mostrar_intro``,
   no el juego directo; el clic dispara sonido_clic (no el redibujo).
   Cambiar de nivel repinta el menú completo, como repintar_pantalla. */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.menu = (function () {
  "use strict";

  const ACTIVIDADES = [
    { nombre: "Aprender vocabulario", clave: "vocabulario" },
    { nombre: "Trivia", clave: "trivia" },
    { nombre: "Completar palabra", clave: "completar" },
    { nombre: "Ordenar palabra", clave: "ordenar" },
    { nombre: "Juego de memoria", clave: "memoria" },
  ];

  function mostrarMenu(padre) {
    const irAlMenu = function () { PEA.ui.navegar(mostrarMenu); };
    PEA.ui.encabezadoActivar(PEA.estado.leerNombre(), irAlMenu, false);

    padre.append(
      PEA.ui.titulo("Penguin English Adventure"),
      PEA.ui.subtitulo("Aprende inglés con Pipo")
    );

    PEA.ui.crearPipo(padre, PEA.ui.mensajePipo("saludo"));

    mostrarSelectorNivel(padre);
    mostrarProgreso(padre);
    mostrarActividades(padre);
    mostrarPie(padre);
  }

  /* Tres botones A1 / A2 / B1; el activo se marca con el acento. */
  function mostrarSelectorNivel(padre) {
    const nivel = PEA.estado.leerNivel();
    const envuelta = PEA.ui.h("div", "seccion d-flex justify-content-center");
    const caja = PEA.ui.h("div", "d-flex align-items-center gap-2 flex-wrap");
    caja.append(PEA.ui.texto(
      PEA.ui.h("span", "texto-secundario me-1"),
      "Tu nivel de inglés"));

    PEA.niveles.NIVELES.forEach(function (nivelOpcion) {
      const activo = nivelOpcion === nivel;
      const chip = PEA.ui.h("button", "btn pea-chip" + (activo ? " activa" : ""), {
        type: "button",
        "data-nivel": nivelOpcion,
        "aria-pressed": String(activo),
        html: nivelOpcion,
        onclick: function () {
          PEA.estado.establecerNivel(nivelOpcion);
          PEA.sonidos.reproducir("clic");
          PEA.ui.navegar(mostrarMenu);   /* el redibujo recalcula los datos */
        },
      });
      caja.append(chip);
    });
    envuelta.append(caja);
    padre.append(envuelta);
  }

  /* Barra y texto: "X de 5 actividades completadas (Y%)". */
  function mostrarProgreso(padre) {
    const caja = PEA.ui.h("div", "seccion mx-auto", { style: "max-width:430px;" });
    const barra = PEA.ui.barraProgreso(PEA.estado.progresoPorcentaje());
    caja.append(barra);
    caja.append(PEA.ui.texto(
      PEA.ui.h("p", "texto-secundario text-center fuente-num mt-2 mb-0"),
      PEA.estado.leerActividades().length + " de " +
      PEA.estado.C.totalActividades + " actividades completadas (" +
      PEA.estado.progresoPorcentaje() + "%)"));
    padre.append(caja);
  }

  /* Cuadrícula asimétrica: vocabulario destacado, el resto compacto.
     El detalle de cada ficha son datos reales del nivel actual. */
  function mostrarActividades(padre) {
    const nivel = PEA.estado.leerNivel();
    const categorias = PEA.niveles.categoriasDelNivel(nivel);
    const palabras = PEA.niveles.palabrasDelNivel(nivel);
    const parametros = PEA.niveles.parametrosNivel(nivel);
    const preguntas = Math.min(
      parametros.trivia, PEA.niveles.preguntasDelNivel(nivel).length);
    const parejas = Math.min(
      parametros.memoriaParejas, PEA.niveles.parejasDelNivel(nivel).length);

    const gripa = PEA.ui.h("div", "seccion");
    const fila = PEA.ui.h("div", "row g-3");

    /* --- ficha destacada: vocabulario (estudio, no examen) --- */
    const colDestacada = PEA.ui.h("div", "col-12 col-md-6");
    colDestacada.append(fichaActividad("vocabulario", null, function (ficha) {
      ficha.classList.add("ficha-vocabulario");
      const muestras = PEA.ui.h("div", "ficha-muestras");
      palabras.slice(0, 4).forEach(function (palabra) {
        if (!palabra.imagen) return;
        muestras.append(PEA.media.crearImg("assets/img/" + palabra.imagen, {
          alt: palabra.ingles,
          title: palabra.ingles,
        }));
      });
      ficha.append(muestras);
    }, palabras.length + " palabras · " + Object.keys(categorias).length +
       " categorías · para estudiar, sin puntos"));
    fila.append(colDestacada);

    /* --- las cuatro restantes --- */
    const compactas = [
      ["trivia", "bi-patch-question", preguntas + " preguntas"],
      ["completar", "bi-brush", parametros.completar + " rondas"],
      ["ordenar", "bi-sort-down-alt", parametros.ordenar + " rondas"],
      ["memoria", "bi-layout-three-columns", parejas + " parejas"],
    ];

    const columna = PEA.ui.h("div", "col-12 col-md-6");
    const pila = PEA.ui.h("div", "row g-3");

    compactas.forEach(function (definicion) {
      const col = PEA.ui.h("div", "col-6");
      col.append(fichaActividad(definicion[0], definicion[1], null, definicion[2]));
      pila.append(col);
    });
    columna.append(pila);
    fila.append(columna);

    gripa.append(fila);
    padre.append(gripa);
  }

  function fichaActividad(clave, icono, extra, detalle) {
    const completada = PEA.estado.actividadCompletada(clave);
    let nombre = "Aprender vocabulario";
    ACTIVIDADES.forEach(function (act) {
      if (act.clave === clave) nombre = act.nombre;
    });

    const ficha = PEA.ui.h("button", "btn ficha-actividad" +
      (completada ? " completada" : "") + (clave === "vocabulario" ? " ficha-vocabulario" : ""), {
      type: "button",
      onclick: function () {
        PEA.sonidos.reproducir("clic");
        PEA.ui.navegar(PEA.pantallas.intro.mostrarIntro, clave);
      },
    });

    const nombreNodo = PEA.ui.h("span", "ficha-nombre");
    if (icono) {
      nombreNodo.append(
        PEA.ui.h("i", "bi " + icono, { "aria-hidden": "true" }));
    }
    nombreNodo.append(document.createTextNode(nombre));
    if (completada) {
      nombreNodo.append(PEA.ui.h("i", "bi bi-check2-circle ficha-hecha", {
        "aria-hidden": "true",
        title: "Actividad completada",
      }));
    }
    ficha.append(nombreNodo);
    ficha.append(PEA.ui.texto(
      PEA.ui.h("span", "ficha-detalle d-block"), detalle));
    if (typeof extra === "function") extra(ficha);
    ficha.setAttribute("aria-label",
      nombre + (completada ? ", ya completada" : "") + ", " + detalle);
    return ficha;
  }

  /* Ayuda y cerrar sesión (el "Salir" del escritorio). */
  function mostrarPie(padre) {
    const caja = PEA.ui.h("div", "seccion d-flex justify-content-center gap-2 flex-wrap");
    caja.append(
      PEA.ui.h("button", "btn btn-pea-ghost", {
        type: "button",
        html: "<i class=\"bi bi-question-circle\" aria-hidden=\"true\"></i> ¿Cómo jugar?",
        onclick: function () {
          PEA.sonidos.reproducir("clic");
          PEA.ui.navegar(PEA.pantallas.ayuda.mostrarAyuda);
        },
      }),
      PEA.ui.h("button", "btn btn-pea-ghost", {
        type: "button",
        html: "<i class=\"bi bi-code-square\" aria-hidden=\"true\"></i> ¿Cómo está hecho?",
        onclick: function () {
          PEA.sonidos.reproducir("clic");
          PEA.ui.navegar(PEA.pantallas.documentacion.mostrarDocumentacion);
        },
      }),
      PEA.ui.h("button", "btn btn-pea-ghost", {
        type: "button",
        html: "<i class=\"bi bi-box-arrow-right\" aria-hidden=\"true\"></i> Cerrar sesión",
        "aria-label": "Cerrar sesión y borrar tus puntos de esta pestaña",
        onclick: function () {
          PEA.sonidos.reproducir("clic");
          PEA.estado.cerrarSesion();
          PEA.ui.navegar(PEA.pantallas.inicio.mostrarInicio);
        },
      })
    );
    padre.append(caja);

    const pie = PEA.ui.h("p", "pie-creditos");
    const enlace = PEA.ui.h("a", "", { href: "ATRIBUCIONES.md" });
    enlace.textContent = "ATRIBUCIONES.md";
    pie.append(
      document.createTextNode("Emojis: OpenMoji (licencia abierta) · "),
      enlace
    );
    padre.append(pie);
  }

  return { mostrarMenu: mostrarMenu };
})();
