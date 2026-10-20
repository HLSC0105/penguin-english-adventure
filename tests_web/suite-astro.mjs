/* suite-astro.mjs — Suite E2E completa de la versión ASTRO de Penguin
   English Adventure (web-astro/, Astro 7 + Tailwind v4). Espeja la
   cobertura de los 25 tests de la vanilla (suite.mjs) pero contra las
   RUTAS REALES del sitio (/ · /menu/ · /intro/{act}/ · /vocabulario/
   · /trivia/ · /completar/ · /ordenar/ · /memoria/ · /resultado/
   · /ayuda/ · /como-esta-hecho/), navegadas con View Transitions.

   Cómo correr (la variante más estable, contra el build local):
     cd web-astro && bun run build && bun run preview
     #   → sirve dist/ en http://localhost:4321/penguin-english-adventure/
     cd ../tests_web && npm i && node suite-astro.mjs

   La base se puede apuntar a cualquier despliegue (misma suite sirve
   para verificar post-deploy):
     ASTRO_BASE=https://hlsc0105.github.io/penguin-english-adventure/ \
       node suite-astro.mjs

   Reglas heredadas de la vanilla: sin librería de aserciones (assert/
   assertEq propios), tablero de memoria DERIVADO del tablero vivo
   (nunca índices fijos), audit de consola por test (0 pageerror /
   0 console-error) y muro de red — aquí el SITIO es local: se permite
   su origen y se aborta cualquier pedido a OTRO origen (el test 25
   exige que no hubo ninguno). */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import {
  BASE_URL, rutaAstro,
  assert, assertEq,
  crearEstado, muroRed, auditarConsola, nuevaPagina, recargarLimpio,
  asentar, esperarPantalla, esperarMenuNivel, saltarSplash,
  hudDato, hudPuntos, hudAtributos,
  fichasMenu, detalleDe, textoPipo, assertPipoClave,
  textoVeredicto, textoProgreso, textoContadorMemoria,
  consumirErroresConocidos,
  abrirJuego, abrirVocabularioDesdeMenu, volverAlMenu, volverDeResultado,
  recuperarMenu, irAlInicio,
  palabrasDeCategoriaAstro,
  leerTableroMemoriaAstro, voltearCarta,
  asertarResultado, resumenSuite, asertosLogrados,
} from "./helpers-astro.mjs";

/* ---------- valores espejo del contrato (niveles.json) ---------- */

const PARAMS = {
  A1: { trivia: 8, completar: 6, ordenar: 6, parejas: 4, palabras: 149 },
  A2: { trivia: 10, completar: 8, ordenar: 8, parejas: 6, palabras: 255 },
  B1: { trivia: 12, completar: 10, ordenar: 10, parejas: 8, palabras: 309 },
};

/* ---------- registro de pruebas ---------- */

const pruebas = [];
const def = (nombre, fn) => pruebas.push({ nombre, fn });

/* Valores que cruzan entre tests (puntos antes de cada juego, tablero
   de memoria leído una vez para la partida entera, nivel en curso). */
const mem = {};

/* El pathname de la base (para asertar "estamos en /" en cualquier base). */
const PATH_BASE = new URL(BASE_URL).pathname.replace(/\/+$/, "");

/* ═══════════════════════════ 1. SPLASH ═══════════════════════════ */

def("01 · Splash: carga dura monta el velo completo (~2.2 s) con la pantalla debajo", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  const velo = page.locator(".pea-carga");
  await velo.waitFor({ state: "visible", timeout: 4000 });

  /* Piezas fijas: Pipo + título + barra + pista */
  assertEq(await velo.locator("img").count(), 1, "Pipo en el splash");
  assertEq((await velo.locator(".carga-titulo").textContent()).trim(),
    "Penguin English Adventure", "título del splash");
  assert(/^Aprende inglés con un pingüino/.test(
    (await velo.locator(".carga-subtitulo").textContent()).trim()),
    "subtítulo del splash");
  assertEq(await velo.locator(".carga-barra .carga-relleno").count(), 1,
    "barra de carga");
  assertEq((await velo.locator(".carga-pista").textContent()).trim(),
    "Toca para saltar", "pista del splash");

  /* Secuencia: 2.2 s + ~340 ms de desvanecimiento */
  const tMontado = Date.now();
  await velo.waitFor({ state: "detached", timeout: 4200 });
  const dur = Date.now() - tMontado;
  assert(dur >= 1700, "el splash NO se fue antes de tiempo (duró " + dur + " ms)");
  assert(dur <= 3800, "el splash sí murió con su secuencia (duró " + dur + " ms)");

  /* Debajo: la pantalla real ya estaba viva (inicio, aún sin nombre) */
  await esperarPantalla(page, "Penguin English Adventure", 2000);
  assertEq((await page.locator("#pantalla .subtitulo, #pantalla .texto-secundario")
    .filter({ hasText: "¡Aprende inglés con un pingüino!" }).count()), 1,
    "el inicio quedó debajo del velo");
});

def("02 · Splash: el clic a ~700 ms lo salta", async ({ page }) => {
  await recargarLimpio(page);
  const velo = page.locator(".pea-carga");
  await velo.waitFor({ state: "attached", timeout: 4000 });
  await page.waitForTimeout(660);           /* clic a ~700 ms (saltable desde 500) */
  assertEq(await velo.count(), 1, "a los ~700 ms el splash sigue en pantalla");
  const tClick = Date.now();
  await velo.click().catch(() => {});       /* pointerdown → carga-muriendo */
  await velo.waitFor({ state: "detached", timeout: 2500 });
  const dur = Date.now() - tClick;
  assert(dur <= 1500, "el clic lo saltó (velo fuera en " + dur + " ms ≤ 1.4 s)");
  await esperarPantalla(page, "Penguin English Adventure", 2000);
});

def("03 · Splash: con reduced-motion no se monta, y la navegación interna (View Transition) NO lo repite", async ({ page }) => {
  /* Observador que cuenta TODO montaje del velo, instalado antes de la
     recarga (los eventos de una carga dura pueden ganarle al polling).
     Se observa `document` (válido desde document-start; documentElement
     aún no existe ahí). */
  await page.addInitScript(() => {
    window.__peaVeilMontajes = 0;
    new MutationObserver((mutaciones) => {
      for (const m of mutaciones) {
        for (const n of m.addedNodes) {
          if (n.nodeType === 1 &&
              (n.classList?.contains("pea-carga") ||
               n.querySelector?.(".pea-carga"))) {
            window.__peaVeilMontajes += 1;
          }
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });

  /* A) recarga con reduced-motion: el velo NO se monta (diseño Astro:
        prefieren ni mostrarlo), y el inicio queda interactivo pronto. */
  await page.emulateMedia({ reducedMotion: "reduce" });
  await recargarLimpio(page);
  const t0 = Date.now();
  while (Date.now() - t0 < 1800) {
    assertEq(await page.locator(".pea-carga").count(), 0,
      "con reduced-motion el splash no llegó a montarse");
    await page.waitForTimeout(60);
  }
  await esperarPantalla(page, "Penguin English Adventure", 2500);
  assertEq(await page.evaluate(() => window.__peaVeilMontajes), 0,
    "el observador tampoco vio ningún montaje del velo");

  /* B) navegación interna con motion normal: la View Transition NO
     vuelve a montar el velo (el splash es SOLO de carga dura). */
  await page.emulateMedia({ reducedMotion: null });
  await page.locator("input[aria-label='Tu nombre']").fill("Sara QA");
  await page.getByRole("button", { name: /Comenzar/ }).click();
  await page.waitForURL((u) => u.pathname.endsWith("/menu/"));
  await esperarMenuNivel(page, "A2");
  assertEq(await page.locator(".pea-carga").count(), 0, "sin velo en /menu/");
  assertEq(await page.evaluate(() => window.__peaVeilMontajes), 0,
    "ningún montaje del velo durante la navegación interna (login → menú)");

  /* Se va a la documentación (segunda navegación interna; /ayuda/ no
     se usa aquí porque su Pipo tiene el bug de imagen 404 — test 10). */
  await page.locator("[data-isla-menu] a[href$='/como-esta-hecho/']").click();
  await page.waitForURL((u) => u.pathname.endsWith("/como-esta-hecho/"));
  await esperarPantalla(page, "¿Cómo está hecho?", 3000);
  await asentar(page);
  assertEq(await page.locator(".pea-carga").count(), 0, "sin velo en /como-esta-hecho/");
  assertEq(await page.evaluate(() => window.__peaVeilMontajes), 0,
    "y tampoco en la segunda navegación interna (menú → documentación)");
});

/* ═══════════════════════════ 2. INICIO ═══════════════════════════ */

def("04 · Inicio (/): nombre vacío → mensaje y sin navegación", async ({ page }) => {
  /* En ASTRO la recarga cae en la RUTA actual: ir a inicio a propósito. */
  await irAlInicio(page);

  const hud = await hudAtributos(page);
  assert(hud.oculto, "el HUD no existe (está oculto) en el inicio");
  assertEq(await page.locator("input[aria-label='Tu nombre']").count(), 1,
    "entrada de nombre");
  assertEq(await page.evaluate(() => document.body.dataset.pantalla), "inicio",
    "data-pantalla=inicio");

  await page.getByRole("button", { name: /Comenzar/ }).click();
  await asentar(page, 300);
  const mensaje = await page.evaluate(() =>
    (document.querySelector(".error-mensaje")?.textContent || "").trim());
  assertEq(mensaje, "Escribe tu nombre para continuar.",
    "mensaje de validación del nombre");
  assertEq((await page.locator("#pantalla .texto-secundario").first()
    .textContent()).trim(), "¡Aprende inglés con un pingüino!",
    "seguimos en el inicio (no navegó)");
  assert(page.url().replace(/\/+$/, "").endsWith(PATH_BASE) ||
    new URL(page.url()).pathname.replace(/\/+$/, "") === PATH_BASE,
    "la URL sigue siendo / (el envío vacío no navega)");
});

def("05 · Inicio: chips de nivel (A2 por defecto; A1 se elige) + nombre → /menu/", async ({ page }) => {
  /* arranque propio: inicio virgen (no depende del final del test 04) */
  await irAlInicio(page);
  const chipA1 = page.locator("form button[data-nivel='A1']");
  const chipA2 = page.locator("form button[data-nivel='A2']");
  assertEq(await page.locator("form button[data-nivel]").count(), 3,
    "3 chips de nivel A1/A2/B1 visibles en el inicio");
  assertEq(await chipA2.getAttribute("aria-pressed"), "true",
    "A2 viene marcado (nivel por defecto del producto)");
  await chipA1.click();
  await asentar(page, 220);
  assertEq(await chipA1.getAttribute("aria-pressed"), "true", "A1 marcado");
  assertEq(await chipA2.getAttribute("aria-pressed"), "false", "A2 sin marcar");

  await page.locator("input[aria-label='Tu nombre']").fill("Sara QA");
  await page.getByRole("button", { name: /Comenzar/ }).click();
  await page.waitForURL((u) => u.pathname.endsWith("/menu/"));
  await esperarMenuNivel(page, "A1", 6000);
  assertEq((await page.locator("#pantalla .texto-secundario").first()
    .textContent()).trim(), "Aprende inglés con Pipo",
    "el menú quedó debajo del mismo título");
});

def("06 · HUD completo en /menu/ (Jugador/Puntos/Aciertos/Nivel)", async ({ page }) => {
  await esperarMenuNivel(page, "A1");
  const hud = await hudAtributos(page);
  assert(!hud.oculto, "HUD visible en el menú");
  assertEq(hud.rotulos.join("|"), "Jugador:|Puntos:|Aciertos:|Nivel:",
    "los 4 chips del HUD");
  assertEq(await hudDato(page, "Jugador:"), "Sara QA", "nombre del jugador");
  assertEq(await hudDato(page, "Puntos:"), "0", "puntos en cero");
  assertEq(await hudDato(page, "Aciertos:"), "0%", "aciertos en cero");
  assertEq(await hudDato(page, "Nivel:"), "A1", "nivel elegido en el HUD");
});

/* ═══════════════════════════ 3. MENÚ ═══════════════════════════ */

def("07 · Menú A1: 5 fichas con detalles reales del nivel", async ({ page }) => {
  await asentar(page, 200);
  assertEq(await page.locator(".ficha-actividad").count(), 5, "5 fichas");
  const fichas = await fichasMenu(page);
  const nombres = fichas.map((f) => f.nombre);
  for (const esperado of ["Aprender vocabulario", "Trivia", "Completar palabra",
    "Ordenar palabra", "Juego de memoria"]) {
    assert(nombres.includes(esperado), "ficha '" + esperado + "' presente");
  }
  const d = PARAMS.A1;
  assert(detalleDe(fichas, "Aprender vocabulario").startsWith(
    d.palabras + " palabras · 20 categorías"), "vocabulario A1");
  assertEq(detalleDe(fichas, "Trivia"), d.trivia + " preguntas", "trivia A1");
  assertEq(detalleDe(fichas, "Completar palabra"), d.completar + " rondas", "completar A1");
  assertEq(detalleDe(fichas, "Ordenar palabra"), d.ordenar + " rondas", "ordenar A1");
  assertEq(detalleDe(fichas, "Juego de memoria"), d.parejas + " parejas", "memoria A1");
  assertEq(fichas.filter((f) => f.completada).length, 0, "sin checks al empezar");
});

def("08 · Menú: cambiar a A2 en la MISMA ruta repinta fichas y HUD", async ({ page }) => {
  await page.locator("[data-isla-menu] button[data-nivel-menu='A2']").click();
  await page.waitForURL((u) => u.pathname.endsWith("/menu/"));
  await esperarMenuNivel(page, "A2", 6000);
  const fichas = await fichasMenu(page);
  const d = PARAMS.A2;
  assert(detalleDe(fichas, "Aprender vocabulario").startsWith(
    d.palabras + " palabras · 20 categorías"), "vocabulario A2");
  assertEq(detalleDe(fichas, "Trivia"), d.trivia + " preguntas", "trivia A2");
  assertEq(detalleDe(fichas, "Completar palabra"), d.completar + " rondas", "completar A2");
  assertEq(detalleDe(fichas, "Ordenar palabra"), d.ordenar + " rondas", "ordenar A2");
  assertEq(detalleDe(fichas, "Juego de memoria"), d.parejas + " parejas", "memoria A2");
  assertEq(await hudDato(page, "Nivel:"), "A2", "el HUD refleja A2");
});

def("09 · Menú: progreso '0 de 5' y las tres acciones del pie", async ({ page }) => {
  await asentar(page, 200);
  assertEq(await textoProgreso(page), "0 de 5 actividades completadas (0%)",
    "texto de progreso inicial");
  const ayuda = page.locator("[data-isla-menu] a[href$='/ayuda/']");
  assertEq(await ayuda.count(), 1, "enlace ¿Cómo jugar?");
  assert(/¿Cómo jugar\?/.test((await ayuda.textContent()).trim() || ""),
    "¿Cómo jugar? con su etiqueta");
  const docs = page.locator("[data-isla-menu] a[href$='/como-esta-hecho/']");
  assertEq(await docs.count(), 1, "enlace ¿Cómo está hecho?");
  assert(/¿Cómo está hecho\?/.test((await docs.textContent()).trim() || ""),
    "¿Cómo está hecho? con su etiqueta");
  assertEq(await page.getByRole("button", { name: /Cerrar sesión/ }).count(), 1,
    "botón Cerrar sesión");
});

/* ═══════════════════════════ 4. AYUDA ═══════════════════════════ */

def("10 · Ayuda (/ayuda/): tres bloques (Actividades, Puntos, Niveles CEFR)", async ({ page, estado }) => {
  await page.locator("[data-isla-menu] a[href$='/ayuda/']").click();
  await page.waitForURL((u) => u.pathname.endsWith("/ayuda/"));
  await esperarPantalla(page, "¿Cómo jugar?", 3000);
  await asentar(page);
  assertEq(await page.evaluate(() => document.body.dataset.pantalla), "ayuda",
    "data-pantalla=ayuda");
  const bloques = await page.evaluate(() =>
    [...document.querySelectorAll("#pantalla .bloque-ayuda")].map((b) => ({
      titulo: (b.querySelector("h3")?.textContent || "").trim(),
      lineas: b.querySelectorAll("p").length,
    })));
  assertEq(bloques.length, 3, "3 bloques");
  assertEq(bloques.map((b) => b.titulo).join("|"),
    "Actividades|Puntos|Niveles CEFR", "títulos de los bloques");
  bloques.forEach((b) => assert(b.lineas >= 2, "bloque '" + b.titulo + "' con líneas"));

  /* algunos contenidos del manual */
  const cuerpo = await page.evaluate(() => document.querySelector("#pantalla").textContent);
  assert(cuerpo.includes("Aprender vocabulario: mira las palabras"), "manual: vocabulario");
  assert(cuerpo.includes("Cada respuesta correcta vale 10 puntos"), "manual: puntos");

  /* El Pipo de /ayuda/ ya sale NORMALIZADO (bug #1 corregido: el src
     viene de RUTA_PIPO en lib/rutas.ts — misma técnica que el resto del
     sitio) y su pedido NO deja rastro de 404 en consola. */
  const srcPipoAyuda = await page.evaluate(() =>
    document.querySelector('[data-pipo-aleatorio] img')?.getAttribute("src") || "");
  assertEq(srcPipoAyuda, "/penguin-english-adventure/pinguino_128.png",
    "src del Pipo normalizado con el slash final");
  assert(!consumirErroresConocidos(estado, "pinguino_128.png").some((e) =>
    e.includes("penguin-english-adventurepinguino")), "sin 404 del Pipo de ayuda");

  await page.getByRole("link", { name: /Volver al menú/ }).click();
  await page.waitForURL((u) => u.pathname.endsWith("/menu/"));
  await esperarMenuNivel(page, "A2", 3000);
});

/* ═══════════════════════════ 5. DOCUMENTACIÓN ═══════════════════════════ */

def("11 · Documentación (/como-esta-hecho/): 9 módulos, árbol, 2 tablas (7+6 filas), 2 cajones del repo, sección 'La versión Astro' y 9 capturas", async ({ page }) => {
  await page.locator("[data-isla-menu] a[href$='/como-esta-hecho/']").click();
  await page.waitForURL((u) => u.pathname.endsWith("/como-esta-hecho/"));
  await esperarPantalla(page, "¿Cómo está hecho?", 3000);
  await asentar(page);

  /* El enlace al código fuente (arriba y al final). */
  assertEq(await page.locator("#pantalla a.doc-cajon-enlace").count(), 2,
    "2 cajones del repositorio (inicio y cierre)");
  assert((await page.getAttribute("#pantalla a.doc-cajon-enlace", "href") || "")
    .includes("github.com/HLSC0105/penguin-english-adventure"),
    "el cajón apunta al repo correcto");

  /* Estructura: 9 secciones numeradas, una de ellas la de Astro. */
  const secciones = await page.evaluate(() =>
    [...document.querySelectorAll("#pantalla .titulo-seccion")]
      .map((h) => h.textContent.trim()));
  assertEq(secciones.length, 9, "9 secciones documentadas");
  assert(secciones.some((s) => s.includes("La versión Astro")),
    "existe la sección 'La versión Astro': " + secciones.join(" / "));

  assertEq(await page.locator("#pantalla .doc-modulo").count(), 9,
    "9 tarjetas de módulos");
  assertEq(await page.locator("#pantalla .doc-modulo .doc-espejo").count(), 9,
    "cada módulo con su espejo 'Web →'");

  /* El árbol del proyecto: monoespaciado y con las ramas clave. */
  const arbol = await page.evaluate(() =>
    (document.querySelector("#pantalla .doc-arbol")?.textContent || ""));
  assert(arbol.includes("src/penguin_english/") && arbol.includes("web-astro/"),
    "árbol con el paquete Python y la web Astro");
  assertEq(arbol.split("\n").length, 21, "21 renglones en el árbol");

  /* Dos tablas: equivalencias (7 filas × 3 celdas) y métricas (6 × 2). */
  const tablas = await page.evaluate(() =>
    [...document.querySelectorAll("#pantalla .doc-tabla")].map((t) => ({
      filas: t.querySelectorAll("tbody tr").length,
      cabezas: t.querySelectorAll("thead th").length,
    })));
  assertEq(tablas.length, 2, "2 tablas (equivalencias y métricas)");
  assertEq(tablas[0].filas, 7, "7 filas de equivalencias");
  assertEq(tablas[0].cabezas, 3, "equivalencias con 3 columnas");
  assertEq(tablas[1].filas, 6, "6 filas de métricas");
  assertEq(tablas[1].cabezas, 2, "métricas con 2 columnas");

  /* 24 tarjetas de texto: 6 conceptos + 5 de Astro + 6 decisiones + 7 pasos. */
  assertEq(await page.locator("#pantalla .doc-concepto").count(), 24,
    "tarjetas de conceptos + Astro + decisiones + pasos");

  const capturas = await page.evaluate(() =>
    [...document.querySelectorAll("figure.doc-captura")].map((f) => ({
      tieneImg: !!f.querySelector("img"),
      caption: (f.querySelector("figcaption")?.textContent || "").trim(),
    })));
  assertEq(capturas.length, 9, "9 <figure class='doc-captura'>");
  assert(capturas.every((c) => c.tieneImg), "cada figura declara su <img>");
  assert(capturas.every((c) => c.caption.length > 0),
    "cada figura con <figcaption> no vacío");
  assertEq(await page.locator("#pantalla .doc-subgrupo").count(), 4,
    "4 subgrupos de capturas (escritorio/tablet/móvil/arranque)");

  await page.getByRole("link", { name: /Volver al menú/ }).click();
  await page.waitForURL((u) => u.pathname.endsWith("/menu/"));
  await esperarMenuNivel(page, "A2", 3000);
});

/* ═══════════════════════════ 6. VOCABULARIO ═══════════════════════════ */

def("12 · Vocabulario (/vocabulario/): 20 categorías con conteo (255 palabras en A2)", async ({ page }) => {
  mem.puntosAntesVocab = await hudPuntos(page);
  await abrirVocabularioDesdeMenu(page);
  assertEq(await page.evaluate(() => document.body.dataset.pantalla),
    "vocabulario", "data-pantalla=vocabulario");

  const resumen = await page.evaluate(() => {
    const botones = [...document.querySelectorAll("#pantalla .btn-categoria")];
    let total = 0;
    botones.forEach((b) => {
      const m = b.textContent.match(/\((\d+)\)\s*$/);
      if (m) total += Number(m[1]);
    });
    return {
      n: botones.length,
      conConteo: botones.filter((b) => b.querySelector(".conteo")).length,
      total,
    };
  });
  assertEq(resumen.n, 20, "20 categorías");
  assertEq(resumen.conConteo, 20, "todas con su <span class='conteo'>");
  assertEq(resumen.total, PARAMS.A2.palabras, "la suma de conteos es 255 (A2)");
});

def("13 · Vocabulario 'Animales' (?categoria=&pagina=): 4 por página, paginar con clics, volver y deep-link", async ({ page }) => {
  /* NOTA: durante la escritura de la suite, el clic de paginación de
     vocabulario lanzaba "ReferenceError: ruta is not defined" (a
     src/scripts/vocabulario.ts le faltaba el import) y NO navegaba;
     quedó corregido por el commit 76af4f3 (pushState + popstate). El
     aserto abajo es la conducta BUENA; si el bug regresara, fallaría
     con esa referencia en la consola (audit por test). */
  await page.locator("#pantalla .btn-categoria").filter({ hasText: "Animales" }).click();
  await page.waitForURL((u) => u.search.includes("categoria=Animales"));
  await esperarPantalla(page, "Aprender vocabulario", 3000);
  await asentar(page, 300);

  const nAnimales = palabrasDeCategoriaAstro("A2", "Animales").length;
  const totalPaginas = Math.ceil(nAnimales / 4);
  assert(totalPaginas >= 4,
    "Animales trae varias páginas (" + nAnimales + " palabras en A2)");

  for (let pag = 1; pag <= totalPaginas; pag += 1) {
    /* paginador y encabezado de la página */
    await page.waitForFunction(
      (esp) => [...document.querySelectorAll("#pantalla .texto-secundario")]
        .some((x) => x.textContent.trim() === esp),
      "Página " + pag + " de " + totalPaginas,
      { timeout: 5000 });
    assert(await page.evaluate(() =>
      [...document.querySelectorAll("#pantalla p")].some(
        (x) => x.textContent.startsWith("Categoría: Animales"))),
      "encabezado 'Categoría: Animales' en la página " + pag);

    const esperadoTarjetas = pag < totalPaginas
      ? 4
      : nAnimales - 4 * (totalPaginas - 1);
    await page.waitForFunction(
      (k) => document.querySelectorAll("#pantalla .ficha-palabra").length === k,
      esperadoTarjetas,
      { timeout: 5000 });

    const tarjetas = await page.evaluate(() =>
      [...document.querySelectorAll("#pantalla .ficha-palabra")].map((f) => ({
        ingles: (f.querySelector(".palabra-ingles")?.textContent || "").trim(),
        espanol: (f.querySelector(".palabra-espanol")?.textContent || "").trim(),
        nivel: (f.querySelector(".pea-mini")?.textContent || "").trim(),
        ejemplo: (f.querySelector(".palabra-ejemplo")?.textContent || "").trim(),
        conImg: !!(f.querySelector("img") && f.querySelector("img").getAttribute("src")),
        conCirculo: !!f.querySelector("span[style*='width:84px']"),
      })));
    tarjetas.forEach((t) => {
      assert(t.ingles.length > 0 && t.espanol.length > 0,
        "tarjeta con inglés y español");
      assert(/^(A1|A2|B1)$/.test(t.nivel),
        "tarjeta con su nivel CEFR (" + t.nivel + ")");
      assert(t.ejemplo.length > 2, "tarjeta con ejemplo");
    });
    if (pag === 1) {
      assert(tarjetas.some((t) => t.conImg),
        "abren imágenes OpenMoji optimizadas (webp del build) en la primera página");
    }

    const volver = await page.getByRole("button", { name: /Volver al listado de categorías/ }).count();
    const siguiente = page.getByRole("button", { name: /Página siguiente/ });

    if (pag < totalPaginas) {
      assertEq(volver, 0, "'Volver al listado' NO está antes de la última página");
      assertEq(await siguiente.count(), 1, "'Siguiente ▶' disponible en la página " + pag);
      await siguiente.click();
      await page.waitForURL((u) => Number(u.searchParams.get("pagina") || "0") === pag + 1,
        { timeout: 4000 });
      await esperarPantalla(page, "Aprender vocabulario", 3000);
      await asentar(page, 220);
    } else {
      assertEq(await siguiente.count(), 0, "sin 'Siguiente ▶' en la última página");
      assertEq(volver, 1, "'Volver al listado' aparece SOLO en la última página");
      await page.getByRole("button", { name: /Volver al listado de categorías/ }).click();
      await page.waitForURL((u) => !u.search.includes("categoria="), { timeout: 4000 });
      await esperarPantalla(page, "Aprender vocabulario", 3000);
      await asentar(page, 220);
    }
  }

  /* de regreso: el listado completo con sus 20 botones */
  await page.waitForFunction(
    (k) => document.querySelectorAll("#pantalla .btn-categoria").length === k,
    20, { timeout: 4000 });

  /* Deep-link real de rutas: entrar directo con query repinta esa página */
  await page.goto(rutaAstro("vocabulario/?categoria=Animales&pagina=2"),
    { waitUntil: "domcontentloaded" });
  await saltarSplash(page);
  await page.waitForFunction(
    (esp) => [...document.querySelectorAll("#pantalla .texto-secundario")]
      .some((x) => x.textContent.trim() === esp),
    "Página 2 de " + totalPaginas, { timeout: 5000 });
  assertEq(await page.locator("#pantalla .ficha-palabra").count(), 4,
    "deep-link: 4 fichas en la página 2");
  assert(await page.evaluate(() =>
    [...document.querySelectorAll("#pantalla p")].some(
      (x) => x.textContent.startsWith("Categoría: Animales"))),
    "deep-link: encabezado de categoría");
  /* y de vuelta al listado para el test siguiente */
  await page.goto(rutaAstro("vocabulario/"), { waitUntil: "domcontentloaded" });
  await saltarSplash(page);
  await page.waitForFunction(
    (k) => document.querySelectorAll("#pantalla .btn-categoria").length === k,
    20, { timeout: 4000 });
});

def("14 · Vocabulario: entrar, recorrer y volver NO mueve los puntos", async ({ page }) => {
  /* el test 13 quedó en el listado de categorías */
  await volverAlMenu(page);
  const puntosDespues = await hudPuntos(page);
  assertEq(puntosDespues, mem.puntosAntesVocab,
    "los puntos del HUD intactos tras todo el recorrido de vocabulario");
  assertEq(await page.locator(".ficha-actividad").count(), 5,
    "confirma que volvimos al menú");
});

/* ═══════════════════════════ 7. TRIVIA (completa, A2 = 10 preguntas) ═══════════════════════════ */

def("15 · Trivia completa 10/10 (/trivia/): opciones, feedback (.esta-correcta y .quieto) y resultado con confeti", async ({ page }) => {
  mem.puntosAntesTrivia = await hudPuntos(page);
  await abrirJuego(page, "Trivia");
  assertEq(await page.evaluate(() => document.body.dataset.pantalla), "trivia",
    "data-pantalla=trivia");

  for (let q = 1; q <= 10; q += 1) {
    await page.waitForFunction(
      (k) => [...document.querySelectorAll("#pantalla p")]
        .some((x) => x.textContent.trim() === ("Pregunta " + k + " de 10")),
      q, { timeout: 5000 });

    const opciones = page.locator("#pantalla .btn-opcion");
    await opciones.first().waitFor({ state: "visible", timeout: 2500 });
    assertEq(await opciones.count(), 4, "4 opciones A–D en la pregunta " + q);
    await opciones.first().click();          /* responde SIEMPRE la primera opción */

    const correcta = page.locator("#pantalla .btn-opcion.esta-correcta");
    await correcta.waitFor({ state: "visible", timeout: 3500 });
    assertEq(await correcta.count(), 1, "una sola .esta-correcta (pregunta " + q + ")");
    assertEq(await correcta.evaluateAll((ns) =>
      ns.filter((n) => n.classList.contains("pulso-acierto")).length), 1,
      "la correcta queda con .pulso-acierto");
    const neutras = await page.locator("#pantalla .btn-opcion.quieto").count();
    const malas = await page.locator("#pantalla .btn-opcion.esta-incorrecta").count();
    assertEq(1 + neutras + malas, 4, "las 4 opciones quedan coloreadas/muertas");
    assert(neutras >= 2, "las neutras reciben .quieto");
    assertEq(await page.locator("#pantalla .btn-opcion[disabled]").count(), 4,
      "los cuatro botones quedan deshabilitados");
    const veredicto = await textoVeredicto(page);
    assert(/^¡Correcto! \+10 puntos$/.test(veredicto || "") ||
      /^¡Incorrecto! La respuesta era: /.test(veredicto || ""),
      "veredicto de la trivia: " + veredicto);

    await page.getByRole("button", { name: /Siguiente pregunta/ }).click();
    if (q < 10) {
      await esperarPantalla(page, "Trivia", 3000);
      await asentar(page, 350);
    }
  }

  await page.waitForURL((u) => u.pathname.endsWith("/resultado/"), { timeout: 6000 });
  await esperarPantalla(page, "¡Trivia completada!", 4000);
  await asentar(page);
  const r = await asertarResultado(page, mem.puntosAntesTrivia);
  assertEq(r.total, 10, "la trivia fue de 10 preguntas");
  assertEq(await page.locator("#confeti").count(), 1, "canvas #confeti presente");
  assert((await page.locator("#confeti").evaluate((c) => c.width > 0 && c.height > 0)),
    "el confeti tiene lienzo con tamaño");
  const puntosHUD = await hudPuntos(page);
  assert(puntosHUD > mem.puntosAntesTrivia, "el HUD de Puntos subió");
});

def("16 · Menú tras trivia: progreso '1 de 5' y check en la ficha", async ({ page }) => {
  await volverDeResultado(page);
  assertEq(await textoProgreso(page), "1 de 5 actividades completadas (20%)",
    "progreso tras la trivia");
  const fichas = await fichasMenu(page);
  const trivia = fichas.find((f) => f.nombre === "Trivia");
  assert(trivia && trivia.completada && trivia.conCheck,
    "la ficha Trivia queda completada y con check");
});

/* ═══════════════════════════ 8. COMPLETAR (completo, A2 = 8 rondas) ═══════════════════════════ */

def("17 · Completar completo 8/8 (/completar/): hueco, 3 letras y 'La palabra completa es:'", async ({ page }) => {
  mem.puntosAntesCompletar = await hudPuntos(page);
  await abrirJuego(page, "Completar palabra");
  assertEq(await page.evaluate(() => document.body.dataset.pantalla), "completar",
    "data-pantalla=completar");

  for (let ronda = 1; ronda <= 8; ronda += 1) {
    await page.waitForFunction(
      (k) => [...document.querySelectorAll("#pantalla p")]
        .some((x) => x.textContent.trim() === ("Ronda " + k + " de 8")),
      ronda, { timeout: 5000 });

    const celdas = await page.evaluate(() => {
      const cs = [...document.querySelectorAll("#pantalla .letra-celda")];
      return {
        n: cs.length,
        huecos: cs.filter((c) => c.classList.contains("hueco")).map((c) => c.textContent.trim()),
      };
    });
    assert(celdas.n >= 3, "la palabra va en celdas (ronda " + ronda + ")");
    assertEq(celdas.huecos.length, 1, "un solo hueco");
    assertEq(celdas.huecos[0], "_", "el hueco se muestra '_'");

    const letras = page.locator("#pantalla .btn-letra");
    await letras.first().waitFor({ state: "visible", timeout: 2500 });
    assertEq(await letras.count(), 3, "3 opciones de letra");
    await letras.first().click();            /* responde SIEMPRE la primera opción */

    const correcta = page.locator("#pantalla .btn-letra.esta-correcta");
    await correcta.waitFor({ state: "visible", timeout: 3500 });
    assertEq(await correcta.count(), 1, "una .esta-correcta (ronda " + ronda + ")");
    assertEq(await correcta.evaluateAll((ns) =>
      ns.filter((n) => n.classList.contains("pulso-acierto")).length), 1,
      "la letra correcta con .pulso-acierto");
    assertEq(await page.locator("#pantalla .btn-letra[disabled]").count(), 3,
      "las tres letras quedan muertas");
    const veredicto = await textoVeredicto(page);
    assert(/^¡Correcto! \+10 puntos$/.test(veredicto || "") ||
      /^¡Incorrecto! La letra era: /.test(veredicto || ""),
      "veredicto de completar: " + veredicto);
    const burbuja = await textoPipo(page);
    assert(/^La palabra completa es: [A-ZÄÖÜÑ']+$/.test(burbuja || ""),
      "Pipo revela 'La palabra completa es: …': " + burbuja);

    await page.getByRole("button", { name: /Siguiente ronda/ }).click();
    if (ronda < 8) await asentar(page, 350);
  }

  await page.waitForURL((u) => u.pathname.endsWith("/resultado/"), { timeout: 6000 });
  await esperarPantalla(page, "¡Completar palabra terminado!", 4500);
  await asentar(page);
  const r = await asertarResultado(page, mem.puntosAntesCompletar);
  assertEq(r.total, 8, "fueron 8 rondas de completar");
});

/* ═══════════════════════════ 9. ORDENAR (completo, A2 = 8 rondas) ═══════════════════════════ */

def("18 · Ordenar completo 8/8 (/ordenar/): vacío avisa sin navegar; XXXXX ×8 → 0 de 8 y Pipo ánimo", async ({ page }) => {
  await volverDeResultado(page);            /* el test 17 terminó en su resultado */
  mem.puntosAntesOrdenar = await hudPuntos(page);
  await abrirJuego(page, "Ordenar palabra");
  assertEq(await page.evaluate(() => document.body.dataset.pantalla), "ordenar",
    "data-pantalla=ordenar");

  for (let ronda = 1; ronda <= 8; ronda += 1) {
    await page.waitForFunction(
      (k) => [...document.querySelectorAll("#pantalla p")]
        .some((x) => x.textContent.trim() === ("Ronda " + k + " de 8")),
      ronda, { timeout: 5000 });

    assertEq(await page.locator("#pantalla .letra-celda.hueco").count(), 0,
      "sin celdas hueco en ordenar (ronda " + ronda + ")");
    const nCeldas = await page.locator("#pantalla .letra-celda").count();
    assert(nCeldas >= 3, "celdas con las letras desordenadas");

    const entrada = page.locator("input[aria-label='Palabra a ordenar']");
    await entrada.waitFor({ state: "visible", timeout: 2500 });

    /* A) submit VACÍO: la burbuja avisa y la ronda no cambia */
    await page.getByRole("button", { name: /Comprobar/ }).click();
    await asentar(page, 280);
    assertEq(await textoPipo(page), "Escribe una palabra antes de comprobar.",
      "aviso por envío vacío");
    const rondaActual = await page.evaluate(() =>
      [...document.querySelectorAll("#pantalla p")]
        .find((x) => x.textContent.includes("Ronda "))?.textContent.trim() || "");
    assertEq(rondaActual, "Ronda " + ronda + " de 8", "el envío vacío NO navega");
    assertEq(await entrada.count(), 1, "la pantalla sigue en la misma ronda");

    /* B) XXXXX (nunca es la palabra correcta) */
    await entrada.fill("XXXXX");
    await page.getByRole("button", { name: /Comprobar/ }).click();

    await page.waitForFunction(
      () => [...document.querySelectorAll("#pantalla p.seccion")]
        .some((x) => x.textContent.trim() === "¡Incorrecto!"),
      null, { timeout: 3500 });
    await asentar(page, 380);
    const burbuja = await textoPipo(page);
    assert(/^La palabra correcta era: [A-ZÄÖÜÑ']+$/.test(burbuja || ""),
      "Pipo muestra la palabra correcta: " + burbuja);

    await page.getByRole("button", { name: /Siguiente ronda/ }).click();
    if (ronda < 8) await asentar(page, 350);
  }

  await page.waitForURL((u) => u.pathname.endsWith("/resultado/"), { timeout: 6000 });
  await esperarPantalla(page, "¡Ordenar palabra terminado!", 4500);
  await asentar(page);
  const r = await asertarResultado(page, mem.puntosAntesOrdenar);
  assertEq(r.correctas, 0, "XXXXX nunca acierta");
  assertEq(r.total, 8, "0 de 8 correctas");
  await assertPipoClave(page, "animo",
    "con 0% Pipo anima (mensaje aleatorio dentro de la clave 'animo')");
});

/* ═══════════════════════════ 10. MEMORIA (completa, A2 = 6 parejas / 12 cartas) ═══════════════════════════ */

def("19 · Memoria (/memoria/): tablero de 12 leído y derivado del DOM vivo, pareja 1 resuelta con clics reales", async ({ page }) => {
  await volverDeResultado(page);            /* el test 18 terminó en su resultado */
  mem.puntosAntesMemoria = await hudPuntos(page);
  await abrirJuego(page, "Juego de memoria");
  assertEq(await page.evaluate(() => document.body.dataset.pantalla), "memoria",
    "data-pantalla=memoria");
  mem.nivelMemoria = await hudDato(page, "Nivel:") || "A2";

  /* Se derivan las parejas del tablero REAL de la partida:
     .palabra-memo = palabra; <img> → su src se mapea con data-imagenes
     (invertido) contra data/parejas.json del repo. NUNCA índices fijos. */
  const tablero = await leerTableroMemoriaAstro(page, "A2");
  mem.tablero = tablero;
  assertEq(tablero.cartas.length, 12, "12 cartas (6 parejas)");
  assertEq(tablero.parejas.length, 6, "6 parejas derivadas del tablero");
  assert(tablero.parejas.every((z) => z.img && z.img.ingles === z.palabra.ingles),
    "cada pareja palabra↔imagen comparte su inglés");
  assert(tablero.parejas.every((z) => z.palabra.i !== z.img.i),
    "palabra e imagen son cartas distintas");
  assertEq(await page.locator(".memoria-carta.resuelta").count(), 0,
    "ninguna carta resuelta todavía");
  assertEq(await textoContadorMemoria(page), "Parejas encontradas: 0 de 6",
    "contador exacto en cero");

  /* pareja 1, resuelta con clics reales */
  const z0 = tablero.parejas[0];
  assert(await voltearCarta(page, z0.palabra.i),
    "se volteó la carta palabra '" + z0.palabra.ingles + "'");
  assert(await voltearCarta(page, z0.img.i),
    "se volteó la carta imagen de '" + z0.img.ingles + "'");
  await page.waitForFunction(
    () => /Parejas encontradas: 1 de 6/.test(document.body.textContent),
    null, { timeout: 3000 });
  assertEq(await page.locator(".memoria-carta.resuelta").count(), 2,
    "las dos cartas de la pareja 1 quedan .resuelta");
});

def("20 · Memoria completa 6/6: contador exacto, resultado '¡Juego de memoria terminado!' y HUD", async ({ page }) => {
  const tablero = mem.tablero;
  assert(!!tablero && tablero.parejas.length === 6,
    "el tablero del test 19 sigue en pie (continuidad de la partida)");

  for (let k = 1; k < 6; k += 1) {
    const z = tablero.parejas[k];
    assert(await voltearCarta(page, z.palabra.i), "pareja " + (k + 1) + ": carta palabra volteada");
    assert(await voltearCarta(page, z.img.i), "pareja " + (k + 1) + ": carta imagen volteada");
    await page.waitForFunction(
      (t) => document.body.textContent.includes("Parejas encontradas: " + t + " de 6"),
      k + 1, { timeout: 3000 });
    assertEq(await page.locator(".memoria-carta.resuelta").count(), 2 * (k + 1),
      "cartas .resuelta tras la pareja " + (k + 1));
  }

  /* 420 ms de respiro del juego + transición → resultado */
  await page.waitForURL((u) => u.pathname.endsWith("/resultado/"), { timeout: 6000 });
  await esperarPantalla(page, "¡Juego de memoria terminado!", 5000);
  await asentar(page);
  const r = await asertarResultado(page, mem.puntosAntesMemoria, { deltaDe: "correctas" });
  assertEq(r.correctas, 6, "6 parejas correctas");
  assertEq(r.total, 6, "6 intentos (sin fallos, cada pareja al primer intento)");
  assertEq(r.puntosActividad, 6, "en memoria 'puntos de actividad' son los intentos (paridad Tk)");
  await assertPipoClave(page, "perfecto",
    "al 100% Pipo celebra (mensaje aleatorio dentro de la clave 'perfecto')");
  const puntosHUD = await hudPuntos(page);
  assertEq(puntosHUD, mem.puntosAntesMemoria + 60 + 20,
    "HUD: 6 aciertos (60) + bono (20) sobre los puntos previos");
});

/* ═══════════════════════════ 11. MENÚ TRAS LOS JUEGOS ═══════════════════════════ */

def("21 · Menú tras los 4 juegos: progreso '4 de 5' y checks en las 4 fichas", async ({ page }) => {
  await volverDeResultado(page);
  assertEq(await textoProgreso(page), "4 de 5 actividades completadas (80%)",
    "progreso: vocabulario es estudio y nunca cuenta");
  const fichas = await fichasMenu(page);
  const checks = fichas.filter((f) => f.conCheck).map((f) => f.nombre).sort();
  assertEq(checks.join("|"),
    "Completar palabra|Juego de memoria|Ordenar palabra|Trivia",
    "las 4 actividades con puntos quedan con check");
  const vocab = fichas.find((f) => f.nombre === "Aprender vocabulario");
  assert(vocab && !vocab.completada && !vocab.conCheck,
    "vocabulario NO se marca como completada");
});

def("22 · Niveles: B1 repinta (12/10/10/8 y 309 palabras) y A1 vuelve (8/6/6/4 y 149)", async ({ page }) => {
  await page.locator("[data-isla-menu] button[data-nivel-menu='B1']").click();
  await page.waitForURL((u) => u.pathname.endsWith("/menu/"));
  await esperarMenuNivel(page, "B1", 6000);
  let fichas = await fichasMenu(page);
  let d = PARAMS.B1;
  assert(detalleDe(fichas, "Aprender vocabulario").startsWith(d.palabras + " palabras"),
    "vocabulario B1 (309)");
  assertEq(detalleDe(fichas, "Trivia"), d.trivia + " preguntas", "trivia B1");
  assertEq(detalleDe(fichas, "Completar palabra"), d.completar + " rondas", "completar B1");
  assertEq(detalleDe(fichas, "Ordenar palabra"), d.ordenar + " rondas", "ordenar B1");
  assertEq(detalleDe(fichas, "Juego de memoria"), d.parejas + " parejas", "memoria B1");
  assertEq(await hudDato(page, "Nivel:"), "B1", "HUD en B1");

  await page.locator("[data-isla-menu] button[data-nivel-menu='A1']").click();
  await page.waitForURL((u) => u.pathname.endsWith("/menu/"));
  await esperarMenuNivel(page, "A1", 6000);
  fichas = await fichasMenu(page);
  d = PARAMS.A1;
  assert(detalleDe(fichas, "Aprender vocabulario").startsWith(d.palabras + " palabras"),
    "vocabulario A1 (149)");
  assertEq(detalleDe(fichas, "Trivia"), d.trivia + " preguntas", "trivia A1");
  assertEq(detalleDe(fichas, "Completar palabra"), d.completar + " rondas", "completar A1");
  assertEq(detalleDe(fichas, "Ordenar palabra"), d.ordenar + " rondas", "ordenar A1");
  assertEq(detalleDe(fichas, "Juego de memoria"), d.parejas + " parejas", "memoria A1");
  assertEq(await hudDato(page, "Nivel:"), "A1", "HUD en A1");

  /* dejamos el nivel por defecto para cerrar en limpio */
  await page.locator("[data-isla-menu] button[data-nivel-menu='A2']").click();
  await page.waitForURL((u) => u.pathname.endsWith("/menu/"));
  await esperarMenuNivel(page, "A2", 6000);
});

/* ═══════════════════════════ 12. TEMA ═══════════════════════════ */

def("23 · Tema: alterna data-tema de <html> (no data-bs-theme) sin romper la pantalla", async ({ page }) => {
  assertEq(await page.evaluate(() => document.documentElement.getAttribute("data-tema")),
    "oscuro", "tema inicial oscuro (data-tema)");
  assertEq(await page.evaluate(() => document.documentElement.getAttribute("data-bs-theme")),
    null, "no se usa el atributo data-bs-theme de la vanilla");
  await page.locator("[data-accion='tema']").click();
  await asentar(page, 460);
  assertEq(await page.evaluate(() => document.documentElement.getAttribute("data-tema")),
    "claro", "tema claro activo");
  assertEq(await page.locator(".ficha-actividad").count(), 5,
    "la pantalla sigue viva en claro");
  assertEq(await page.evaluate(() =>
    document.querySelector('[data-hud="etiqueta-tema"]')?.textContent.trim() || ""),
    "Modo oscuro", "el HUD repinta su etiqueta");

  await page.locator("[data-accion='tema']").click();
  await asentar(page, 460);
  assertEq(await page.evaluate(() => document.documentElement.getAttribute("data-tema")),
    "oscuro", "y de vuelta al oscuro");
  assertEq(await page.locator(".ficha-actividad").count(), 5,
    "la pantalla sigue viva tras el vaivén");
  assertEq(await page.evaluate(() =>
    document.querySelector('[data-hud="etiqueta-tema"]')?.textContent.trim() || ""),
    "Modo claro", "la etiqueta vuelve a 'Modo claro'");
});

/* ═══════════════════════════ 13. CERRAR SESIÓN ═══════════════════════════ */

def("24 · Cerrar sesión → / con HUD oculto y sesión que no sobrevive la recarga", async ({ page }) => {
  await page.getByRole("button", { name: /Cerrar sesión/ }).click();
  await page.waitForURL((u) => u.pathname.replace(/\/+$/, "") === PATH_BASE,
    { timeout: 6000 });
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);
  const hud = await hudAtributos(page);
  assert(hud.oculto, "HUD oculto tras cerrar sesión");
  assertEq(await page.locator("input[aria-label='Tu nombre']").count(), 1,
    "pantalla de inicio de nuevo");
  assertEq(await page.locator("[data-isla-menu]").count(), 0,
    "no quedan restos del menú");
  assertEq(await page.locator(".pea-carga").count(), 0,
    "la navegación interna de salida tampoco repite el splash");

  /* sin sesión guardada: la recarga arranca con splash → inicio (no menú) */
  await recargarLimpio(page);
  await saltarSplash(page);
  await esperarPantalla(page, "Penguin English Adventure", 2500);
  const hud2 = await hudAtributos(page);
  assert(hud2.oculto, "sin sesión la recarga no va al menú");
  assertEq((await page.locator("#pantalla .texto-secundario").first()
    .textContent()).trim(), "¡Aprende inglés con un pingüino!",
    "arranca en la pantalla de inicio");
});

/* ═══════════════════════════ 14. AUDIT GLOBAL ═══════════════════════════ */

def("25 · Audit: 0 pedidos a otro origen y 0 errores de consola en toda la suite", async ({ estado }) => {
  assertEq(estado.redExterna.length, 0,
    "el sitio no intentó salir a otro origen (pedidos abortados: " +
    estado.redExterna.slice(0, 3).join(", ") + ")");
  assertEq(estado.violaciones.length, 0,
    "ni un pageerror ni console-error en ninguna pantalla");
  if (estado.notasWhitelist > 0) {
    console.error("  nota: " + estado.notasWhitelist +
      " mensajes fueron ignorados documentadamente (recursos externos bloqueados por el muro).");
  }
});

/* ═══════════════════════════ RUNNER ═══════════════════════════ */

function slug(t) {
  return t.toLowerCase()
    .replace(/[^a-z0-9áéíóúüñ·\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/·/g, "")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

const estado = crearEstado();
const browser = await chromium.launch({ headless: true });
let pasan = 0;
let fallan = 0;
const resultados = [];
const tSuite = Date.now();

try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 860 },
  });
  await muroRed(context, estado);
  const page = await nuevaPagina(context, estado);

  mkdirSync("artefactos", { recursive: true });

  let ultimaFalla = false;
  for (const p of pruebas) {
    if (ultimaFalla) {
      try { await recuperarMenu(page); } catch { /* sin recuperación: sigue el test */ }
    }
    const tTest = Date.now();
    let falla = null;
    try {
      await p.fn({ page, estado });
    } catch (e) {
      falla = e;
    }
    /* el rastro de consola de cada pantalla se rastrea por test */
    const violaciones = auditarConsola(estado);
    if (!falla && violaciones.length) {
      falla = new Error(
        "Consola impura o recurso roto: " +
        violaciones.slice(0, 4)
          .map((v) => v.tipo + " → " + v.texto.slice(0, 130))
          .join(" || "));
    }
    if (falla) {
      try {
        await page.screenshot({
          path: "artefactos/astro-" + slug(p.nombre) + ".png",
          fullPage: true,
        });
      } catch { /* la captura no debe enmascarar el fallo original */ }
      fallan += 1;
    } else {
      pasan += 1;
    }
    ultimaFalla = !!falla;
    resultados.push({
      nombre: p.nombre,
      ok: !falla,
      ms: Date.now() - tTest,
      detalle: falla ? (falla && falla.message) || String(falla) : null,
    });
    process.stdout.write(
      (falla ? "✘" : "✔") + " " + p.nombre +
      (falla ? "\n    " + String(falla && falla.message)
        .split("\n").slice(0, 4).join("\n    ") : "") + "\n");
  }

  await context.close();
} catch (e) {
  console.error("Error estructural de la suite:", e);
  process.exitCode = 2;
} finally {
  await browser.close().catch(() => {});
}

console.log(resumenSuite(resultados, {
  asertos: asertosLogrados(),
  ms: Date.now() - tSuite,
  notasWhitelist: estado.notasWhitelist,
}));
process.exitCode = fallan > 0 ? 1 : 0;
