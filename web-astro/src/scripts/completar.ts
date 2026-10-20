/* Island de completar (espejo de mostrar_completar y sus opciones/
   feedback): la palabra con hueco en .letra-celda, tres .btn-letra,
   y en feedback el guion bajo sigue visible (paridad Tk: MEJORAS 4.7
   está pendiente ahí también). */
import { navigate } from "astro:transitions/client";
import { crearPregunta, letrasConHueco, cantidadRondas, type PreguntaHueco } from "../lib/juegos";
import { sumarRespuesta, sumarBonificacion, completarActividad, leerNivel } from "../lib/estado";
import { reproducir } from "../lib/sonidos";
import { ruta } from "../lib/rutas";

interface EstadoRonda {
  ronda: number;
  total: number;
  aciertos: number;
  puntosActividad: number;
  respondida: boolean;
  pregunta: PreguntaHueco;
  elegida: string | null;
}

let ronda: EstadoRonda;
let raizActual: HTMLElement | null = null;

function nodo(tag: string, clase: string, texto?: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function pintar(): void {
  const raiz = raizActual!;
  raiz.replaceChildren();

  raiz.append(nodo("p", "texto-secundario fuente-num text-center mb-1",
    `Ronda ${ronda.ronda + 1} de ${ronda.total}`));

  const barra = nodo("div", "barra-progreso seccion", "");
  barra.setAttribute("role", "progressbar");
  barra.setAttribute("aria-valuenow", String(Math.round(((ronda.ronda + 1) * 100) / ronda.total)));
  barra.setAttribute("aria-valuemin", "0");
  barra.setAttribute("aria-valuemax", "100");
  const relleno = nodo("div", "relleno", "");
  relleno.style.setProperty("--lleno", String(((ronda.ronda + 1) * 100) / ronda.total / 100));
  barra.append(relleno);
  raiz.append(barra);

  /* La palabra con un guion bajo en la letra que falta. */
  const celdas = nodo("div", "letras-mesa seccion", "");
  letrasConHueco(ronda.pregunta.palabra, ronda.pregunta.posicion).forEach((letra) => {
    const celda = nodo("span", `letra-celda${letra === "_" ? " hueco" : ""}`, letra);
    celdas.append(celda);
  });
  raiz.append(celdas);

  const marco = nodo("div", "flex justify-center gap-3 mt-2", "");
  ronda.pregunta.opciones.forEach((letra) => {
    const boton = nodo("button", "btn-letra", "");
    boton.type = "button";
    boton.setAttribute("aria-label", `Letra ${letra}`);
    if (ronda.respondida) {
      boton.disabled = true;
      boton.setAttribute("aria-disabled", "true");
      if (letra === ronda.pregunta.correcta) boton.classList.add("esta-correcta", "pulso-acierto");
      else if (letra === ronda.elegida) boton.classList.add("esta-incorrecta");
    } else {
      boton.addEventListener("click", () => responder(letra));
    }
    boton.append(document.createTextNode(letra));
    marco.append(boton);
  });
  raiz.append(marco);

  if (ronda.respondida) feedback();
}

function responder(letra: string): void {
  const esCorrecta = letra === ronda.pregunta.correcta;
  const ganados = sumarRespuesta(esCorrecta);
  reproducir(esCorrecta ? "correcto" : "error");
  ronda = {
    ...ronda,
    aciertos: ronda.aciertos + (esCorrecta ? 1 : 0),
    puntosActividad: ronda.puntosActividad + ganados,
    respondida: true,
    elegida: letra,
  };
  pintar();
}

function feedback(): void {
  const raiz = raizActual!;
  const esCorrecta = ronda.elegida === ronda.pregunta.correcta;
  raiz.append(nodoTextoColor(
    esCorrecta ? "¡Correcto! +10 puntos" : `¡Incorrecto! La letra era: ${ronda.pregunta.correcta}`,
    esCorrecta ? "var(--tema-correcto)" : "var(--tema-incorrecto)"));

  /* Pipo muestra la palabra completa. */
  const pipo = nodo("div", "pipo seccion", "");
  const foto = document.createElement("img");
  foto.className = "pipo-foto";
  foto.src = ruta("pinguino_128.png");
  foto.alt = "Pipo, el pingüino";
  pipo.append(foto, nodo("div", "burbuja", `La palabra completa es: ${ronda.pregunta.palabra}`));
  raiz.append(pipo);

  const pie = nodo("div", "flex justify-center seccion", "");
  const boton = nodo("button", "btn-pea", "");
  boton.type = "button";
  boton.setAttribute("aria-label", "Siguiente ronda");
  boton.innerHTML = "<i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i> Siguiente";
  boton.addEventListener("click", () => {
    reproducir("clic");
    siguiente();
  });
  pie.append(boton);
  raiz.append(pie);
}

function nodoTextoColor(texto: string, color: string): HTMLElement {
  const p = nodo("p", "font-semibold text-center seccion mb-0", texto);
  p.style.color = color;
  return p;
}

function siguiente(): void {
  if (ronda.ronda + 1 < ronda.total) {
    const nivel = leerNivel();
    ronda = {
      ...ronda,
      ronda: ronda.ronda + 1,
      respondida: false,
      elegida: null,
      pregunta: crearPregunta(nivel),
    };
    pintar();
    return;
  }
  completarActividad("completar");
  sumarBonificacion();
  reproducir("ganar");
  sessionStorage.setItem("pea.resultado", JSON.stringify({
    titulo: "¡Completar palabra terminado!",
    puntosActividad: ronda.puntosActividad,
    total: ronda.total,
    correctas: ronda.aciertos,
    actividad: "completar",
  }));
  navigate(ruta(`resultado/?actividad=completar`));
}

function iniciar(): void {
  if (document.body.dataset.pantalla !== "completar") return;
  const raiz = document.querySelector<HTMLElement>("[data-isla-completar]");
  if (!raiz) return;
  raizActual = raiz;
  const nivel = leerNivel();
  ronda = {
    ronda: 0,
    total: cantidadRondas(nivel, "completar"),
    aciertos: 0, puntosActividad: 0,
    respondida: false,
    pregunta: crearPregunta(nivel),
    elegida: null,
  };
  pintar();
}

iniciar();
document.addEventListener("astro:page-load", iniciar);
