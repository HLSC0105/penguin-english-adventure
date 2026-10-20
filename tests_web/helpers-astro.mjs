/* helpers-astro.mjs — infraestructura compartida de la suite E2E de la
   versión ASTRO de Penguin English Adventure (web-astro/, Astro 7 +
   Tailwind v4). Espeja tests_web/helpers.mjs (la vanilla) pero sobre
   RUTAS REALES servidas por HTTP y con View Transitions.

   Cómo apuntar: la suite toma la base de la variable ASTRO_BASE
   (default http://127.0.0.1:4321/penguin-english-adventure/ —
   `cd web-astro && bun run build && bun run preview`). También sirve
   la URL publicada (https://hlsc0105.github.io/penguin-english-adventure/).

   Convenciones espejadas del sitio:
   - Navegación por rutas con ClientRouter: astro:page-load dispara la
     init de las islands (que TAMBIÉN se llaman al montar el módulo).
     Tras cada navegación se espera ~850 ms antes de asertar: la
     transición de vista tarda.
   - El splash (.pea-carga) SOLO se monta en carga dura (recarga/goto);
     la navegación interna (View Transition) NO lo repite. Es saltable
     desde 500 ms (pointerdown) y muere con fade de 340 ms.
   - La sesión vive en sessionStorage: recargarLimpio() la borra y el
     juego vuelve a su estado virgen. */

export const BASE_URL = (() => {
  const bruta = process.env.ASTRO_BASE || "http://127.0.0.1:4321/penguin-english-adventure/";
  return bruta.endsWith("/") ? bruta : bruta + "/";
})();

/* Rutas espejo de src/lib/rutas.ts (base de GitHub Pages incluida). */
export function rutaAstro(parte) {
  return BASE_URL + parte.replace(/^\//, "");
}

/* ficha del menú → clave de ruta (intro/{clave}/ → /{clave}/). */
export const CLAVES_ACTIVIDAD = {
  "Aprender vocabulario": "vocabulario",
  "Trivia": "trivia",
  "Completar palabra": "completar",
  "Ordenar palabra": "ordenar",
  "Juego de memoria": "memoria",
};

/* ---------- datos reales del repo (derivación, nunca trucado) ----------
   En ASTRO no hay PEA_DATOS global: los datos van embebidos en el build
   (src/data/*.json, emitidos del paquete Python). La suite los lee del
   repo para DERIVAR lo que la pantalla muestra (parejas de memoria,
   conteo de categorías, mensajes de Pipo). */
import { readFileSync } from "node:fs";

const leerDato = (nombre) =>
  JSON.parse(readFileSync(
    new URL("../web-astro/src/data/" + nombre, import.meta.url), "utf8"));

export const DATOS = {
  vocabulario: leerDato("vocabulario.json"),
  parejas: leerDato("parejas.json").parejas,
  niveles: leerDato("niveles.json"),
  pipo: leerDato("pipo.json").mensajes,
};

const INDICE_NIVEL = { A1: 0, A2: 1, B1: 2 };

/* Filtro acumulativo del producto: A2 incluye A1; B1 incluye los dos. */
export function palabrasDelNivelAstro(nivel) {
  const tope = INDICE_NIVEL[nivel];
  return Object.values(DATOS.vocabulario.categorias).flat()
    .filter((p) => INDICE_NIVEL[p.nivel] <= tope);
}

export function palabrasDeCategoriaAstro(nivel, categoria) {
  const tope = INDICE_NIVEL[nivel];
  return (DATOS.vocabulario.categorias[categoria] || [])
    .filter((p) => INDICE_NIVEL[p.nivel] <= tope);
}

export function parejasDelNivelAstro(nivel) {
  const tope = INDICE_NIVEL[nivel];
  return DATOS.parejas.filter((p) => INDICE_NIVEL[p.nivel] <= tope);
}

/* ---------- aserciones con contador global (mismo estilo vanilla) ---------- */

let contadorAsertos = 0;

export function asertosLogrados() {
  return contadorAsertos;
}

export function assert(cond, msg) {
  contadorAsertos += 1;
  if (!cond) throw new Error("Falló: " + msg);
}

export function assertEq(real, esperado, msg) {
  contadorAsertos += 1;
  if (real !== esperado) {
    throw new Error(
      "Falló: " + msg +
      " — esperado " + JSON.stringify(esperado) +
      ", real " + JSON.stringify(real));
  }
}

/* ---------- monitor de consola / red (consciente del origen) ---------- */

export function crearEstado() {
  return {
    origenSitio: null,     /* http://127.0.0.1:4321 — se fija en muroRed */
    redExterna: [],        /* pedidos a OTRO origen (la suite los aborta: 0) */
    pageErrors: [],        /* excepciones no atrapadas de la página */
    consoleCrudos: [],     /* errores de consola [{texto, url}] */
    fallosRed: [],         /* recursos del SITIO cuyo load falló */
    notasWhitelist: 0,     /* ignorados documentados (externo bloqueado) */
    violaciones: [],       /* acumulado final para el reporte */
  };
}

export function registrarMonitor(page, estado) {
  page.on("pageerror", (e) => estado.pageErrors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") {
      estado.consoleCrudos.push({ texto: m.text(), url: m.location()?.url || "" });
    }
  });
  page.on("requestfailed", (r) => estado.fallosRed.push(r.url()));
  page.on("request", (r) => {
    const url = r.url();
    if (/^https?:/.test(url) && estado.origenSitio && !url.startsWith(estado.origenSitio)) {
      estado.redExterna.push(url);
    }
  });
}

/* Muro de red: el SITIO debe ser autosuficiente. Todo pedido al origen
   de la base pasa; cualquier http(s) a OTRO origen se aborta y queda
   registrado (test 25 exige cero). A diferencia de la vanilla (file://,
   muro total), aquí la red "local" ES el sitio bajo prueba. */
export async function muroRed(context, estado) {
  const origen = new URL(BASE_URL).origin;
  estado.origenSitio = origen;
  const manejar = async (route) => {
    const url = route.request().url();
    if (url.startsWith(origen)) {
      try { await route.continue(); } catch { /* la carrera entre rutas */ }
      return;
    }
    if (/^https?:/.test(url)) {
      estado.redExterna.push(url);
      try { await route.abort(); } catch { /* puede competir */ }
      return;
    }
    try { await route.continue(); } catch { /* data:/blob: no piden red */ }
  };
  await context.route(/^https?:\/\//, manejar);
}

/* Audit de consola por test. Reglas:
   - pageerror SIEMPRE viola.
   - recurso del SITIO que no cargó viola (404 real).
   - recurso EXTERNO abortado por el muro: no viola aquí (test 25 ya
     lo cuenta como pedido externo); solo deja nota apareada.
   Los arrays se van vaciando al procesar (misma mecánica vanilla). */
export function auditarConsola(estado) {
  const violaciones = [];
  const origen = estado.origenSitio || "";

  for (const texto of estado.pageErrors.splice(0)) {
    violaciones.push({ tipo: "pageerror", texto });
  }

  for (const url of estado.fallosRed.splice(0)) {
    if (/^https?:/.test(url) && origen && !url.startsWith(origen)) {
      estado.notasWhitelist += 1;   /* pedido externo bloqueado, ya contado */
    } else {
      violaciones.push({ tipo: "recurso roto", texto: url });
    }
  }

  for (let i = estado.consoleCrudos.length - 1; i >= 0; i -= 1) {
    const { texto, url } = estado.consoleCrudos[i];
    const esRecurso = /Failed to load resource|net::ERR_/i.test(texto);
    const externoBloqueado = esRecurso && /^https?:/.test(url) && origen &&
      !url.startsWith(origen);
    if (externoBloqueado) {
      estado.notasWhitelist += 1;   /* apareceado con el abort del muro */
    } else {
      violaciones.push({
        tipo: esRecurso ? "recurso roto" : "console error",
        texto: url ? texto + " @ " + url : texto,
      });
    }
    estado.consoleCrudos.splice(i, 1);
  }

  estado.violaciones.push(...violaciones);
  return violaciones;
}

/* ---------- utilidades de página ---------- */

export async function nuevaPagina(context, estado) {
  const page = await context.newPage();
  registrarMonitor(page, estado);
  return page;
}

export async function limpiarEstado(page) {
  await page.evaluate(() => sessionStorage.clear()).catch(() => {});
}

export async function recargarLimpio(page) {
  await limpiarEstado(page);
  await page.reload({ waitUntil: "domcontentloaded" });
}

/* La transición de vista (ClientRouter): fetch + swap + islands en
   astro:page-load — ~850 ms antes de asertar (regla del proyecto). */
export async function asentar(page, ms = 850) {
  await page.waitForTimeout(ms);
}

/* Espera a que el h1 de la pantalla activa sea exactamente ese. */
export async function esperarPantalla(page, titulo, timeout = 6000) {
  await page.waitForFunction(
    (esperado) => {
      const t = document.querySelector("#pantalla .titulo-pantalla");
      return !!t && t.textContent.trim() === esperado;
    },
    titulo,
    { timeout },
  );
}

/* Espera a estar en la ruta del juego/actividad dada su clave
   ("trivia", "vocabulario", …): pathname termina en /{clave}/ y NO es
   una intro (intro/trivia/ también termina igual). */
export async function esperarRutaAstro(page, clave, timeout = 6000) {
  await page.waitForURL((u) =>
    u.pathname.endsWith("/" + clave + "/") && !u.pathname.includes("/intro/"),
    { timeout });
}

/* El HUD repinta Nivel en cada astro:page-load; las fichas las pinta
   la island del menú en el MISMO evento: esperar el nivel + 5 fichas
   es el señal fiable de "menú listo para asertar". */
export async function esperarMenuNivel(page, nivel, timeout = 6000) {
  await page.waitForFunction((n) => {
    const v = document.querySelector('[data-hud="nivel"]');
    return !!v && v.textContent.trim() === n &&
      document.querySelectorAll(".ficha-actividad").length === 5;
  }, nivel, { timeout });
  await asentar(page, 220);
}

/* El splash: SOLO en carga dura. Clic (pointerdown) saltable desde
   500 ms de montado; el velo muere con fade de ~340 ms. */
export async function saltarSplash(page) {
  const velo = page.locator(".pea-carga");
  await velo.waitFor({ state: "attached", timeout: 4000 }).catch(() => {});
  for (let intento = 0; intento < 6 && (await velo.count()) > 0; intento += 1) {
    await page.mouse.click(90, 70).catch(() => {});
    await velo.waitFor({ state: "detached", timeout: 1300 }).catch(() => {});
  }
  await velo.waitFor({ state: "detached", timeout: 2600 }).catch(() => {});
  await asentar(page, 420); /* deja viva la pantalla que estaba debajo */
}

/* ---------- lecturas del juego (HUD / menú / burbujas) ---------- */

/* El HUD: 4 chips (Jugador/Puntos/Aciertos/Nivel). */
export async function hudDato(page, rotulo) {
  return page.evaluate((r) => {
    for (const dato of document.querySelectorAll(".hud-dato")) {
      const l = dato.querySelector(".hud-rotulo");
      const v = dato.querySelector(".hud-valor");
      if (l && v && l.textContent.trim() === r) return v.textContent.trim();
    }
    return null;
  }, rotulo);
}

export async function hudPuntos(page) {
  const bruto = await hudDato(page, "Puntos:");
  const n = Number.parseInt((bruto || "").replace(/[^\d-]/g, ""), 10);
  return Number.isNaN(n) ? -1 : n;
}

export async function hudAtributos(page) {
  const rotulos = await page.evaluate(() =>
    [...document.querySelectorAll(".hud-dato .hud-rotulo")].map(
      (l) => l.textContent.trim(),
    ));
  const oculto = await page.evaluate(() => {
    const hud = document.getElementById("hud");
    return !hud || hud.hidden;
  });
  return { rotulos, oculto };
}

/* Las 5 fichas del menú con su detalle real del nivel (las pinta la
   island del menú; mismas clases que la vanilla). */
export async function fichasMenu(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".ficha-actividad")].map((f) => ({
      nombre: f.querySelector(".ficha-nombre")?.textContent.trim() || "",
      detalle: f.querySelector(".ficha-detalle")?.textContent.trim() || "",
      completada: f.classList.contains("completada"),
      conCheck: !!f.querySelector(".ficha-hecha"),
    })));
}

export function detalleDe(fichas, nombreFicha) {
  const f = fichas.find((x) => x.nombre === nombreFicha);
  return f ? f.detalle : null;
}

/* Texto de la burbuja de Pipo de la pantalla activa. */
export async function textoPipo(page) {
  return page.evaluate(() => {
    const b = document.querySelector("#pantalla .burbuja");
    return b ? b.textContent.trim() : null;
  });
}

/* En ASTRO los mensajes de Pipo viven en src/data/pipo.json (repo),
   no en un global PEA_DATOS: la clave se valida contra ese archivo. */
export async function assertPipoClave(page, clave, msg) {
  const mensajes = DATOS.pipo[clave] || [];
  const burbuja = await textoPipo(page);
  assert(mensajes.includes(burbuja),
    msg + " — la burbuja de Pipo (" + JSON.stringify(burbuja) +
    ") no pertenece a la clave '" + clave +
    "' (los mensajes se eligen al azar dentro de la clave)");
}

/* El <p> del veredicto (¡Correcto!… / ¡Incorrecto!…). En Astro es el
   único <p class="seccion"> de las pantallas de juego. */
export async function textoVeredicto(page) {
  return page.evaluate(() => {
    const p = document.querySelector("#pantalla p.seccion");
    return p ? p.textContent.trim() : null;
  });
}

/* Las 4 líneas de la pantalla de resultado (spans .linea). */
export async function lineasResultado(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("#pantalla .linea")]
      .map((n) => n.textContent.trim()));
}

/* "X de 5 actividades completadas (Y%)" — la pinta la island del menú. */
export async function textoProgreso(page) {
  return page.evaluate(() => {
    const t = document.querySelector("[data-progreso-texto]");
    return t ? t.textContent.trim() : null;
  });
}

/* El contador del juego de memoria: "Parejas encontradas: N de M". */
export async function textoContadorMemoria(page) {
  return page.evaluate(() => {
    const t = document.querySelector("[data-isla-memoria] .texto-secundario");
    return t ? t.textContent.trim() : null;
  });
}

/* ---------- navegaciones típicas ---------- */

/* Menú → intro de la actividad → pantalla del juego (por enlaces
   reales: son <a> con View Transition, no botones). */
export async function abrirJuego(page, nombreFicha) {
  const clave = CLAVES_ACTIVIDAD[nombreFicha];
  assert(!!clave, "ficha conocida: " + nombreFicha);
  await page.locator(".ficha-actividad").filter({ hasText: nombreFicha })
    .first().click();
  await page.waitForURL((u) => u.pathname.includes("/intro/" + clave + "/"));
  await esperarPantalla(page, nombreFicha);
  await asentar(page);
  await page.getByRole("link", { name: "Empezar " + nombreFicha }).click();
  await esperarRutaAstro(page, clave);
  await esperarPantalla(page, nombreFicha);
  await asentar(page);
}

/* Vocabulario por su ficha: menú → intro → listado de categorías. */
export async function abrirVocabularioDesdeMenu(page) {
  await page.locator(".ficha-actividad")
    .filter({ hasText: "Aprender vocabulario" }).first().click();
  await page.waitForURL((u) => u.pathname.includes("/intro/vocabulario/"));
  await esperarPantalla(page, "Aprender vocabulario");
  await asentar(page);
  await page.getByRole("link", { name: "Empezar Aprender vocabulario" }).click();
  await esperarRutaAstro(page, "vocabulario");
  await page.waitForFunction(
    () => document.querySelectorAll("#pantalla .btn-categoria").length === 20,
    null, { timeout: 5000 });
  await asentar(page);
}

/* De cualquier pantalla CON HUD al menú por el enlace del encabezado:
   navegación interna (View Transition) — SIN splash. */
export async function volverAlMenu(page) {
  await page.locator("#hud").getByRole("link", { name: "Menú", exact: true })
    .click();
  await page.waitForURL((u) => u.pathname.endsWith("/menu/"));
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);
}

/* "Volver al menú" desde un RESULTADO: el botón de resultado navega
   con location.href (carga dura real) → el splash vuelve y hay que
   saltarlo. Es el único camino interno que re-monta el velo. */
export async function volverDeResultado(page) {
  await page.getByRole("button", { name: /Volver al menú/ }).click();
  await page.waitForURL((u) => u.pathname.endsWith("/menu/"), { timeout: 8000 });
  await saltarSplash(page);
  await esperarMenuNivel(page, "A2").catch(() => {});
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await asentar(page);
}

/* Re-arma el estado base si el test anterior falló: sesión limpia →
   carga dura del inicio → sin splash → login → menú en A2. Sirve para
   que un fallo se reporte una vez y no arrastre por cascada. */
export async function recuperarMenu(page) {
  await recargarLimpio(page);
  await saltarSplash(page);
  /* recargarLimpio limpió la sesión: forzar el inicio por URL */
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await saltarSplash(page);
  await esperarPantalla(page, "Penguin English Adventure", 3000);
  await page.locator("input[aria-label='Tu nombre']").fill("Sara QA");
  await page.getByRole("button", { name: /Comenzar/ }).click();
  await esperarMenuNivel(page, "A2", 6000);
  await page.locator("[data-isla-menu] button[data-nivel-menu='A2']").click()
    .catch(() => {});
  await esperarMenuNivel(page, "A2", 6000);
}

/* ---------- tablero de memoria (derivado del tablero VIVO) ---------- */

/* Lee los frentes del tablero actual y deriva las parejas:
   - carta con .palabra-memo → la palabra está EN el DOM;
   - carta con <img> → su src es una URL optimizada del build; el mapa
     data-imagenes de [data-isla-memoria] (JSON filename→URL, inyectado
     por memoria.astro) se invierte para recuperar el filename, y
     data/parejas.json (repo) lo mapea a su inglés.
   Doble lectura idéntica: la island se init DOS veces (llamada directa
   + astro:page-load) y re-crea el tablero; exigir estabilidad evita
   leer un tablero que va a ser reemplazado. */
export async function leerTableroMemoriaAstro(page, nivel) {
  const banco = parejasDelNivelAstro(nivel);
  let anterior = null;
  for (let intento = 0; intento < 20; intento += 1) {
    await page.waitForFunction(() => {
      const cartas = [...document.querySelectorAll(".memo-tablero .memoria-carta")];
      return cartas.length > 0 && cartas.every((c) => {
        if (c.querySelector(".palabra-memo")) return true;
        const img = c.querySelector(".cara-frente img");
        return !!img && (img.getAttribute("src") || "").length > 0;
      });
    }, null, { timeout: 6000 });

    const crudo = await page.evaluate(() => {
      const raiz = document.querySelector("[data-isla-memoria]");
      const mapa = JSON.parse(raiz?.dataset.imagenes ?? "{}");
      const urlAarchivo = {};
      for (const [archivo, url] of Object.entries(mapa)) urlAarchivo[url] = archivo;
      return [...document.querySelectorAll(".memo-tablero .memoria-carta")]
        .map((c, i) => {
          const palabra = c.querySelector(".palabra-memo");
          if (palabra) return { i, ingles: palabra.textContent.trim(), tipo: "palabra" };
          const img = c.querySelector(".cara-frente img");
          const src = img ? img.getAttribute("src") || "" : "";
          return {
            i, tipo: "imagen", src,
            archivo: urlAarchivo[src] ?? null,
          };
        });
    });

    const cartas = crudo.map((c) => c.tipo === "imagen"
      ? { ...c, ingles: banco.find((p) => p.imagen === c.archivo)?.ingles ?? null }
      : c);
    if (anterior && JSON.stringify(anterior) === JSON.stringify(cartas)) {
      return armarParejas(cartas);
    }
    anterior = cartas;
    await page.waitForTimeout(240);
  }
  throw new Error("el tablero de memoria nunca se estabilizó (doble lectura distinta)");
}

function armarParejas(cartas) {
  const parejas = [];
  const palabras = cartas.filter((c) => c.tipo === "palabra");
  for (const p of palabras) {
    const img = cartas.find((c) =>
      c.tipo === "imagen" && c.ingles === p.ingles &&
      !parejas.some((z) => z.img.i === c.i));
    parejas.push({ palabra: p, img });
  }
  return { cartas, parejas };
}

/* Clic de la carta n-ésima con reintentos suaves (el juego ignora
   clics mientras espera el flip de un fallo o con dos volteadas). */
export async function voltearCarta(page, indice) {
  for (let intento = 0; intento < 5; intento += 1) {
    await page.locator(".memoria-carta").nth(indice).click();
    await page.waitForTimeout(160);
    const abierta = await page.locator(".memoria-carta").nth(indice)
      .evaluate((c) =>
        c.classList.contains("volteada") || c.classList.contains("resuelta"));
    if (abierta) return true;
  }
  return false;
}

/* ---------- resultados ---------- */

/* Verifica el molde de las 4 líneas de un resultado y la aritmética
   exacta con los puntos del HUD. En trivia/completar/ordenar el delta
   es puntos_de_actividad + 20; en memoria "Puntos en la actividad"
   refleja los INTENTOS (paridad Tk) y el delta real es correctas*10+20:
   indicar deltaDe="correctas" para esa pantalla. */
export async function asertarResultado(page, puntosAntes, opciones) {
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
      "delta total del HUD = parejas encontradas ×10 + bono 20");
  } else {
    assertEq(totalHUD - puntosAntes, puntosActividad + 20,
      "delta total del HUD = puntos de actividad + bono 20");
  }
  return { correctas, total, puntosActividad, totalHUD };
}

/* ---------- resumen ---------- */

export function resumenSuite(resultados, extra) {
  const lineas = [];
  lineas.push("");
  lineas.push("═══ Resultado de la suite ═══");
  for (const r of resultados) {
    lineas.push((r.ok ? "  ✔" : "  ✘") + " " + r.nombre + " (" + r.ms + " ms)" +
      (r.ok ? "" : "  ← " + String(r.detalle).slice(0, 300)));
  }
  lineas.push("");
  lineas.push(
    "Tests: " + resultados.length +
    " · Passed: " + resultados.filter((r) => r.ok).length +
    " · Failed: " + resultados.filter((r) => !r.ok).length +
    (extra.asertos != null ? " · Asertos: " + extra.asertos : "") +
    " · Tiempo: " + extra.ms + " ms" +
    " · Base: " + BASE_URL);
  if (extra.notasWhitelist) {
    lineas.push(
      "Nota: " + extra.notasWhitelist +
      " mensajes de consola ignorados documentadamente (recursos externos bloqueados por el muro).");
  }
  return lineas.join("\n");
}
