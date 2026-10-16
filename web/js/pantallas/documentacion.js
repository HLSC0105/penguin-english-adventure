/* Sección de documentación dentro del sitio: el manual académico del
   código fuente, en el mismo estilo de los docstrings de Python (cada
   módulo explica el POR QUÉ). Espejo conceptual de docs/DOCUMENTACION
   y docs/ARQUITECTURA, pero navegable dentro del juego: mismo
   cascarón, misma cascada, mismo tema. Las capturas (desktop/tablet/
   móvil, oscuro/claro) viven en assets/capturas/ — autocontenidas. */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.documentacion = (function () {
  "use strict";

  /* --- mapa de módulos: el paquete Python y su espejo web --- */
  const MODULOS = [
    ["datos (vocabulario · trivia · memoria · pipo · niveles)",
     "El único origen de verdad del contenido: 309 palabras en 20 categorías, 107 preguntas, 16 parejas y los mensajes de Pipo, etiquetados por nivel CEFR. El escritorio los importa directo; la web los RECIBE: scripts/web_exportar.py emite web/js/00-datos.js desde estos módulos reales — la web nunca duplica el banco.",
     "00-datos.js"],
    ["juegos/ (trivia · completar · ordenar · memoria)",
     "La lógica pura sin interfaz: elegir preguntas, crear huecos (con la regla B1 de no ocultar la inicial), desordenar letras, armar el tablero de parejas y validar. Misma funciones, dos front-ends.",
     "04-juegos.js"],
    ["utilidades/puntuacion.py",
     "Acumuladores: +10 por acierto, +20 de bonificación, registro de actividades. En el escritorio viven en memoria del proceso; en la web viven en sessionStorage (sobreviven recargas de la pestaña y se limpian al cerrarla).",
     "02-estado.js"],
    ["utilidades/sonidos.py",
     "pygame.mixer con WAV locales y caída amable: sin mixer, el juego sigue con aviso. La web mantiene la promesa con un POOL de 3 nodos de audio por efecto: un efecto que aún suena no se corta y un nodo dañado se reconstruye.",
     "03-sonidos.js"],
    ["interfaz/componentes.py",
     "El cascarón: encabezado persistente, título, Pipo y su burbuja, temas claro/oscuro (los 20 tokens) y repintar_pantalla.",
     "05-componentes.js"],
    ["interfaz/animaciones.py",
     "Tkinter no tiene motor de tween: encadena after() con interpolación y ease_out_cubic. En la web el mismo lenguaje existe nativo: keyframes CSS con la misma curva de salida.",
     "keyframes en estilos.css"],
    ["interfaz/lienzo_pygame.py",
     "El volteo 2.5D de las cartas y el confeti de celebración, dibujados con pygame y proyección cos θ. La web logra el mismo efecto con transform: rotateY + perspective de CSS — el navegador sí tiene motor de tween.",
     "cartas .memoria-carta + confeti canvas"],
    ["interfaz/*.py (pantallas)",
     "Cada pantalla: inicio con validación, menú con selector CEFR, vocabulario paginado, los tres juegos con feedback y el resultado con mensaje de Pipo por porcentaje.",
     "pantallas/*.js"],
  ];

  /* --- tabla de equivalencias Tkinter ↔ Web --- */
  const EQUIVALENCIAS = [
    ["crear_encabezado()", "encabezadoActivar() + HUD pill", "El encabezado persiste entre pantallas; el tema repinta la etiqueta."],
    ["repintar_pantalla(ventana, fn, args)", "PEA.ui.navegar(fn, args)", "El estado viaja en parámetros; la web añade fase de salida (95 ms) + cascada de entrada."],
    ["after(ms, paso) + ease_out_cubic", "requestAnimationFrame + CSS keyframes", "El navegador ya trae el tween: transform/opacity en el compositor."],
    ["Frame offset detrás (sombra)", "box-shadow en 3 niveles (--elev-1/2/3)", "En fondo #000 el volumen se logra con glow azul + bevel de luz, no con paleta nueva."],
    ["canvas pygame (LienzoMemoria)", "cartas HTML con perspective 900px", "El giro 3D lo hace rotateY; la sombra la proyecta el wrapper plano."],
    ["puntuacion en variables del proceso", "sessionStorage con JSON", "Sobrevive recargas; «Cerrar sesión» borra la clave, como el botón Salir."],
    ["main.py (Tk, mainloop)", "06-main.js + splash (carga.js)", "Arranque: tema, sonidos precargados, pantalla de carga y el inicio."],
  ];

  /* --- conceptos académicos clave --- */
  const CONCEPTOS = [
    ["Bucle de eventos",
     "El juego no espera bloqueando: reacciona. En Tk, el mainloop recibe eventos; en la web, el bucle del navegador dispara los callbacks de clic y los rAF de animación. Un algoritmo PSeInt se convierte en este modelo: escribir → enter → pantalla nueva."],
    ["Estado en parámetros",
     "Ninguna pantalla guarda su propio estado: el índice de pregunta, los aciertos y la palabra van como ARGUMENTOS de la pantalla siguiente. Así el «back» y el redibujado no se desincronizan nunca."],
    ["CEFR acumulativo",
     "A2 incluye A1; B1 incluye los dos. El filtro compara índices en la tupla de niveles, y el nivel también cambia constantes de reto: rondas, parejas, espera del flip y si se oculta la inicial."],
    ["Degradación amable",
     "Sin sonido (mixer o autoplay), sin imagen (círculo con letra), sin red (todo es local) — el juego SIEMPRE se juega. Cada punto de falla tiene un camino de respaldo visible."],
    ["Movimiento reducido",
     "prefers-reduced-motion apaga cascadas, reparto y confeti, pero conserva la elevación estática: la jerarquía visual no depende del movimiento."],
  ];

  function mostrarDocumentacion(padre) {
    const irAlMenu = function () {
      PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
    };
    PEA.ui.encabezadoActivar(PEA.estado.leerNombre(), irAlMenu);

    padre.append(
      PEA.ui.titulo("¿Cómo está hecho?"),
      PEA.ui.subtitulo("El código fuente explicado de forma académica, como en Python")
    );

    PEA.ui.crearPipo(padre,
      "Esta pantalla es la documentación del proyecto: por qué cada módulo existe y cómo el escritorio y la web hablan el mismo idioma.",
      { ancho: "560px" });

    /* ---------- 1. mapa de módulos ---------- */
    const seccionModulos = PEA.ui.h("div", "seccion");
    seccionModulos.append(PEA.ui.texto(PEA.ui.h("h2", "titulo-seccion"),
      "1. El mapa del código: Python ↔ Web"));
    Object.keys(MODULOS).forEach(function (indice) {
      const modulo = MODULOS[indice];
      const caja = PEA.ui.h("div", "pea-tarjeta doc-modulo");
      caja.append(PEA.ui.texto(PEA.ui.h("h3", "doc-modulo-titulo"),
        modulo[0]));
      caja.append(PEA.ui.texto(PEA.ui.h("p", "doc-texto"), modulo[1]));
      caja.append(PEA.ui.texto(PEA.ui.h("p", "doc-espejo"),
        "Web → " + modulo[2]));
      seccionModulos.append(caja);
    });
    padre.append(seccionModulos);

    /* ---------- 2. equivalencias ---------- */
    const seccionEquiva = PEA.ui.h("div", "seccion");
    seccionEquiva.append(PEA.ui.texto(PEA.ui.h("h2", "titulo-seccion"),
      "2. Tabla de equivalencias Tkinter ↔ Web"));
    const marcoTabla = PEA.ui.h("div", "table-responsive");
    const tabla = PEA.ui.h("table", "table doc-tabla");
    tabla.append(cabezalTabla());
    const cuerpoTabla = PEA.ui.h("tbody");
    EQUIVALENCIAS.forEach(function (fila) {
      const renglon = PEA.ui.h("tr");
      ["doc-celda-codigo", "doc-celda-codigo", "doc-celda-texto"].forEach(function (clase, i) {
        renglon.append(PEA.ui.texto(PEA.ui.h(i < 2 ? "code" : "td", clase), fila[i]));
      });
      cuerpoTabla.append(renglon);
    });
    tabla.append(cuerpoTabla);
    marcoTabla.append(tabla);
    seccionEquiva.append(marcoTabla);
    padre.append(seccionEquiva);

    /* ---------- 3. conceptos ---------- */
    const seccionConceptos = PEA.ui.h("div", "seccion");
    seccionConceptos.append(PEA.ui.texto(PEA.ui.h("h2", "titulo-seccion"),
      "3. Conceptos académicos clave"));
    CONCEPTOS.forEach(function (concepto) {
      const caja = PEA.ui.h("div", "pea-tarjeta doc-concepto");
      caja.append(PEA.ui.texto(PEA.ui.h("h3", "doc-concepto-titulo"),
        concepto[0]));
      caja.append(PEA.ui.texto(PEA.ui.h("p", "doc-texto"), concepto[1]));
      seccionConceptos.append(caja);
    });
    padre.append(seccionConceptos);

    /* ---------- 4. capturas premium ---------- */
    padre.append(capturas());

    /* ---------- regreso ---------- */
    const pie = PEA.ui.h("div", "d-flex justify-content-center seccion");
    pie.append(PEA.ui.h("button", "btn btn-pea", {
      type: "button",
      html: "<i class=\"bi bi-arrow-left\" aria-hidden=\"true\"></i> Volver al menú",
      onclick: function () {
        PEA.sonidos.reproducir("clic");
        irAlMenu();
      },
    }));
    padre.append(pie);
  }

  function cabezalTabla() {
    const cabeza = PEA.ui.h("thead");
    const renglon = PEA.ui.h("tr");
    ["Tkinter (escritorio)", "Web", "Por qué es igual"].forEach(function (texto) {
      renglon.append(PEA.ui.texto(PEA.ui.h("th"), texto));
    });
    cabeza.append(renglon);
    return cabeza;
  }

  /* La cuadrícula de capturas: desktop, tablet, móvil en los dos temas.
     Las imagenes se generan del build final y viven en assets/capturas. */
  function capturas() {
    const envuelta = PEA.ui.h("div", "seccion");
    envuelta.append(PEA.ui.texto(PEA.ui.h("h2", "titulo-seccion"),
      "4. Capturas del producto"));
    const gripa = PEA.ui.h("div", "row g-3");
    [
      ["captura-escritorio-oscuro.png", "Escritorio · tema oscuro — el menú con fichas flotantes"],
      ["captura-escritorio-claro.png", "Escritorio · tema claro — hielo diurno"],
      ["captura-tablet-oscuro.png", "Tablet 834px — la grilla se reordena"],
      ["captura-movil-oscuro.png", "Móvil 390px — HUD condensado y tablero de 3 columnas"],
    ].forEach(function (par) {
      const col = PEA.ui.h("div", "col-12 col-md-6");
      const figura = PEA.ui.h("figure", "pea-tarjeta doc-captura");
      figura.append(PEA.media.crearImg("assets/capturas/" + par[0], {
        clase: "doc-captura-img",
        alt: par[1],
      }));
      figura.append(PEA.ui.texto(PEA.ui.h("figcaption", "doc-caption"), par[1]));
      col.append(figura);
      gripa.append(col);
    });
    envuelta.append(gripa);
    return envuelta;
  }

  return { mostrarDocumentacion: mostrarDocumentacion };
})();
