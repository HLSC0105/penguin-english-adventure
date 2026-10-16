/* helpers.mjs — infraestructura compartida de la suite E2E de
   Penguin English Adventure (web). Todo corre sobre file:// con la
   red externa bloqueada: el juego debe ser 100 % offline.

   Convenciones espejadas del juego:
   - La navegación tiene fase de salida (95 ms) + cascada (~400 ms):
     tras cada click/navegación se espera ~520 ms antes de asertar.
   - El splash (pea-carga) se monta sobre la pantalla real; es saltable
     desde 500 ms y se desvanece en ~340 ms tras salir ("carga-muriendo").
   - sessionStorage persiste por página: limpiarEstado() + recarga
     devuelve el juego a su estado virgen (y el splash reaparece). */

export const URL_WEB =
  "file:///home/leandro/WorkSpace/sandra/penguin-english-adventure/web/index.html";

/* ---------- aserciones con contador global ---------- */

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

/* ---------- monitor de consola / red ---------- */

export function crearEstado() {
  return {
    redExterna: [],      /* pedidos http(s)/ws que la suite abortó (debe ser 0) */
    pageErrors: [],      /* excepciones no atrapadas de la página */
    consoleCrudos: [],   /* errores de consola (texto) */
    fallosRed: [],       /* recursos cuyo load falló (con URL) */
    fallosCapturas: 0,   /* −de esos−, los sabidos de assets/capturas/ (no existen a propósito) */
    notasWhitelist: 0,   /* ignorados documentados */
    violaciones: [],     /* acumulado final para el reporte */
  };
}

export function registrarMonitor(page, estado) {
  page.on("pageerror", (e) => estado.pageErrors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") estado.consoleCrudos.push(m.text());
  });
  page.on("requestfailed", (r) => estado.fallosRed.push(r.url()));
  page.on("request", (r) => {
    if (!/^file:/.test(r.url())) estado.redExterna.push(r.url());
  });
}

/* Muro: aborta cualquier pedido salvo file://. Si el juego pidiera
   algo externo, queda registrado en estado.redExterna y la suite
   falla (honor a "100 % offline"). */
export async function bloquearRedExterna(context, estado) {
  const abortar = async (route) => {
    estado.redExterna.push(route.request().url());
    try {
      await route.abort();
    } catch { /* la cancellación puede competir entre rutas */ }
  };
  await context.route("http://**", abortar);
  await context.route("https://**", abortar);
  await context.route("ws://**", abortar);
  await context.route("wss://**", abortar);
}

/* Audit de consola. Reglas (documentadas también en README):
   - pageerror SIEMPRE viola.
  - recursos locales inexistentes que NO son sabidos violan.
  - los 4 <img> de la documentación (assets/capturas/*.png) sabidamente
    faltan en el repo: sus mensajes "Failed to load resource" se ignoran
    por conteo, apareados con los requestfailed de capturas registrados.
  Se llama una vez por test; los arrays se van vaciando al procesar. */
export function auditarConsola(estado) {
  const violaciones = [];

  for (const texto of estado.pageErrors.splice(0)) {
    violaciones.push({ tipo: "pageerror", texto });
  }

  for (const url of estado.fallosRed.splice(0)) {
    if (url.includes("/assets/capturas/")) {
      estado.fallosCapturas += 1; /* entra al saldo ignorable */
    } else {
      violaciones.push({ tipo: "recurso roto", texto: url });
    }
  }

  for (let i = estado.consoleCrudos.length - 1; i >= 0; i -= 1) {
    const texto = estado.consoleCrudos[i];
    const esRecurso = /Failed to load resource|net::ERR_/i.test(texto);
    if (esRecurso && estado.fallosCapturas > 0) {
      estado.fallosCapturas -= 1; /* consume el saldo documentado */
      estado.notasWhitelist += 1;
    } else {
      violaciones.push({
        tipo: esRecurso ? "recurso roto" : "console error",
        texto,
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

/* La transición de navegación: salida 95 ms + cascada ~400 ms. */
export async function asentar(page, ms = 520) {
  await page.waitForTimeout(ms);
}

/* Espera a que el título de la pantalla activa sea exactamente ese. */
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

/* El splash: aparece en cada carga. Clic (pointerdown) saltable desde
   500 ms de montado; el velo muere en ~340 ms ("carga-muriendo"). */
export async function saltarSplash(page) {
  const velo = page.locator(".pea-carga");
  await velo.waitFor({ state: "attached", timeout: 4000 }).catch(() => {});
  for (let intento = 0; intento < 6 && (await velo.count()) > 0; intento += 1) {
    await page.mouse.click(90, 70).catch(() => {});
    await page.waitForTimeout(430); /* 340 ms de desvanecimiento + margen */
  }
  await velo.waitFor({ state: "detached", timeout: 2500 }).catch(() => {});
  await asentar(page, 420); /* deja viva la pantalla que estaba debajo */
}

/* Lectura del ciclo del splash por sondeo: {montado, primerTick, vivoVisto, tMuriendo, tRemovido}.
   Con {esperarMontaje:false} sondea en seguida (útil tras una recarga,
   donde el temporizador del splash ya arrancó antes de que el test
   pueda mirar la página). */
export async function sondearSplash(page, maxMs, opciones) {
  const config = opciones || {};
  if (config.esperarMontaje !== false) {
    await page
      .locator(".pea-carga")
      .waitFor({ state: "attached", timeout: 3000 })
      .catch(() => {});
  }
  const montado = Date.now();
  let primerTick = Date.now();
  let vivoVisto = false;
  let tMuriendo = 0;
  let tRemovido = 0;
  while (Date.now() - montado < maxMs) {
    primerTick = primerTick || Date.now();
    const st = await page.evaluate(() => {
      const v = document.querySelector(".pea-carga");
      return v
        ? (v.classList.contains("carga-muriendo") ? "muriendo" : "vivo")
        : "removido";
    });
    if (st === "vivo") vivoVisto = true;
    if (st === "muriendo" && !tMuriendo) tMuriendo = Date.now();
    if (st === "removido") {
      tRemovido = Date.now();
      break;
    }
    await page.waitForTimeout(30);
  }
  return { montado, primerTick, vivoVisto, tMuriendo, tRemovido };
}

/* ---------- lecturas del juego (HUD / menú / burbujas) ---------- */

/* El HUD: 4 chips (Jugador/Puntos/Aciertos/Nivel). */
export async function hudDato(page, rotulo) {
  const valor = await page.evaluate((r) => {
    for (const dato of document.querySelectorAll(".hud-dato")) {
      const l = dato.querySelector(".hud-rotulo");
      const v = dato.querySelector(".hud-valor");
      if (l && v && l.textContent.trim() === r) return v.textContent.trim();
    }
    return null;
  }, rotulo);
  return valor;
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

/* Chip "+N" de puntos del HUD: nace con el refresco tras acierto y
   se autodestruye a los ~950 ms. */
export async function asertarChipPuntos(page, textoEsperado) {
  const chip = page.locator(".hud .chip-puntos");
  await chip.waitFor({ state: "visible", timeout: 1600 });
  assertEq((await chip.textContent()).trim(), textoEsperado,
    "texto del chip de puntos del HUD");
  await chip.waitFor({ state: "detached", timeout: 1600 });
  assertEq(await page.locator(".chip-puntos").count(), 0,
    "el chip de puntos se autodestruye (~950 ms)");
}

/* Las 5 fichas del menú con su detalle real del nivel. */
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

/* La burbuja debe traer un mensaje del diccionario con esa clave. */
export async function assertPipoClave(page, clave, msg) {
  const ok = await page.evaluate((c) => {
    const b = document.querySelector("#pantalla .burbuja");
    return !!b && PEA_DATOS.pipo[c].includes(b.textContent.trim());
  }, clave);
  assert(ok, msg + " — la burbuja de Pipo no pertenece a '" + clave +
    "' (los mensajes se eligen al azar dentro de la clave)");
}

/* El <p> del veredicto (¡Correcto!… / ¡Incorrecto!…). */
export async function textoVeredicto(page) {
  const t = await page.evaluate(() => {
    const p = document.querySelector("#pantalla p.fs-5.seccion");
    return p ? p.textContent.trim() : null;
  });
  return t;
}

/* Las líneas de la pantalla de resultado. */
export async function lineasResultado(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".resultado-lineas .linea")]
      .map((n) => n.textContent.trim()));
}

/* ---------- lecturas de datos internos (para derivar, no para trucar) */

export async function datosNivel(page) {
  return page.evaluate(() => ({
    nivel: PEA.estado.leerNivel(),
    palabras: PEA.niveles.palabrasDelNivel(PEA.estado.leerNivel()).length,
    categorias: Object.keys(PEA.niveles.categoriasDelNivel(PEA.estado.leerNivel())),
    parametros: PEA.niveles.parametrosNivel(PEA.estado.leerNivel()),
    preguntas: PEA.niveles.preguntasDelNivel(PEA.estado.leerNivel()).length,
    parejas: PEA.niveles.parejasDelNivel(PEA.estado.leerNivel()).length,
  }));
}

export async function palabrasDeCategoria(page, categoria) {
  return page.evaluate((c) => {
    const nivel = PEA.estado.leerNivel();
    return (PEA.niveles.categoriasDelNivel(nivel)[c] || []).length;
  }, categoria);
}

/* ---------- tablero de memoria ---------- */

/* Lee los 12 frentes del tablero actual y deriva las 6 parejas:
   carta con .palabra-memo → palabra; carta con <img> → su filename
   se mapea contra PEA_DATOS.parejas para conocer su inglés. */
export async function leerTableroMemoria(page) {
  await page.waitForFunction(() => {
    const cartas = [...document.querySelectorAll(".memo-tablero .memoria-carta")];
    return cartas.length > 0 && cartas.every((c) => {
      if (c.querySelector(".palabra-memo")) return true;
      const img = c.querySelector(".cara-frente img");
      return !!img && (img.getAttribute("src") || "").length > 0;
    });
  }, null, { timeout: 5000 });

  const crudo = await page.evaluate(() => {
    const datos = PEA_DATOS.parejas;
    const cartas = [...document.querySelectorAll(".memo-tablero .memoria-carta")];
    return cartas.map((c, i) => {
      const palabra = c.querySelector(".palabra-memo");
      if (palabra) return { i, ingles: palabra.textContent.trim(), tipo: "palabra" };
      const img = c.querySelector(".cara-frente img");
      const fn = (img.getAttribute("src") || "").split("/").pop();
      const pareja = datos.find((p) => p.imagen === fn);
      return { i, ingles: pareja ? pareja.ingles : null, tipo: "imagen", fn };
    });
  });

  const parejas = [];
  const palabras = crudo.filter((c) => c.tipo === "palabra");
  for (const p of palabras) {
    const imagen = crudo.find(
      (c) => c.tipo === "imagen" && c.ingles === p.ingles && !parejas.some((z) => z.img.i === c.i));
    parejas.push({ palabra: p, img: imagen });
  }
  return { cartas: crudo, parejas };
}

/* ---------- resultados ---------- */

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
    " · Tiempo: " + extra.ms + " ms");
  if (extra.notasWhitelist) {
    lineas.push(
      "Nota: " + extra.notasWhitelist +
      " mensajes de consola ignorados documentadamente (img sabidamente ausentes de assets/capturas/).");
  }
  return lineas.join("\n");
}
