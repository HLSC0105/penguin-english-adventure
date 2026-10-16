/* Sección de documentación dentro del sitio: el manual académico del
   código fuente, en el mismo estilo de los docstrings de Python (cada
   módulo explica el POR QUÉ). Navegable dentro del juego: mismo
   cascarón, misma cascada, mismo tema. Contenido ampliado:
   1 módulos · 2 árbol · 3 equivalencias · 4 conceptos · 5 decisiones
   6 métricas · 7 reproducir/distribuir · 8 capturas · enlace al repo. */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.documentacion = (function () {
  "use strict";

  const REPO = "https://github.com/HLSC0105/penguin-english-adventure";

  /* --- 1. mapa de módulos: el paquete Python y su espejo web --- */
  const MODULOS = [
    ["datos/ (vocabulario · trivia · memoria · pipo · niveles)",
     "El único origen de verdad del contenido: 309 palabras en 20 categorías, 107 preguntas de trivia, 16 parejas y los mensajes de Pipo, cada entrada etiquetada con su nivel CEFR. El escritorio importa estos módulos directo; la web los RECIBE: scripts/web_exportar.py emite web/js/00-datos.js desde el Python real, así el contenido se edita UNA vez y ambas versiones quedan sincronizadas.",
     "00-datos.js"],
    ["juegos/ (trivia · completar · ordenar · memoria)",
     "Lógica pura sin interfaz: repartir preguntas sin repetir, crear el hueco (con la regla B1 de no ocultar la letra inicial: hueco más difícil), desordenar letras garantizando un anagrama distinto del original, armar el tablero de parejas palabra-imagen y validar intentos. Las mismas funciones sirven a dos front-end distintos: Tkinter y el DOM.",
     "04-juegos.js"],
    ["utilidades/puntuacion.py",
     "Los acumuladores del negocio: +10 por acierto (una llamada por intento, precondición igual que en Python), +20 de bonificación por terminar (ya sumada ANTES de entrar al resultado para que el repinte del tema no la duplique), lista de actividades completadas y porcentaje de aciertos.",
     "02-estado.js"],
    ["utilidades/sonidos.py",
     "pygame.mixer con WAV locales y degradación amable: si el mixer no arranca, el juego sigue con el aviso «Sin sonido». La web logra la misma promesa con un POOL de 3 nodos de Audio por efecto (un efecto que aún suena no se corta) y reconstrucción del nodo si queda envenenado tras repetir muchas veces.",
     "03-sonidos.js"],
    ["utilidades/rutas.py",
     "Resolución de rutas de recursos empaquetados (PyInstaller _MEIPASS o el repo) — el problema de «¿dónde está mi PNG cuando está congelado el ejecutable?». En la web el equivalente es trivial: rutas RELATIVAS a index.html, que funcionan igual en file://, en Pages y en un pendrive.",
     "rutas relativas"],
    ["interfaz/componentes.py",
     "El cascarón compartido: encabezado persistente con HUD (puntos, aciertos, nivel), título animado, Pipo y su burbuja, tokens de tema (20 llaves exactas: TEMA_OSCURO/TEMA_CLARO), botones, tarjetas, barra de progreso y repintar_pantalla. La web agrega lo que CSS regala: sistema de elevación --elev-1/2/3 y backdrops-blur.",
     "05-componentes.js"],
    ["interfaz/animaciones.py",
     "Tkinter no tiene motor de tween: la skill académica es encadenar widget.after(ms, paso) con interpolación lineal y ease_out_cubic (t=1-(1-t)³). TODAS las animaciones del escritorio existen en la web: animar_aparicion_titulo (crecer del título), pulsar_widget (destello en la respuesta correcta), animar_barra (barrido sobre el relleno), resal_burbuja_pipo (burbuja que respira), fundir_fondo (velo polar en el tema). La web añade lo que el navegador tiene de fábrica: cascada de entrada por hijos y reparto de cartas.",
     "keyframes en estilos.css"],
    ["interfaz/lienzo_pygame.py",
     "El volteo 2.5D de las cartas y el confeti de la celebración, dibujados con pygame y proyectados por cos θ al plano (el «canto» de la carta al girar). La web logra el mismo giro con perspective: 900px + rotateY de CSS — sin canvas: el dorso con tiling de rombos es solo background. El confeti corrió modo continuo hasta navegar (reciclaje de partículas en un requestAnimationFrame que muere solo al desenlazarse el canvas).",
     "cartas .memoria-carta + confeti canvas"],
    ["interfaz/*.py (pantallas)",
     "Nueve pantallas con la misma forma: inicio con validación, menú con selector CEFR y fichas de actividades, vocabulario paginado 4×página, trivia/completar/ordenar con feedback coloreado y explicación, memoria con contadores, resultado con el mensaje de Pipo por umbral (100%→perfecto, ≥60%→felicitaciones, <60%→ánimo) y la documentación — nacida en esta ronda.",
     "pantallas/*.js"],
  ];

  /* --- 2. árbol del proyecto (roles por carpeta) --- */
  const ARBOL = [
    "penguin-english-adventure/",
    "├─ src/penguin_english/          ← el paquete Python (única verdad)",
    "│  ├─ datos/                     vocabulario · trivia · memoria · pipo · niveles",
    "│  ├─ juegos/                    lógica pura (sin interfaz)",
    "│  ├─ utilidades/                puntuacion · sonidos · rutas",
    "│  └─ interfaz/                  componentes · animaciones · lienzo_pygame · 9 pantallas",
    "├─ web/                          ← LA WEB (piso del juego en el navegador)",
    "│  ├─ index.html                 cascarón + orden de carga espejo del paquete",
    "│  ├─ css/estilos.css            tokens heredados + elevación + keyframes",
    "│  ├─ js/                        00-datos (GENERADO) · 01-niveles · 02-estado",
    "│  │                             02b-media · 03-sonidos · 04-juegos · 05-componentes",
    "│  │                             06-main + pantallas/ (9 pantallas)",
    "│  └─ assets/                    img OpenMoji 618px · 4 WAV · vendor (Bootstrap/Icons/Fredoka)",
    "│                                capturas/ (9 screenshots del producto)",
    "├─ scripts/                      web_exportar.py · descargar_openmoji.py · empaquetar",
    "├─ tests/                        pruebas del paquete Python (unittest)",
    "├─ tests_web/                    suite E2E Playwright (25 tests · 417 asserts)",
    "├─ pseint/                       el puente académico (los mismos algoritmos en PSeInt)",
    "├─ recursos/                     RAW de imágenes/sonidos del escritorio",
    "├─ DESIGN.md · PRODUCT.md        el mundo visual y la verdad de producto",
    "└─ docs/                         CEFR · AUDIT · MEJORAS · ARQUITECTURA…",
  ].join("\n");

  /* --- 3. tabla de equivalencias Tkinter ↔ Web --- */
  const EQUIVALENCIAS = [
    ["crear_encabezado()", "encabezadoActivar() + HUD pill", "El encabezado persiste entre pantallas; el tema repinta la etiqueta."],
    ["repintar_pantalla(ventana, fn, args)", "PEA.ui.navegar(fn, args)", "El estado viaja en parámetros; la web añade fase de salida (95 ms) + cascada de entrada."],
    ["after(ms, paso) + ease_out_cubic", "requestAnimationFrame + CSS keyframes", "El navegador ya trae el tween: transform/opacity viajan por el compositor."],
    ["Frame offset detrás (sombra)", "box-shadow en 3 niveles (--elev-1/2/3)", "En fondo #000 el volumen se logra con glow azul + bevel de luz, no con paleta nueva."],
    ["LienzoMemoria (pygame canvas)", "cartas HTML con perspective 900px", "El giro 3D lo hace rotateY; la sombra la proyecta el wrapper plano."],
    ["puntuación en variables del proceso", "sessionStorage con JSON", "Sobrevive recargas; «Cerrar sesión» borra la clave, como el botón Salir."],
    ["main.py (Tk, mainloop)", "06-main.js + splash (carga.js)", "Arranque: tema, sonidos precargados, pantalla de carga y el inicio."],
  ];

  /* --- 4. conceptos académicos clave --- */
  const CONCEPTOS = [
    ["Bucle de eventos",
     "El juego no espera bloqueando: reacciona. En Tk, el mainloop recibe eventos; en la web, el bucle del navegador dispara los callbacks de clic y los requestAnimationFrame de animación. Un algoritmo PSeInt se convierte en este modelo: escribir → enter → pantalla nueva."],
    ["Estado en parámetros",
     "Ninguna pantalla guarda su propio estado: el índice de pregunta, los aciertos y la palabra viajan como ARGUMENTOS de la pantalla siguiente (en la web, dentro de PEA.ui.navegar). Así el «Volver» y el repintado por cambio de tema nunca se desincronizan del progreso."],
    ["CEFR acumulativo",
     "A2 incluye A1; B1 incluye los dos. El filtro compara índices en la tupla ordenada de niveles y EXPORTA su efecto al reto: rondas (6/8/10), parejas (4/6/8), preguntas (8/10/12), espera del flip (1100/900/650 ms) y si se oculta la letra inicial (sí/sí/no)."],
    ["Degradación amable",
     "Sin sonido (mixer o autoplay bloqueado) → pool/reconstrucción y aviso visible; sin imagen → círculo con la inicial (igual que circulo_letra en Tk); sin red → todo es local (OpenMoji, WAV, fuentes y frameworks vendidos). El juego SIEMPRE se juega: cada punto de falla tiene camino de respaldo."],
    ["Movimiento reducido",
     "prefers-reduced-motion apaga cascadas, reparto y confeti, y Mata la animation-delay (los hijos no pueden quedar invisibles esperando su turno). La elevación queda estática: la jerarquía visual no depende del movimiento."],
    ["Front-millares: herencia y composición",
     "La web no reescribe el mundo de Tk: HEREDA sus 20 tokens y sus constantes de reto y agrega capas propias (elevación, cascada, pool de sonido). Es un caso de estudio de «refinement sin redesign»: el mismo producto, otro motor."],
  ];

  /* --- 5. decisiones de diseño y contrapartidas --- */
  const DECISIONES = [
    ["Un solo origen de verdad",
     "El contenido vive en Python (datos/) y la web lo recibe generado. Cambiar una palabra no toca la web: python scripts/web_exportar.py regenera 00-datos.js. Consecuencia: cero divergencia entre escritorio y web."],
    ["Sin build, sin servidor, file://",
     "Scripts clásicos (no ES modules) y dependencias autoalojadas (assets/vendor/) para que DAR DOBLE CLIC funcione en cualquier máquina. El precio: no hay HMR ni bundling; el beneficio: pendrive, aula sin red, Pages y zip con el mismo artefacto."],
    ["Sesión por pestaña (sessionStorage)",
     "Los puntos sobreviven recargas DENTRO de la pestaña y se borran al cerrarla: conservar práctica sin dejar datos a largo plazo en la máquina de clase. «Cerrar sesión» borra explícitamente, como el botón Salir del escritorio."],
    [" Pool de audio, caché de media",
     "DOS problemas nacidos de sesión larga (sonidos mudos tras muchas ráfagas; imágenes que degradaban con 60+ navegaciones) se resolvieron con estructuras de retención: pool de 3 nodos por efecto con reconstrucción, y una caché de imagen decodificada con dueño permanente."],
    ["El mismo algoritmo dos veces",
     "04-juegos.js es espejo 1:1 de juegos/*.py (mismas reglas, mismos límites) y tests (Python) + suite E2E (web) argumentan cada lado. La duplicación es a propósito: permite aprender los dos paradigmas sin un puente de compilación."],
    [" Tokens sobre magia",
     "Cada color/ritmo sale de una variable CSS documentada (tokens del escritorio + tokens de elevación). Ningún color hardcodeado en pantallas: el tema claro/oscuro se resuelve sin reescribir componentes."],
  ];

  /* --- 6. métricas y verificación --- */
  const METRICAS = [
    ["309 palabras · 20 categorías · 107 trivia · 16 parejas", "contenido total etiquetado CEFR (149/255/309 palabras por nivel A1/A2/B1)"],
    ["618 px por OpenMoji (233 copias · 2.6 MB local)", "colección renovada a resolución completa para nitidez en pantallas de alta densidad"],
    ["25 tests E2E · 417 asserts · 5 corridas deterministas", "suite Playwright en tests_web/ — recorre todas las pantallas y termina los cuatro juegos completos"],
    ["Audit Impeccable: 19/20 (Excellent)", "movil 390 · tablet 768/834 · escritorio 1440 — acc, rendimiento, responsive, theming, integridad"],
    ["Estrés de navegación: 60 pantallas · 0 fallos", "caché de media: Pipo y OpenMoji visibles en cada repintado (bug de sesiones largas corregido)"],
    ["0 pedidos externos con red bloqueada", "degradación real offline: el juego entero vive en local"],
  ];

  /* --- 7. reproducir y distribuir --- */
  const PASOS = [
    ["Jugar sin nada",
     "Doble clic en web/index.html (o el zip PenguinEnglish-web.zip). No necesita Python, servidor, internet ni instalación."],
    ["Regenerar contenido",
     "python scripts/web_exportar.py [--servir 8000] — emite 00-datos.js y copia los assets; --servir levanta un servidor local de prueba."],
    ["Refrescar imágenes",
     "python scripts/descargar_openmoji.py --catalogo --tamano 618 (vuelve a bajar el catálogo nítido cuando cambie)."],
    ["Correr la suite web",
     "cd tests_web && npm i && npm test — 25 tests Playwright por file:// (red externa bloqueada; 4 juegos completos)."],
    ["Desplegar en GitHub Pages",
     "El repo sirve la rama gh-pages (raíz de web/). A cada cambio: push a main + sincronizar web → gh-pages — y Pages lo reconstruye solo."],
    ["Probar el escritorio",
     "python -m penguin_english (venv con pygame). Los tests del paquete: python -m unittest discover."],
  ];

  /* --- 8. capturas por dispositivo --- */
  const CAPTURAS = [
    ["Escritorio · 1440 px",
     [["captura-escritorio-oscuro.png", "Menú · tema oscuro — las cuatro fichas con sortilegio elevación y HUD con detalles por nivel"],
      ["captura-escritorio-claro.png", "Menú · tema claro — hielo diurno: mismo world, otro cielo"]]],
    ["Tablet · 834 px",
     [["captura-tablet-oscuro.png", "Menú reordenado: la ficha destacada arriba, las compactas en 2 columnas"],
      ["captura-tablet-claro.png", "Menú claro en tablet — chips CEFR AA con el ámbar legible"]]],
    ["Móvil · 390 px",
     [["captura-movil-oscuro.png", "Memoria con cartas de baraja (tiling de rombos) y tablero de 3 columnas"],
      ["captura-movil-vocabulario.png", "Vocabulario: ficha de palabra con 618px nítido, nível y ejemplo"],
      ["captura-movil-trivia.png", "Trivia en feedback: el correcto en verde con destello y las neutras en quieto"],
      ["captura-movil-claro.png", "Menú claro: HUD condensado a scoreboard y sombras azul-tintas"]]],
    ["Arranque",
     [["captura-splash.png", "Pantalla de carga: Pipo flota, título creciente y barra polar (2.2 s, saltáble con un toque)"]]],
  ];


  function mostrarDocumentacion(padre) {
    const irAlMenu = function () {
      PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
    };
    PEA.ui.encabezadoActivar(PEA.estado.leerNombre(), irAlMenu);

    padre.append(
      PEA.ui.titulo("¿Cómo está hecho?"),
      PEA.ui.subtitulo("Documentación académica del proyecto: arquitectura, decisiones y evidencia")
    );

    PEA.ui.crearPipo(padre,
      "Aquí está todo el proyecto explicado: cómo el escritorio y la web hablan el mismo idioma, qué decisiones tomé y cómo comprobarlo. Bienvenido al código.",
      { ancho: "560px" });

    /* ---------- tarjeta del repositorio ---------- */
    padre.append(cajonRepositorio());

    /* ---------- 1. mapa de módulos ---------- */
    const seccionModulos = PEA.ui.h("div", "seccion");
    seccionModulos.append(PEA.ui.texto(PEA.ui.h("h2", "titulo-seccion"),
      "1. El mapa del código: Python ↔ Web"));
    MODULOS.forEach(function (modulo) {
      seccionModulos.append(tarjetaModulo(modulo));
    });
    padre.append(seccionModulos);

    /* ---------- 2. árbol del proyecto ---------- */
    const seccionArbol = PEA.ui.h("div", "seccion");
    seccionArbol.append(PEA.ui.texto(PEA.ui.h("h2", "titulo-seccion"),
      "2. La anatomía del directorio"));
    const preArbol = PEA.ui.h("pre", "doc-arbol");
    preArbol.textContent = ARBOL;
    seccionArbol.append(preArbol);
    padre.append(seccionArbol);

    /* ---------- 3. equivalencias ---------- */
    const seccionEquiva = PEA.ui.h("div", "seccion");
    seccionEquiva.append(PEA.ui.texto(PEA.ui.h("h2", "titulo-seccion"),
      "3. Tabla de equivalencias Tkinter ↔ Web"));
    seccionEquiva.append(tablaEquivalencias());
    padre.append(seccionEquiva);

    /* ---------- 4. conceptos ---------- */
    const seccionConceptos = PEA.ui.h("div", "seccion");
    seccionConceptos.append(PEA.ui.texto(PEA.ui.h("h2", "titulo-seccion"),
      "4. Conceptos académicos clave"));
    CONCEPTOS.forEach(function (concepto) {
      seccionConceptos.append(tarjetaConcepto(concepto));
    });
    padre.append(seccionConceptos);

    /* ---------- 5. decisiones ---------- */
    const seccionDecisiones = PEA.ui.h("div", "seccion");
    seccionDecisiones.append(PEA.ui.texto(PEA.ui.h("h2", "titulo-seccion"),
      "5. Decisiones de diseño y trade-offs"));
    DECISIONES.forEach(function (decision) {
      seccionDecisiones.append(tarjetaConcepto(decision));
    });
    padre.append(seccionDecisiones);

    /* ---------- 6. métricas ---------- */
    const seccionMetricas = PEA.ui.h("div", "seccion");
    seccionMetricas.append(PEA.ui.texto(PEA.ui.h("h2", "titulo-seccion"),
      "6. Métricas y verificación"));
    seccionMetricas.append(tablaMetricas());
    padre.append(seccionMetricas);

    /* ---------- 7. reproducir y distribuir ---------- */
    const seccionPasos = PEA.ui.h("div", "seccion");
    seccionPasos.append(PEA.ui.texto(PEA.ui.h("h2", "titulo-seccion"),
      "7. Cómo reproducir y distribuir"));
    PASOS.forEach(function (paso) {
      const caja = PEA.ui.h("div", "pea-tarjeta doc-concepto");
      caja.append(PEA.ui.texto(PEA.ui.h("h3", "doc-concepto-titulo"), paso[0]));
      caja.append(PEA.ui.texto(PEA.ui.h("p", "doc-texto doc-paso-texto"), paso[1]));
      seccionPasos.append(caja);
    });
    padre.append(seccionPasos);

    /* ---------- 8. capturas ---------- */
    padre.append(capturas());

    /* ---------- repositorio y regreso ---------- */
    padre.append(cajonRepositorio());
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

  /* ---------- piececitas ---------- */

  function cajonRepositorio() {
    const caja = PEA.ui.h("a", "pea-tarjeta doc-cajon-enlace seccion", {
      href: REPO,
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": "Abrir el repositorio del código fuente en GitHub (HLSC0105/penguin-english-adventure)",
    });
    const interior = PEA.ui.h("div", "d-flex align-items-center gap-3");
    interior.append(PEA.ui.h("i", "bi bi-github", {
      "aria-hidden": "true",
      style: "font-size:2rem; color:var(--acento); flex:none;",
    }));
    const textos = PEA.ui.h("div");
    textos.append(
      PEA.ui.texto(PEA.ui.h("div", "fw-semibold"), "El código fuente completo está en GitHub"),
      PEA.ui.texto(PEA.ui.h("div", "texto-secundario doc-mono"), REPO.slice(8)));
    interior.append(textos);
    caja.append(interior);
    return caja;
  }  function tarjetaModulo(modulo) {
    const caja = PEA.ui.h("div", "pea-tarjeta doc-modulo");
    caja.append(PEA.ui.texto(PEA.ui.h("h3", "doc-modulo-titulo"), modulo[0]));
    caja.append(PEA.ui.texto(PEA.ui.h("p", "doc-texto"), modulo[1]));
    caja.append(PEA.ui.texto(PEA.ui.h("p", "doc-espejo"), "Web → " + modulo[2]));
    return caja;
  }

  function tarjetaConcepto(par) {
    const caja = PEA.ui.h("div", "pea-tarjeta doc-concepto");
    caja.append(PEA.ui.texto(PEA.ui.h("h3", "doc-concepto-titulo"), par[0]));
    caja.append(PEA.ui.texto(PEA.ui.h("p", "doc-texto"), par[1]));
    return caja;
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

  function tablaEquivalencias() {
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
    return marcoTabla;
  }

  function tablaMetricas() {
    const marcoTabla = PEA.ui.h("div", "table-responsive");
    const tabla = PEA.ui.h("table", "table doc-tabla");
    const cabeza = PEA.ui.h("thead");
    const renglon = PEA.ui.h("tr");
    renglon.append(PEA.ui.texto(PEA.ui.h("th"), "Indicador"));
    renglon.append(PEA.ui.texto(PEA.ui.h("th"), "Qué significa"));
    cabeza.append(renglon);
    tabla.append(cabeza);
    const cuerpo = PEA.ui.h("tbody");
    METRICAS.forEach(function (fila) {
      const renglón = PEA.ui.h("tr");
      const celda1 = PEA.ui.h("td");
      celda1.append(PEA.ui.texto(PEA.ui.h("code", "doc-celda-codigo"), fila[0]));
      renglón.append(celda1,
        PEA.ui.texto(PEA.ui.h("td", "doc-celda-texto"), fila[1]));
      cuerpo.append(renglón);
    });
    tabla.append(cuerpo);
    marcoTabla.append(tabla);
    return marcoTabla;
  }

  function capturas() {
    const seccion = PEA.ui.h("div", "seccion");
    seccion.append(PEA.ui.texto(PEA.ui.h("h2", "titulo-seccion"),
      "8. Capturas del producto"));
    CAPTURAS.forEach(function (grupo) {
      const subtitulo = PEA.ui.texto(PEA.ui.h("h3", "doc-subgrupo"), grupo[0]);
      seccion.append(subtitulo);
      const gripa = PEA.ui.h("div", "row g-3");
      grupo[1].forEach(function (par) {
        const col = PEA.ui.h("div", "col-12 col-md-6");
        const figura = PEA.ui.h("figure", "pea-tarjeta doc-captura");
        figura.append(PEA.media.crearImg("assets/capturas/" + par[0], {
          clase: "doc-captura-img",
          alt: par[1],
          loading: "lazy",
        }));
        figura.append(PEA.ui.texto(PEA.ui.h("figcaption", "doc-caption"), par[1]));
        col.append(figura);
        gripa.append(col);
      });
      seccion.append(gripa);
    });
    return seccion;
  }

  return { mostrarDocumentacion: mostrarDocumentacion };
})();
