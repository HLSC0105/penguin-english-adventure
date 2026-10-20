/* Island del menú (espejo de interfaz/menu.py): el nivel actual decide
   los detalles de cada ficha (palabras/preguntas/rondas/parejas) y la
   barra de progreso viene de la sesión. Cambiar de nivel navega a la
   MISMA ruta: el View Transition repinta (el equivalente del
   repintar_pantalla del escritorio). */
import { navigate } from "astro:transitions/client";
import {
  categoriasDelNivel, palabrasDelNivel, preguntasDelNivel, parejasDelNivel,
  parametrosNivel, type Nivel,
} from "../lib/datos";
import {
  actividadCompletada, progresoPorcentaje, leerNivel, cerrarSesion,
  establecerNivel, leerActividades, type Nivel,
} from "../lib/estado";
import { nivelValido } from "../lib/datos";
import { reproducir } from "../lib/sonidos";
import { ruta } from "../lib/rutas";

const ACTIVIDADES: Array<{ nombre: string; clave: string; icono?: string }> = [
  { nombre: "Aprender vocabulario", clave: "vocabulario" },
  { nombre: "Trivia", clave: "trivia", icono: "bi-patch-question" },
  { nombre: "Completar palabra", clave: "completar", icono: "bi-brush" },
  { nombre: "Ordenar palabra", clave: "ordenar", icono: "bi-sort-down-alt" },
  { nombre: "Juego de memoria", clave: "memoria", icono: "bi-layout-three-columns" },
];

let mapaimagenes: Record<string, string> = {};

function ficha(clave: string): HTMLElement {
  const nivel = leerNivel();
  const parametros = parametrosNivel(nivel);
  const definicion = ACTIVIDADES.find((a) => a.clave === clave)!;
  const completada = actividadCompletada(clave);

  let detalle = "";
  if (clave === "vocabulario") {
    const palabras = palabrasDelNivel(nivel);
    const categorias = categoriasDelNivel(nivel);
    detalle = `${palabras.length} palabras · ${Object.keys(categorias).length} categorías · para estudiar, sin puntos`;
  } else if (clave === "trivia") {
    const preguntas = Math.min(parametros.trivia, preguntasDelNivel(nivel).length);
    detalle = `${preguntas} preguntas`;
  } else if (clave === "completar") {
    detalle = `${parametros.completar} rondas`;
  } else if (clave === "ordenar") {
    detalle = `${parametros.ordenar} rondas`;
  } else {
    const parejas = Math.min(parametros.memoriaParejas, parejasDelNivel(nivel).length);
    detalle = `${parejas} parejas`;
  }

  const a = document.createElement("a");
  a.className = `ficha-actividad${completada ? " completada" : ""}${clave === "vocabulario" ? " ficha-vocab" : ""}`;
  a.href = ruta(`intro/${clave}/`);
  a.setAttribute("aria-label",
    `${definicion.nombre}${completada ? ", ya completada" : ""}, ${detalle}`);

  const nombreNodo = document.createElement("span");
  nombreNodo.className = "ficha-nombre";
  if (definicion.icono) {
    const icono = document.createElement("i");
    icono.className = `bi ${definicion.icono}`;
    icono.setAttribute("aria-hidden", "true");
    nombreNodo.append(icono);
  }
  nombreNodo.append(document.createTextNode(definicion.nombre));
  if (completada) {
    const hecha = document.createElement("i");
    hecha.className = "bi bi-check2-circle ficha-hecha";
    hecha.setAttribute("aria-hidden", "true");
    nombreNodo.append(hecha);
  }
  a.append(nombreNodo);

  const detalleNodo = document.createElement("span");
  detalleNodo.className = "ficha-detalle";
  detalleNodo.textContent = detalle;
  a.append(detalleNodo);

  if (clave === "vocabulario") {
    const muestras = document.createElement("div");
    muestras.className = "ficha-muestras";
    palabrasDelNivel(nivel).slice(0, 4).forEach((palabra) => {
      if (!palabra.imagen) return;
      const img = document.createElement("img");
      img.src = mapaimagenes[palabra.imagen] ?? "";
      img.alt = palabra.ingles;
      img.loading = "lazy";
      muestras.append(img);
    });
    a.append(muestras);
  }
  return a;
}

function iniciar(): void {
  if (document.body.dataset.pantalla !== "menu") return;
  const raiz = document.querySelector<HTMLElement>("[data-isla-menu]");
  if (!raiz || raiz.dataset.iniciado === "1") return;
  raiz.dataset.iniciado = "1";

  /* el mapa de imágenes optimizadas PRIMERO: las fichas lo consumen */
  mapaimagenes = JSON.parse(raiz.dataset.imagenes ?? "{}");

  /* progreso (barra + texto) */
  const barra = raiz.querySelector<HTMLElement>("[data-progreso-relleno]");
  if (barra) barra.style.setProperty("--lleno", String(progresoPorcentaje() / 100));
  const barraMarco = raiz.querySelector("[data-progreso]");
  if (barraMarco) barraMarco.setAttribute("aria-valuenow", String(progresoPorcentaje()));
  const texto = raiz.querySelector<HTMLElement>("[data-progreso-texto]");
  if (texto) {
    texto.textContent = `${leerActividades().length} de 5 actividades completadas (${progresoPorcentaje()}%)`;
  }

  /* fichas: destacada vocabulario + las 4 compactas */
  const destacada = raiz.querySelector("[data-ficha-destacada]")!;
  destacada.replaceChildren(ficha("vocabulario"));
  const compactas = raiz.querySelector("[data-fichas-compactas]")!;
  ["trivia", "completar", "ordenar", "memoria"].forEach((clave) => {
    const col = document.createElement("div");
    compactas.append(col);
    col.append(ficha(clave));
  });

  /* chips de nivel: el activo marca acento; cambiar navega (repaint) */
  const chips = raiz.querySelectorAll<HTMLButtonElement>(".pea-chip[data-nivel-menu]");
  const nivel = leerNivel();
  chips.forEach((chip) => {
    const activa = chip.dataset.nivelMenu === nivel;
    chip.classList.toggle("activa", activa);
    chip.setAttribute("aria-pressed", String(activa));
    chip.addEventListener("click", () => {
      const candidato = chip.dataset.nivelMenu as Nivel;
      if (nivelValido(candidato)) establecerNivel(candidato);
      reproducir("clic");
      navigate(ruta("menu/"));
    });
  });

  /* cerrar sesión (el "Salir" del escritorio) */
  raiz.querySelector<HTMLButtonElement>("[data-accion='salir']")
    ?.addEventListener("click", () => {
      reproducir("clic");
      cerrarSesion();
      navigate(ruta(""));
    });
}

iniciar();
document.addEventListener("astro:page-load", iniciar);
