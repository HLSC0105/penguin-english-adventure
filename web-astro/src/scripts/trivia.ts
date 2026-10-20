/* Island de trivia (espejo de mostrar_trivia/mostrar_opciones/
   mostrar_feedback): el estado (índice, aciertos, respondida, elegida)
   vive en el closure de la partida; responder re-pinta el contenedor —
   un ciclo PSeInt desenrollado en callbacks, ahora con rutas reales. */
import { navigate } from "astro:transitions/client";
import { obtenerPreguntas, validarRespuesta, type Pregunta } from "../lib/juegos";
import { sumarRespuesta, sumarBonificacion, completarActividad, leerNivel } from "../lib/estado";
import { reproducir } from "../lib/sonidos";
import { ruta } from "../lib/rutas";

const LETRAS = ["A", "B", "C", "D"];

interface EstadoPartida {
  preguntas: Pregunta[];
  indice: number;
  aciertos: number;
  puntosActividad: number;
  respondida: boolean;
  elegida: string | null;
}

let partida: EstadoPartida;

function nodo(tag: string, clase: string, texto?: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function pintar(raiz: HTMLElement): void {
  raiz.replaceChildren();
  const pregunta = partida.preguntas[partida.indice];
  const total = partida.preguntas.length;

  raiz.append(nodo("p", "texto-secundario fuente-num text-center mb-1",
    `Pregunta ${partida.indice + 1} de ${total}`));

  const barra = nodo("div", "barra-progreso seccion", "");
  barra.setAttribute("role", "progressbar");
  barra.setAttribute("aria-valuenow", String(Math.round(((partida.indice + 1) * 100) / total)));
  barra.setAttribute("aria-valuemin", "0");
  barra.setAttribute("aria-valuemax", "100");
  const relleno = nodo("div", "relleno", "");
  relleno.style.setProperty("--lleno", String(((partida.indice + 1) * 100) / total / 100));
  barra.append(relleno);
  raiz.append(barra);

  raiz.append(nodoTexto(pregunta.pregunta));

  const marco = nodo("div", "grid gap-3 mx-auto", "");
  marco.style.gridTemplateColumns = "repeat(auto-fit,minmax(min(100%,300px),1fr))";
  marco.style.maxWidth = "660px";

  pregunta.opciones.forEach((opcion, posicion) => {
    const boton = nodo("button", "btn-opcion", "");
    boton.type = "button";
    if (partida.respondida) {
      boton.disabled = true;
      boton.setAttribute("aria-disabled", "true");
      if (opcion === pregunta.correcta) boton.classList.add("esta-correcta", "pulso-acierto");
      else if (opcion === partida.elegida) boton.classList.add("esta-incorrecta");
      else boton.classList.add("quieto");
    } else {
      boton.addEventListener("click", () => responder(opcion));
    }
    boton.append(document.createTextNode(`${LETRAS[posicion]}. ${opcion}`));
    marco.append(boton);
  });
  raiz.append(marco);

  if (partida.respondida) feedback(raiz, pregunta, total);
}

function nodoTexto(texto: string): HTMLElement {
  const p = nodo("p", "font-semibold text-center mb-3", "");
  p.style.fontSize = "1.25rem";
  p.textContent = texto;
  return p;
}

function responder(opcion: string): void {
  const pregunta = partida.preguntas[partida.indice];
  const esCorrecta = validarRespuesta(pregunta, opcion);
  const ganados = sumarRespuesta(esCorrecta);
  document.dispatchEvent(new CustomEvent("pea:hud"));
  reproducir(esCorrecta ? "correcto" : "error");
  partida = {
    ...partida,
    aciertos: partida.aciertos + (esCorrecta ? 1 : 0),
    puntosActividad: partida.puntosActividad + ganados,
    respondida: true,
    elegida: opcion,
  };
  pintar(raizActual!);
}

function feedback(raiz: HTMLElement, pregunta: Pregunta, total: number): void {
  if (partida.elegida === pregunta.correcta) {
    raiz.append(nodoTextoColor("¡Correcto! +10 puntos", "var(--tema-correcto)"));
  } else {
    raiz.append(nodoTextoColor(
      `¡Incorrecto! La respuesta era: ${pregunta.correcta}`, "var(--tema-incorrecto)"));
  }

  /* Pipo explica por qué era esa la respuesta correcta. */
  const pipo = nodo("div", "pipo seccion", "");
  const foto = document.createElement("img");
  foto.className = "pipo-foto";
  foto.src = ruta("pinguino_128.png");
  foto.alt = "Pipo, el pingüino";
  pipo.append(foto, nodo("div", "burbuja", pregunta.explicacion));
  raiz.append(pipo);

  const pie = nodo("div", "flex justify-center seccion", "");
  const boton = nodo("button", "btn-pea", "");
  boton.type = "button";
  boton.setAttribute("aria-label", "Siguiente pregunta");
  boton.innerHTML = "<i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i> Siguiente";
  boton.addEventListener("click", () => {
    reproducir("clic");
    siguiente(total);
  });
  pie.append(boton);
  raiz.append(pie);
}

function nodoTextoColor(texto: string, color: string): HTMLElement {
  const p = nodo("p", "font-semibold text-center seccion mb-0", texto);
  p.style.color = color;
  return p;
}

function siguiente(total: number): void {
  if (partida.indice + 1 < total) {
    partida = { ...partida, indice: partida.indice + 1, respondida: false, elegida: null };
    pintar(raizActual!);
    return;
  }
  /* fin: la bonificación ya sumada ANTES de la ruta de resultado (si
     se sumara tras un repinte, se duplicaría — misma regla del escritorio). */
  completarActividad("trivia");
  sumarBonificacion();
  document.dispatchEvent(new CustomEvent("pea:hud"));
  reproducir("ganar");
  sessionStorage.setItem("pea.resultado", JSON.stringify({
    titulo: "¡Trivia completada!",
    puntosActividad: partida.puntosActividad,
    total: partida.preguntas.length,
    correctas: partida.aciertos,
    actividad: "trivia",
  }));
  navigate(ruta(`resultado/?actividad=trivia`));
}

let raizActual: HTMLElement | null = null;

function iniciar(): void {
  if (document.body.dataset.pantalla !== "trivia") return;
  const raiz = document.querySelector<HTMLElement>("[data-isla-trivia]");
  if (!raiz) return;
  raizActual = raiz;
  partida = {
    preguntas: obtenerPreguntas(leerNivel()),
    indice: 0, aciertos: 0, puntosActividad: 0, respondida: false, elegida: null,
  };
  pintar(raiz);
}

iniciar();
document.addEventListener("astro:page-load", iniciar);
