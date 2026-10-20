/* El contenido de la pantalla de documentación (¿Cómo está hecho?).
   Todo ESTÁTICO: se pre-renderiza en build (ventaja Astro — cero JS en
   esta página). El texto sigue el estilo académico de los docstrings
   del paquete Python: cada pieza explica el POR QUÉ. */

export const REPO = "https://github.com/HLSC0105/penguin-english-adventure";

export const MODULOS: Array<{ titulo: string; texto: string; espejo: string }> = [
  {
    titulo: "datos/ (vocabulario · trivia · memoria · pipo · niveles)",
    texto: "El único origen de verdad del contenido: 309 palabras en 20 categorías, 107 preguntas de trivia, 16 parejas y los mensajes de Pipo, cada entrada etiquetada con su nivel CEFR. El escritorio importa estos módulos directo; las dos webs los RECIBEN: scripts/astro_exportar.py (y web_exportar.py para la vanilla) emiten los datos desde el Python real, así el contenido se edita UNA vez y todas las versiones quedan sincronizadas.",
    espejo: "00-datos.js (vanilla) · src/data/*.json (Astro)",
  },
  {
    titulo: "juegos/ (trivia · completar · ordenar · memoria)",
    texto: "Lógica pura sin interfaz: repartir preguntas sin repetir, crear el hueco (con la regla B1 de no ocultar la letra inicial), desordenar letras garantizando un anagrama distinto del original, armar el tablero de parejas palabra-imagen y validar intentos. Las mismas funciones sirven a tres front-end distintos: Tkinter, la web vanilla y las islands de Astro.",
    espejo: "04-juegos.js (vanilla) · src/lib/juegos.ts (Astro)",
  },
  {
    titulo: "utilidades/puntuacion.py",
    texto: "Los acumuladores del negocio: +10 por acierto (una llamada por intento), +20 de bonificación por terminar (ya sumada ANTES de entrar al resultado para que el repinte del tema no la duplique), lista de actividades completadas y porcentaje de aciertos.",
    espejo: "02-estado.js (vanilla) · src/lib/estado.ts (Astro)",
  },
  {
    titulo: "utilidades/sonidos.py",
    texto: "pygame.mixer con WAV locales y degradación amable: si el mixer no arranca, el juego sigue con el aviso «Sin sonido». Las webs logran la misma promesa con un POOL de 3 nodos de Audio por efecto (un efecto que aún suena no se corta) y reconstrucción del nodo si queda envenenado tras repetir muchas veces.",
    espejo: "03-sonidos.js (vanilla) · src/lib/sonidos.ts (Astro)",
  },
  {
    titulo: "utilidades/rutas.py",
    texto: "Resolución de rutas de recursos empaquetados (PyInstaller _MEIPASS o el repo). En la web vanilla es trivial: rutas RELATIVAS a index.html; en Astro el reto es el base path de GitHub Pages — todo pasa por src/lib/rutas.ts con import.meta.env.BASE_URL.",
    espejo: "rutas relativas (vanilla) · src/lib/rutas.ts (Astro)",
  },
  {
    titulo: "interfaz/componentes.py",
    texto: "El cascarón compartido: encabezado persistente con HUD (puntos, aciertos, nivel), título animado, Pipo y su burbuja, tokens de tema (20 llaves exactas: TEMA_OSCURO/TEMA_CLARO), botones, tarjetas, barra de progreso y repintar_pantalla. Las webs agregan lo que CSS regala: sistema de elevación --elev-1/2/3 y backdrops-blur.",
    espejo: "05-componentes.js (vanilla) · Layout + components/*.astro (Astro)",
  },
  {
    titulo: "interfaz/animaciones.py",
    texto: "Tkinter no tiene motor de tween: la skill académica es encadenar widget.after(ms, paso) con interpolación lineal y ease_out_cubic (t=1-(1-t)³). TODAS las animaciones del escritorio existen en las webs: animar_aparicion_titulo, pulsar_widget, animar_barra, resal_burbuja_pipo, fundir_fondo. Astro añade lo que el navegador tiene de fábrica: View Transitions entre rutas y cascada por hijos.",
    espejo: "keyframes en estilos.css (ambas webs)",
  },
  {
    titulo: "interfaz/lienzo_pygame.py",
    texto: "El volteo 2.5D de las cartas y el confeti de la celebración, dibujados con pygame y proyectados por cos θ al plano (el «canto» de la carta al girar). Las webs logran el mismo giro con perspective + rotateY de CSS — sin canvas. El confeti corre en modo continuo hasta navegar (reciclaje de partículas en un requestAnimationFrame que muere solo al desenlazarse el canvas).",
    espejo: "cartas .memoria-carta + confeti canvas",
  },
  {
    titulo: "interfaz/*.py (pantallas)",
    texto: "Nueve pantallas con la misma forma: inicio con validación, menú con selector CEFR y fichas de actividades, vocabulario paginado 4×página, trivia/completar/ordenar con feedback coloreado y explicación, memoria con contadores, resultado con el mensaje de Pipo por umbral (100%→perfecto, ≥60%→felicitaciones, <60%→ánimo) y la documentación.",
    espejo: "pantallas/*.js (vanilla) · src/pages/*.astro + islands (Astro)",
  },
];

export const ARBOL = [
  "penguin-english-adventure/",
  "├─ src/penguin_english/          ← el paquete Python (única verdad)",
  "│  ├─ datos/                     vocabulario · trivia · memoria · pipo · niveles",
  "│  ├─ juegos/                    lógica pura (sin interfaz)",
  "│  ├─ utilidades/                puntuacion · sonidos · rutas",
  "│  └─ interfaz/                  componentes · animaciones · lienzo_pygame · 9 pantallas",
  "├─ web/                          ← versión VANILLA (así empezó; offline por file://)",
  "│  ├─ index.html                 cascarón SPA + orden de carga espejo del paquete",
  "│  └─ …                          css · js · assets (vendor + capturas + OpenMoji)",
  "├─ web-astro/                    ← versión ASTRO (la desplegada en Pages)",
  "│  ├─ astro.config.mjs           site/base de Pages + Tailwind vía Vite",
  "│  ├─ src/pages/                 10 rutas reales (menú/ayuda/docs 100% estáticas)",
  "│  ├─ src/components/            HUD · PipoBurbuja · BarraProgreso · FichaActividad",
  "│  ├─ src/lib/                   estado · juegos · sonidos · datos · confeti · imágenes",
  "│  ├─ src/data/                  JSON generados del Python EN BUILD",
  "│  └─ src/assets/img/            OpenMoji 618px → optimizados webp por astro:assets",
  "├─ scripts/                      exportar datos · descargar OpenMoji · desplegar.sh",
  "├─ tests/ + tests_web/           pruebas del paquete Python + suite E2E (vanilla y Astro)",
  "├─ pseint/                       el puente académico (los mismos algoritmos en PSeInt)",
  "├─ DESIGN.md · PRODUCT.md        el mundo visual y la verdad de producto",
  "└─ docs/                         CEFR · AUDIT · MEJORAS · astro/ (la construcción paso a paso)",
].join("\n");

export const EQUIVALENCIAS: Array<[string, string, string]> = [
  ["crear_encabezado()", "HUD persistente (transition:persist)", "El encabezado sobrevive la navegación; el tema repinta la etiqueta."],
  ["repintar_pantalla(ventana, fn, args)", "navegar por RUTAS + View Transitions", "El estado viaja en la sesión; la transición la hace el navegador."],
  ["after(ms, paso) + ease_out_cubic", "requestAnimationFrame + CSS keyframes", "El navegador ya trae el tween: transform/opacity viajan por el compositor."],
  ["Frame offset detrás (sombra)", "box-shadow en 3 niveles (--elev-1/2/3)", "En fondo #000 el volumen se logra con glow azul + bevel de luz, no con paleta nueva."],
  ["LienzoMemoria (pygame canvas)", "cartas HTML con perspective 900px", "El giro 3D lo hace rotateY; la sombra la proyecta el wrapper plano."],
  ["puntuación en variables del proceso", "sessionStorage con JSON", "Sobrevive recargas; «Cerrar sesión» borra la clave, como el botón Salir."],
  ["main.py (Tk, mainloop)", "06-main/splash + astro:page-load", "Arranque: tema, sonidos precargados, splash y el inicio."],
];

export const CONCEPTOS: Array<[string, string]> = [
  ["Bucle de eventos", "El juego no espera bloqueando: reacciona. En Tk, el mainloop recibe eventos; en la web, el bucle del navegador dispara los callbacks de clic y los rAF de animación. Un algoritmo PSeInt se convierte en este modelo: escribir → enter → pantalla nueva."],
  ["Estado en parámetros", "Ninguna pantalla guarda su propio estado: el índice de pregunta, los aciertos y la palabra viajan como ARGUMENTOS (o en la sesión de la pestaña). Así el «Volver» y el redibujado nunca se desincronizan del progreso."],
  ["CEFR acumulativo", "A2 incluye A1; B1 incluye los dos. El filtro compara índices en la tupla ordenada y EXPORTA su efecto al reto: rondas (6/8/10), parejas (4/6/8), preguntas (8/10/12), espera del flip (1100/900/650 ms) y si se oculta la letra inicial (sí/sí/no)."],
  ["Degradación amable", "Sin sonido → pool/reconstrucción y aviso visible; sin imagen → círculo con la inicial; sin red → todo es local. El juego SIEMPRE se juega: cada punto de falla tiene camino de respaldo."],
  ["Movimiento reducido", "prefers-reduced-motion apaga cascadas, reparto y confeti, y mata la animation-delay (los hijos no pueden quedar invisibles esperando su turno). La elevación queda estática."],
  ["Front-millares: herencia y composición", "La web no reescribe el mundo de Tk: HEREDA sus 20 tokens y constantes y agrega capas propias (elevación, cascada, pool). «Refinement sin redesign»: el mismo producto, otro motor."],
];

export const ASTRO_NUEVO: Array<[string, string]> = [
  ["Del SPA al MPA con transiciones",
   "La versión vanilla es UN documento con pantallas pintadas por JS (navegar() guarda la pantalla para el repintado). Astro invierte el modelo: cada pantalla es una RUTA con HTML pre-renderizado; al navegar el navegador hace la transición de vista (::view-transition-old/new) — el vaivén premium sin JS de control."],
  ["Cero JavaScript en las páginas estáticas",
   "Menú, ayuda, intro, documentación y resultado son HTML puro + CSS: el envío de JS es solo el de las islands (4 juegos + hud/tema/splash). La vanilla carga toda la app en cada visita; Astro envía cada pieza SOLO donde vive."],
  ["Datos en build, no en runtime",
   "La vanilla emite 00-datos.js y lo lee el navegador; Astro importa src/data/*.json en el frontmatter (build): el contenido queda incrustado en el HTML, tipado con los esquemas, y no hay fetch ni parseo en el cliente."],
  ["Imágenes optimizadas por pipeline",
   "astro:assets convierte los OpenMoji 618px a webp con dimensiones fijas: menos peso, cero layout shift, nitidez en pantallas de alta densidad. La vanilla servía PNG tal cual."],
  ["Bun como gestor",
   "Todo el ciclo corre con bun (install/dev/build/preview): el mismo proyecto enseña npm-compatible y la alternativa moderna. Los comandos del README son bun primero, npm como fallback."],
];

export const DECISIONES: Array<[string, string]> = [
  ["Un solo origen de verdad", "El contenido vive en Python y las dos webs lo reciben generado (web_exportar.py / astro_exportar.py). Cambiar una palabra no toca ninguna web: se regenera y ambas quedan al día."],
  ["Sin build (vanilla) / build mínimo (Astro)", "La vanilla existe PRECISAMENTE para enseñar cómo funciona una web sin herramientas; Astro añade el build como la evolución natural — y desplegar.sh permite PUBLICAR cualquiera de las dos."],
  ["Sesión por pestaña (sessionStorage)", "Los puntos sobreviven recargas dentro de la pestaña y se borran al cerrarla: práctica conservada sin dejar datos en la máquina de clase."],
  ["Pool de audio + caché de media", "Dos problemas de sesiones largas (sonidos mudos tras ráfagas; imágenes degradadas tras 60+ navegaciones) se resolvieron con retención: pool de 3 nodos por efecto y caché de imágenes decodificadas."],
  ["El mismo algoritmo dos veces", "juegos.ts/.js espejan juegos/*.py a propósito: permite aprender los dos paradigmas (procedural Tk y declarativo DOM) sin un puente de compilación."],
  ["Tokens sobre magia", "Cada color/ritmo sale de una variable CSS documentada. Ningún color hardcodeado en pantallas: el tema claro/oscuro se resuelve sin reescribir componentes — igual en las dos webs."],
];

export const METRICAS: Array<[string, string]> = [
  ["309 palabras · 20 categorías · 107 trivia · 16 parejas", "contenido total etiquetado CEFR (149/255/309 palabras por nivel A1/A2/B1)"],
  ["233 OpenMoji a 618px → webp en build (Astro)", "colección completa a resolución real: nítida en pantallas de alta densidad y con cero layout shift"],
  ["25 tests E2E · 425+ asserts · corridas deterministas", "suite Playwright: recorre todas las pantallas y termina los cuatro juegos completos, offline y sin red"],
  ["Audit Impeccable: 19/20 (Excellent)", "móvil 390 · tablet 768/834 · escritorio 1440 — accesibilidad, rendimiento, responsive, theming, integridad"],
  ["Estrés de navegación: 60 pantallas · 0 fallos", "caché de media: Pipo y OpenMoji visibles en cada repintado (bug de sesiones largas corregido)"],
  ["0 pedidos externos con red bloqueada", "degradación real offline: el juego entero vive en local (en ambas versiones)"],
];

export const PASOS: Array<[string, string]> = [
  ["Jugar sin nada (vanilla)", "Doble clic en web/index.html (o el zip). No necesita Python, servidor, internet ni instalación — es la versión de pendrive."],
  ["Jugar la versión Astro (la publicada)", "Esta misma página: GitHub Pages la sirve desde la rama gh-pages con el build de Astro."],
  ["Regenerar contenido", "source .venv/bin/activate && python scripts/astro_exportar.py (Astro) o python scripts/web_exportar.py (vanilla) tras editar los datos."],
  ["Refrescar imágenes", "python scripts/descargar_openmoji.py --catalogo --tamano 618"],
  ["Correr las suites", "tests_web/: bun/npm i + npm test (vanilla) o npm test:astro (Astro) — corren por file:///preview con la red externa bloqueada."],
  ["Desplegar una u otra", "scripts/desplegar.sh astro (por defecto) o scripts/desplegar.sh vanilla — sincroniza la versión elegida a la rama gh-pages (misma URL, contenido distinto)."],
  ["Probar el escritorio", "python -m penguin_english (venv con pygame) · tests: python -m unittest discover."],
];

export const CAPTURAS: Array<{ grupo: string; imagenes: Array<[string, string]> }> = [
  { grupo: "Escritorio · 1440 px", imagenes: [
    ["captura-escritorio-oscuro.png", "Menú · tema oscuro — las cuatro fichas con la elevación y el HUD con detalles por nivel"],
    ["captura-escritorio-claro.png", "Menú · tema claro — hielo diurno: mismo mundo, otro cielo"],
  ]},
  { grupo: "Tablet · 834 px", imagenes: [
    ["captura-tablet-oscuro.png", "Menú reordenado: la ficha destacada arriba, las compactas en 2 columnas"],
    ["captura-tablet-claro.png", "Menú claro en tablet — chips CEFR AA con el ámbar legible"],
  ]},
  { grupo: "Móvil · 390 px", imagenes: [
    ["captura-movil-oscuro.png", "Memoria con cartas de baraja (tiling de rombos) y tablero de 3 columnas"],
    ["captura-movil-vocabulario.png", "Vocabulario: ficha de palabra con OpenMoji nítido, nivel y ejemplo"],
    ["captura-movil-trivia.png", "Trivia en feedback: el correcto en verde con destello y las neutras apagadas"],
    ["captura-movil-claro.png", "Menú claro: HUD condensado a scoreboard y sombras azul-tintas"],
  ]},
  { grupo: "Arranque", imagenes: [
    ["captura-splash.png", "Pantalla de carga: Pipo flota, título creciente y barra polar (2.2 s, saltáble con un toque)"],
  ]},
];
