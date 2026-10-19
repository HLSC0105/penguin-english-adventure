/* suite.mjs — Suite E2E completa de la web de Penguin English
   Adventure. Corre por file:// (sin servidor) con la red externa
   bloqueada: el juego debe ser 100 % offline. Verifica TODAS las
   pantallas y que cada juego se completa al 100 %, espejando la app
   Tkinter original.

   Cómo correr:  cd tests_web && npm i && npm test
   (los navegadores ya están en ~/.cache/ms-playwright; si no:
   npx playwright install chromium) */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import {
  URL_WEB,
  assert, assertEq,
  crearEstado, registrarMonitor, bloquearRedExterna, auditarConsola,
  nuevaPagina, recargarLimpio,
  asentar, esperarPantalla, saltarSplash, sondearSplash,
  hudDato, hudPuntos, hudAtributos, asertarChipPuntos,
  fichasMenu, detalleDe, textoPipo, assertPipoClave,
  textoVeredicto, lineasResultado,
  palabrasDeCategoria, leerTableroMemoria,
  resumenSuite, asertosLogrados,
} from "./helpers.mjs";

/* ---------- valores espejo de PEA_DATOS (contrato del producto) ---------- */

const PARAMS = {
  A1: { trivia: 8, completar: 6, ordenar: 6, parejas: 4, palabras: 149 },
  A2: { trivia: 10, completar: 8, ordenar: 8, parejas: 6, palabras: 255 },
  B1: { trivia: 12, completar: 10, ordenar: 10, parejas: 8, palabras: 309 },
};

/* ---------- registro de pruebas ---------- */

const pruebas = [];
const def = (nombre, fn) => pruebas.push({ nombre, fn });

/* Valores que cruzan entre tests (puntos antes de cada juego,
   tablero de memoria leído una vez para el juego entero). */
const mem = {};

/* helpers locales de navegación ---------------------------------------- */

async function abrirVocabularioDesdeMenu(page) {
  await page.getByRole("button", { name: /Aprender vocabulario/ }).click();
  await esperarPantalla(page, "Aprender vocabulario");          /* intro */
  await asentar(page);
  await page.getByRole("button", { name: /Empezar Aprender vocabulario/ }).click();
  await esperarPantalla(page, "Aprender vocabulario");          /* listado */
  await asentar(page);
}

async function abrirJuego(page, nombreFicha) {
  await page.getByRole("button", { name: new RegExp(nombreFicha) }).click();
  await esperarPantalla(page, nombreFicha);                     /* intro */
  await asentar(page);
  await page.getByRole("button", { name: new RegExp("Empezar " + nombreFicha) }).click();
  await esperarPantalla(page, nombreFicha);                     /* pantalla del juego */
  await asentar(page);
}

/* De cualquier pantalla con pie al menú principal. */
async function volverAlMenu(page) {
  await page.getByRole("button", { name: "Menú", exact: true }).click();
  await esperarPantalla(page, "Penguin English Adventure");
  await asentar(page);
}

/* Re-arma el estado base si el test anterior falló y la pantalla quedó
   tibia: sesión limpia → recarga → salta splash → login → menú. Sirve
   para que un fallo se reporte una vez y no arrastre por cascada. */
async function recuperarMenu(page) {
  await recargarLimpio(page);
  await saltarSplash(page);
  await page.locator("input[aria-label='Tu nombre']").fill("Sara QA");
  await page.getByRole("button", { name: /Comenzar/ }).click();
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await page.locator(".seccion button[data-nivel='A2']").click().catch(() => {});
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page, 300);
}

/* "X de 5 actividades completadas (Y%)" */
async function textoProgreso(page) {
  return page.evaluate(() => {
    const p = [...document.querySelectorAll("#pantalla .texto-secundario")]
      .find((x) => x.textContent.includes("actividades completadas"));
    return p ? p.textContent.trim() : null;
  });
}

/* Verifica el molde de las 4 líneas de un resultado y la aritmética
   exacta con los puntos del HUD. En trivia/completar/ordenar el delta
   es puntos_de_actividad + 20; en memoria "Puntos en la actividad"
   refleja los INTENTOS (paridad Tk) y el delta real es correctas*10+20:
   indicar deltaDe="correctas" para esa pantalla. */
async function asertarResultado(page, puntosAntes, opciones) {
  const config = opciones || {};
  const lineas = await lineasResultado(page);
  assertEq(lineas.length, 4, "el resultado tiene 4 líneas");
  const m0 = lineas[0].match(/^Respuestas correctas: (\d+) de (\d+) \((\d+)%\)$/);
  assert(!!m0, 'línea 1: "Respuestas correctas: X de N (P%)" — era: ' + lineas[0]);
  const m1 = lineas[1].match(/^Puntos en la actividad: (\d+)$/);
  assert(!!m1, 'línea 2: "Puntos en la actividad: N" — era: ' + lineas[1]);
  assertEq(lineas[2], "Bonificación por terminar: +20 puntos",
    "línea 3: la bonificación de +20");
  const m3 = lineas[3].match(/^Tus puntos totales: (\d+)$/);
  assert(!!m3, 'línea 4: "Tus puntos totales: N" — era: ' + lineas[3]);
  const correctas = Number(m0[1]);
  const total = Number(m0[2]);
  const puntosActividad = Number(m1[1]);
  const totalHUD = Number(m3[1]);
  if (config.deltaDe === "correctas") {
    assertEq(totalHUD - puntosAntes, correctas * 10 + 20,
      "delta total del HUD = parejas encontadas ×10 + bono 20");
  } else {
    assertEq(totalHUD - puntosAntes, puntosActividad + 20,
      "delta total del HUD = puntos de actividad + bono 20");
  }
  return { correctas, total, puntosActividad, totalHUD };
}

/* Clic de la carta n-ésima con reintentos suaves (el juego ignora
   clics mientras espera el flip de un fallo o con dos volteadas). */
async function voltearCarta(page, indice) {
  for (let intento = 0; intento < 5; intento += 1) {
    await page.locator(".memoria-carta").nth(indice).click();
    await page.waitForTimeout(150);
    const abierta = await page
      .locator(".memoria-carta").nth(indice)
      .evaluate((c) => c.classList.contains("volteada") || c.classList.contains("resuelta"));
    if (abierta) return true;
  }
  return false;
}

/* ═══════════════════════════ 1. SPLASH ═══════════════════════════ */

def("01 · Splash: secuencia completa (~2.2 s) y pantalla real debajo", async ({ page }) => {
  await page.goto(URL_WEB, { waitUntil: "domcontentloaded" });
  const velo = page.locator(".pea-carga");
  await velo.waitFor({ state: "visible", timeout: 4000 });

  /* Piezas fijas: Pipo + título + barra + pista */
  assertEq(await velo.locator("img").count(), 1, "Pipo en el splash");
  assertEq((await velo.locator(".carga-titulo").textContent()).trim(),
    "Penguin English Adventure", "título del splash");
  assert(/^Aprende inglés con un pingüino/.test(
    (await velo.locator(".carga-subtitulo").textContent()).trim()),
    "subtítulo del splash");
  assertEq(await velo.locator(".progress.carga-barra .progress-bar").count(), 1,
    "barra de carga");
  assertEq((await velo.locator(".carga-pista").textContent()).trim(),
    "Toca para saltar", "pista del splash");

  /* Desaparece a los ~2.2 s (+ ~340 ms de desvanecimiento) */
  const tMontado = Date.now();
  await velo.waitFor({ state: "detached", timeout: 4200 });
  const dur = Date.now() - tMontado;
  assert(dur >= 1700, "el splash NO se fue antes de tiempo (duró " + dur + " ms)");
  assert(dur <= 3800, "el splash sí murió con su secuencia (duró " + dur + " ms)");

  /* Debajo: la pantalla real ya estaba viva (inicio, aún sin nombre) */
  await esperarPantalla(page, "Penguin English Adventure", 2000);
  assertEq((await page.locator("#pantalla .subtitulo").textContent()).trim(),
    "¡Aprende inglés con un pingüino!", "el inicio quedó debajo del velo");
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

def("03 · Splash: breve con prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const t0 = Date.now();
  await recargarLimpio(page);
  const estados = await sondearSplash(page, 3500, { esperarMontaje: false });
  assert(estados.vivoVisto || estados.tMuriendo > 0 || estados.tRemovido > 0,
    "el splash se montó (se observó vivo o ya muriendo)");
  assert(estados.tRemovido > 0, "el splash desapareció (reduced motion)");
  const dtMuriendo = (estados.tMuriendo || estados.tRemovido) - estados.primerTick;
  assert(dtMuriendo <= 1100,
    "empieza a morir pronto (primer aviso a los " + dtMuriendo + " ms del primer avistamiento)");
  if (estados.tMuriendo) {
    assert(estados.tRemovido - estados.tMuriendo <= 600,
      "el desvanecimiento dura ~340 ms (medido " + (estados.tRemovido - estados.tMuriendo) + " ms)");
  }
  const dtRecarga = estados.tRemovido - t0;
  assert(dtRecarga <= 1800,
    "ciclo completo desde la recarga ≤ 1.8 s (medido " + dtRecarga + " ms " +
    "— 700 ms de secuencia + ~340 ms de disolución)");
  await esperarPantalla(page, "Penguin English Adventure", 2500);
  await page.emulateMedia({ reducedMotion: null });   /* restaurar para el resto */
});

/* ═══════════════════════════ 2. INICIO ═══════════════════════════ */

def("04 · Inicio: nombre vacío → mensaje y sin navegación", async ({ page }) => {
  await recargarLimpio(page);
  await saltarSplash(page);
  await esperarPantalla(page, "Penguin English Adventure", 2500);

  const hud = await hudAtributos(page);
  assert(hud.oculto, "el HUD sigue oculto en el inicio");
  assertEq(await page.locator("input[aria-label='Tu nombre']").count(), 1,
    "entrada de nombre");

  await page.getByRole("button", { name: /Comenzar/ }).click();
  await asentar(page, 300);
  const mensaje = await page.evaluate(() =>
    (document.querySelector(".error-mensaje")?.textContent || "").trim());
  assertEq(mensaje, "Escribe tu nombre para continuar.",
    "mensaje de validación del nombre");
  assertEq((await page.locator("#pantalla .subtitulo").textContent()).trim(),
    "¡Aprende inglés con un pingüino!", "seguimos en el inicio (no navegó)");
});

def("05 · Inicio: selector de nivel (chip A1) + nombre → menú", async ({ page }) => {
  const chipA1 = page.locator("form button[data-nivel='A1']");
  const chipA2 = page.locator("form button[data-nivel='A2']");
  assertEq(await page.locator("form button[data-nivel]").count(), 3,
    "3 chips de nivel A1/A2/B1 visibles en el inicio");
  await chipA1.click();
  await asentar(page, 220);
  assertEq(await chipA1.getAttribute("aria-pressed"), "true", "A1 marcado");
  assertEq(await chipA2.getAttribute("aria-pressed"), "false", "A2 sin marcar");

  await page.locator("input[aria-label='Tu nombre']").fill("Sara QA");
  await page.getByRole("button", { name: /Comenzar/ }).click();
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);
  assertEq((await page.locator("#pantalla .subtitulo").textContent()).trim(),
    "Aprende inglés con Pipo", "el menú quedó debajo del mismo título");
});

def("06 · HUD completo al entrar (Jugador/Puntos/Aciertos/Nivel)", async ({ page }) => {
  await asentar(page, 300);
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

def("08 · Menú: cambiar a A2 repinta detalles y el HUD", async ({ page }) => {
  await page.locator(".seccion button[data-nivel='A2']").click();
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);
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
  assertEq(await page.getByRole("button", { name: /¿Cómo jugar\?/ }).count(), 1,
    "botón ¿Cómo jugar?");
  assertEq(await page.getByRole("button", { name: /¿Cómo está hecho\?/ }).count(), 1,
    "botón ¿Cómo está hecho?");
  assertEq(await page.getByRole("button", { name: /Cerrar sesión/ }).count(), 1,
    "botón Cerrar sesión");
});

/* ═══════════════════════════ 4. AYUDA ═══════════════════════════ */

def("10 · Ayuda: tres bloques (Actividades, Puntos, Niveles CEFR)", async ({ page }) => {
  await page.getByRole("button", { name: /¿Cómo jugar\?/ }).click();
  await esperarPantalla(page, "¿Cómo jugar?", 3000);
  await asentar(page);
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

  await page.getByRole("button", { name: /Volver al menú/ }).click();
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);
});

/* ═══════════════════════════ 5. DOCUMENTACIÓN ═══════════════════════════ */

def("11 · Documentación extendida: 9 módulos, árbol, 2 tablas (13 filas), 18 tarjetas, repo y 9 capturas", async ({ page }) => {
  await page.getByRole("button", { name: /¿Cómo está hecho\?/ }).click();
  await esperarPantalla(page, "¿Cómo está hecho?", 3000);
  await asentar(page);

  /* El enlace al código fuente (arriba y al final). */
  assertEq(await page.locator("#pantalla a.doc-cajon-enlace").count(), 2,
    "2 cajones del repositorio (inicio y cierre)");
  assert((await page.getAttribute("#pantalla a.doc-cajon-enlace", "href") || "")
    .includes("github.com/HLSC0105/penguin-english-adventure"),
    "el cajón apunta al repo correcto");

  /* Estructura: 8 secciones numeradas. */
  assertEq(await page.locator("#pantalla .titulo-seccion").count(), 8,
    "8 secciones documentadas");
  assertEq(await page.locator("#pantalla .doc-modulo").count(), 9,
    "9 tarjetas de módulos (sumó rutas.py)");
  assertEq(await page.locator("#pantalla .doc-modulo .doc-espejo").count(), 9,
    "cada módulo con su espejo 'Web →'");

  /* El árbol del proyecto: monoespaciado y con las dos ramas clave. */
  const arbol = await page.evaluate(() =>
    (document.querySelector("#pantalla .doc-arbol")?.textContent || ""));
  assert(arbol.includes("src/penguin_english/") && arbol.includes("web/"),
    "árbol con el paquete y la web");
  assertEq(await page.evaluate(() =>
    (document.querySelector("#pantalla .doc-arbol")?.textContent || "").split("\n").length), 21,
    "21 renglones en el árbol");

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

  /* 18 tarjetas de texto: 6 conceptos + 6 decisiones + 6 pasos. */
  assertEq(await page.locator("#pantalla .doc-concepto").count(), 18,
    "6 conceptos + 6 decisiones + 6 pasos");
  assertEq(await page.locator("#pantalla .doc-subgrupo").count(), 4,
    "4 subgrupos de capturas (escritorio/tablet/móvil/arranque)");

  const capturas = await page.evaluate(() =>
    [...document.querySelectorAll("figure.doc-captura")].map((f) => ({
      tieneImg: !!f.querySelector("img"),
      caption: (f.querySelector("figcaption")?.textContent || "").trim(),
    })));
  assertEq(capturas.length, 9, "9 <figure class='doc-captura'>");
  assert(capturas.every((c) => c.tieneImg), "cada figura declara su <img>");
  assert(capturas.every((c) => c.caption.length > 0),
    "cada figura con <figcaption> no vacío");
  /* NOTA: las capturas SÍ existen ahora en web/assets/capturas/ (9 PNG
     reales del build, con filtro de 4 errores iniciales resuelto); el
     audit de consola sigue cubriendo cualquier 404 de assets. */

  await page.getByRole("button", { name: /Volver al menú/ }).click();
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);
});

/* ═══════════════════════════ 6. VOCABULARIO ═══════════════════════════ */

def("12 · Vocabulario: 20 categorías con conteo (255 palabras en A2)", async ({ page }) => {
  mem.puntosAntesVocab = await hudPuntos(page);
  await abrirVocabularioDesdeMenu(page);

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

def("13 · Vocabulario 'Animales': 4 por página, paginar a la última, 'Volver al listado' solo al final", async ({ page }) => {
  await page.getByRole("button", { name: /^Categoría Animales / }).click();
  await esperarPantalla(page, "Aprender vocabulario", 3000);
  await asentar(page);

  const nAnimales = await palabrasDeCategoria(page, "Animales");
  const totalPaginas = Math.ceil(nAnimales / 4);
  assert(totalPaginas >= 4,
    "Animales trae varias páginas (" + nAnimales + " palabras en A2)");

  for (let pag = 1; pag <= totalPaginas; pag += 1) {
    /* paginador y encabezado de la página */
    await page.waitForFunction(
      (esp) => [...document.querySelectorAll("#pantalla .texto-secundario")]
        .some((x) => x.textContent.trim() === esp),
      "Página " + pag + " de " + totalPaginas,
      { timeout: 4000 });
    assert(await page.evaluate(() =>
      [...document.querySelectorAll("#pantalla p")].some(
        (x) => x.textContent.startsWith("Categoría: Animales"))),
      "encabezado 'Categoría: Animales' en la página " + pag);

    const esperadoTarjetas = pag < totalPaginas
      ? 4
      : nAnimales - 4 * (totalPaginas - 1);
    /* los src de las imágenes se asignan al terminar de decodificar */
    await page.waitForFunction(
      (k) => {
        const fichas = [...document.querySelectorAll("#pantalla .ficha-palabra")];
        return fichas.length === k && fichas.every((f) =>
          (f.querySelector("img") && f.querySelector("img").getAttribute("src")) ||
          f.querySelector(".marca-trasera"));
      },
      esperadoTarjetas,
      { timeout: 5000 });

    const tarjetas = await page.evaluate(() =>
      [...document.querySelectorAll("#pantalla .ficha-palabra")].map((f) => ({
        ingles: (f.querySelector(".palabra-ingles")?.textContent || "").trim(),
        espanol: (f.querySelector(".palabra-espanol")?.textContent || "").trim(),
        nivel: (f.querySelector(".pea-mini")?.textContent || "").trim(),
        ejemplo: (f.querySelector(".palabra-ejemplo")?.textContent || "").trim(),
        conImg: !!(f.querySelector("img") && f.querySelector("img").getAttribute("src")),
        conCirculo: !!f.querySelector(".marca-trasera"),
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
        "abren imágenes OpenMoji reales en la primera página");
    }

    const volver = await page.getByRole("button", { name: /Volver al listado de categorías/ }).count();
    const siguiente = page.getByRole("button", { name: /Página siguiente/ });

    if (pag < totalPaginas) {
      assertEq(volver, 0, "'Volver al listado' NO está antes de la última página");
      assertEq(await siguiente.count(), 1, "'Siguiente ▶' disponible en la página " + pag);
      await siguiente.click();
      await esperarPantalla(page, "Aprender vocabulario", 3000);
      await asentar(page, 480);
    } else {
      assertEq(await siguiente.count(), 0, "sin 'Siguiente ▶' en la última página");
      assertEq(volver, 1, "'Volver al listado' aparece SOLO en la última página");
      await page.getByRole("button", { name: /Volver al listado de categorías/ }).click();
      await esperarPantalla(page, "Aprender vocabulario", 3000);
      await asentar(page, 480);
    }
  }

  /* de regreso: el listado completo con sus 20 botones */
  await page.waitForFunction(
    (k) => document.querySelectorAll("#pantalla .btn-categoria").length === k,
    20, { timeout: 3000 });
});

def("14 · Vocabulario: entrar, recorrer y volver NO mueve los puntos", async ({ page }) => {
  /* el árbol del test 13 quedó en el listado de categorías */
  await volverAlMenu(page);
  const puntosDespues = await hudPuntos(page);
  assertEq(puntosDespues, mem.puntosAntesVocab,
    "los puntos del HUD intactos tras todo el recorrido de vocabulario");
  assertEq(await page.locator(".ficha-actividad").count(), 5,
    "confirma que volvimos al menú");
});

/* ═══════════════════════════ 7. TRIVIA (completa, A2 = 10 preguntas) ═══════════════════════════ */

def("15 · Trivia completa 10/10: opciones, feedback (.esta-correcta y .quieto) y resultado con confeti", async ({ page }) => {
  mem.puntosAntesTrivia = await hudPuntos(page);
  await abrirJuego(page, "Trivia");

  for (let q = 1; q <= 10; q += 1) {
    await page.waitForFunction(
      (k) => [...document.querySelectorAll("#pantalla p")]
        .some((x) => x.textContent.trim() === ("Pregunta " + k + " de 10")),
      q, { timeout: 4000 });

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
      await asentar(page, 480);
    }
  }

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
  await page.getByRole("button", { name: /Volver al menú/ }).click();
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);
  assertEq(await textoProgreso(page), "1 de 5 actividades completadas (20%)",
    "progreso tras la trivia");
  const fichas = await fichasMenu(page);
  const trivia = fichas.find((f) => f.nombre === "Trivia");
  assert(trivia && trivia.completada && trivia.conCheck,
    "la ficha Trivia queda completada y con check");
});

/* ═══════════════════════════ 8. COMPLETAR (completo, A2 = 8 rondas) ═══════════════════════════ */

def("17 · Completar completo 8/8: hueco, 3 letras y 'La palabra completa es:'", async ({ page }) => {
  mem.puntosAntesCompletar = await hudPuntos(page);
  await abrirJuego(page, "Completar palabra");

  for (let ronda = 1; ronda <= 8; ronda += 1) {
    await page.waitForFunction(
      (k) => [...document.querySelectorAll("#pantalla p")]
        .some((x) => x.textContent.trim() === ("Ronda " + k + " de 8")),
      ronda, { timeout: 4000 });

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
    if (ronda < 8) await asentar(page, 480);
  }

  await esperarPantalla(page, "¡Completar palabra terminado!", 4500);
  await asentar(page);
  const r = await asertarResultado(page, mem.puntosAntesCompletar);
  assertEq(r.total, 8, "fueron 8 rondas de completar");
});

/* ═══════════════════════════ 9. ORDENAR (completo, A2 = 8 rondas) ═══════════════════════════ */

def("18 · Ordenar completo 8/8: vacío avisa sin navegar; XXXXX ×8 → 0 de 8 y Pipo ánimo", async ({ page }) => {
  await volverAlMenu(page);                 /* el test 17 terminó en su resultado */
  mem.puntosAntesOrdenar = await hudPuntos(page);
  await abrirJuego(page, "Ordenar palabra");

  for (let ronda = 1; ronda <= 8; ronda += 1) {
    await page.waitForFunction(
      (k) => [...document.querySelectorAll("#pantalla p")]
        .some((x) => x.textContent.trim() === ("Ronda " + k + " de 8")),
      ronda, { timeout: 4000 });

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
      () => [...document.querySelectorAll("#pantalla p.fs-5.seccion")]
        .some((x) => x.textContent.trim() === "¡Incorrecto!"),
      null, { timeout: 3500 });
    await asentar(page, 380);
    const burbuja = await textoPipo(page);
    assert(/^La palabra correcta era: [A-ZÄÖÜÑ']+$/.test(burbuja || ""),
      "Pipo muestra la palabra correcta: " + burbuja);

    await page.getByRole("button", { name: /Siguiente ronda/ }).click();
    if (ronda < 8) await asentar(page, 480);
  }

  await esperarPantalla(page, "¡Ordenar palabra terminado!", 4500);
  await asentar(page);
  const r = await asertarResultado(page, mem.puntosAntesOrdenar);
  assertEq(r.correctas, 0, "XXXXX nunca acierta");
  assertEq(r.total, 8, "0 de 8 correctas");
  await assertPipoClave(page, "animo",
    "con 0% Pipo anima (mensaje aleatorio dentro de la clave 'animo')");
});

/* ═══════════════════════════ 10. MEMORIA (completa, A2 = 6 parejas / 12 cartas) ═══════════════════════════ */

def("19 · Memoria: tablero de 12 leído, pareja 1 resuelta con acciones reales y chip '+10' del HUD", async ({ page }) => {
  await volverAlMenu(page);                 /* el test 18 terminó en su resultado */
  mem.puntosAntesMemoria = await hudPuntos(page);
  await abrirJuego(page, "Juego de memoria");

  /* Se derivan las parejas del tablero REAL de la partida:
     carta con .palabra-memo → palabra; carta con <img> → su filename
     se mapea contra PEA_DATOS.parejas para saber su inglés. */
  const tablero = await leerTableroMemoria(page);
  mem.tablero = tablero;
  assertEq(tablero.cartas.length, 12, "12 cartas (6 parejas)");
  assertEq(tablero.parejas.length, 6, "6 parejas derivadas del tablero");
  assert(tablero.parejas.every((z) => z.img && z.img.ingles === z.palabra.ingles),
    "cada pareja palabra↔imagen comparte su inglés");
  assert(tablero.parejas.every((z) => z.palabra.i !== z.img.i),
    "palabra e imagen son cartas distintas");
  assertEq(await page.locator(".memoria-carta.resuelta").count(), 0,
    "ninguna carta resuelta todavía");

  /* pareja 1, resuelta con clics reales, y el chip del HUD */
  const z0 = tablero.parejas[0];
  assert(await voltearCarta(page, z0.palabra.i),
    "se volteó la carta palabra '" + z0.palabra.ingles + "'");
  assert(await voltearCarta(page, z0.img.i),
    "se volteó la carta imagen de '" + z0.img.ingles + "'");
  await asertarChipPuntos(page, "+10");
  await page.waitForFunction(
    () => /Parejas encontradas: 1 de 6/.test(document.body.textContent),
    null, { timeout: 3000 });
  assertEq(await page.locator(".memoria-carta.resuelta").count(), 2,
    "las dos cartas de la pareja 1 quedan .resuelta");
});

def("20 · Memoria completa 6/6: contador, resultado '¡Juego de memoria terminado!' y HUD", async ({ page }) => {
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
  await page.getByRole("button", { name: /Volver al menú/ }).click();
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);

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
  await page.locator(".seccion button[data-nivel='B1']").click();
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);
  let fichas = await fichasMenu(page);
  let d = PARAMS.B1;
  assert(detalleDe(fichas, "Aprender vocabulario").startsWith(d.palabras + " palabras"),
    "vocabulario B1 (309)");
  assertEq(detalleDe(fichas, "Trivia"), d.trivia + " preguntas", "trivia B1");
  assertEq(detalleDe(fichas, "Completar palabra"), d.completar + " rondas", "completar B1");
  assertEq(detalleDe(fichas, "Ordenar palabra"), d.ordenar + " rondas", "ordenar B1");
  assertEq(detalleDe(fichas, "Juego de memoria"), d.parejas + " parejas", "memoria B1");
  assertEq(await hudDato(page, "Nivel:"), "B1", "HUD en B1");

  await page.locator(".seccion button[data-nivel='A1']").click();
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);
  fichas = await fichasMenu(page);
  d = PARAMS.A1;
  assert(detalleDe(fichas, "Aprender vocabulario").startsWith(d.palabras + " palabras"),
    "vocabulario A1 (149)");
  assertEq(detalleDe(fichas, "Trivia"), d.trivia + " preguntas", "trivia A1");
  assertEq(detalleDe(fichas, "Completar palabra"), d.completar + " rondas", "completar A1");
  assertEq(detalleDe(fichas, "Ordenar palabra"), d.ordenar + " rondas", "ordenar A1");
  assertEq(detalleDe(fichas, "Juego de memoria"), d.parejas + " parejas", "memoria A1");
  assertEq(await hudDato(page, "Nivel:"), "A1", "HUD en A1");

  /* deixamos el nivel por defecto para cerrar en limpio */
  await page.locator(".seccion button[data-nivel='A2']").click();
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);
});

/* ═══════════════════════════ 12. TEMA ═══════════════════════════ */

def("23 · Tema: claro/oscuro alterna data-bs-theme sin romper la pantalla", async ({ page }) => {
  assertEq(await page.evaluate(() => document.documentElement.getAttribute("data-bs-theme")),
    "dark", "tema inicial oscuro");
  await page.getByRole("button", { name: /Modo claro/ }).click();
  await asentar(page, 460);
  assertEq(await page.evaluate(() => document.documentElement.getAttribute("data-bs-theme")),
    "light", "tema claro activo");
  assertEq(await page.locator(".ficha-actividad").count(), 5,
    "la pantalla sigue viva en claro");
  assertEq(await page.getByRole("button", { name: /Modo oscuro/ }).count(), 1,
    "el botón alterna su etiqueta");

  await page.getByRole("button", { name: /Modo oscuro/ }).click();
  await asentar(page, 460);
  assertEq(await page.evaluate(() => document.documentElement.getAttribute("data-bs-theme")),
    "dark", "y de vuelta al oscuro");
  assertEq(await page.locator(".ficha-actividad").count(), 5,
    "la pantalla sigue viva tras el vaivén");
});

/* ═══════════════════════════ 13. CERRAR SESIÓN ═══════════════════════════ */

def("24 · Cerrar sesión: inicio con HUD oculto y sesión que no sobrevive la recarga", async ({ page }) => {
  await page.getByRole("button", { name: /Cerrar sesión/ }).click();
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);
  const hud = await hudAtributos(page);
  assert(hud.oculto, "HUD oculto tras cerrar sesión");
  assertEq(await page.locator("input[aria-label='Tu nombre']").count(), 1,
    "pantalla de inicio de nuevo");
  assertEq(await page.locator("#pantalla .btn-categoria").count(), 0,
    "no quedan restos del menú");

  /* sin sesión guardada: la recarga arranca con splash → inicio (no menú) */
  await recargarLimpio(page);
  await saltarSplash(page);
  await esperarPantalla(page, "Penguin English Adventure", 2500);
  const hud2 = await hudAtributos(page);
  assert(hud2.oculto, "sin sesión la recarga no va al menú");
  assertEq((await page.locator("#pantalla .subtitulo").textContent()).trim(),
    "¡Aprende inglés con un pingüino!", "arranca en la pantalla de inicio");
});

/* ═══════════════════════════ 14. AUDIT GLOBAL ═══════════════════════════ */

def("25 · Audit: 0 pedidos de red externa y 0 errores de consola en toda la suite", async ({ estado }) => {
  assertEq(estado.redExterna.length, 0,
    "el juego no intentó salir a internet (pedidos a bloquear: " + estado.redExterna.length + ")");
  assertEq(estado.violaciones.length, 0,
    "ni un pageerror ni console-error en ninguna pantalla");
  if (estado.notasWhitelist > 0) {
    console.error("  nota: " + estado.notasWhitelist +
      " mensajes fueron ignorados documentadamente (img de assets/capturas/ ausentes en el repo).");
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
  await bloquearRedExterna(context, estado);
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
          path: "artefactos/" + slug(p.nombre) + ".png",
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
