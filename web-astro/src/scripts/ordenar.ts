/* Island de ordenar (espejo de mostrar_ordenar/entrada/feedback): el
   anagrama lo arma juegos.ts; la validación ignora mayúsculas y el
   envío vacío avisa en la burbuja de Pipo sin avanzar de ronda. */
import { navigate } from "astro:transitions/client";
import { crearPalabra, validarPalabra, cantidadRondas, type PalabraDesordenada } from "../lib/juegos";
import { sumarRespuesta, sumarBonificacion, completarActividad, leerNivel } from "../lib/estado";
import { reproducir } from "../lib/sonidos";
import { ruta } from "../lib/rutas";

interface EstadoRonda {
  ronda: number;
  total: number;
  aciertos: number;
  puntosActividad: number;
  respondida: boolean;
  palabra: PalabraDesordenada;
  ultimaCorrecta: boolean;
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

  /* Las letras desordenadas, separadas para que se lean fácil. */
  const celdas = nodo("div", "letras-mesa seccion", "");
  ronda.palabra.desordenada.split("").forEach((letra) => {
    celdas.append(nodo("span", "letra-celda", letra));
  });
  raiz.append(celdas);

  if (!ronda.respondida) entrada();
  else feedback();
}

function entrada(): void {
  const raiz = raizActual!;
  /* Pipo da la instrucción; su burbuja reutiliza para el aviso del envío vacío. */
  const pipo = nodo("div", "pipo seccion", "");
  const foto = document.createElement("img");
  foto.className = "pipo-foto";
  foto.src = ruta("pinguino_128.png");
  foto.alt = "Pipo, el pingüino";
  const burbuja = nodo("div", "burbuja",
    "Escribe la palabra correcta usando las letras desordenadas.");
  pipo.append(foto, burbuja);
  raiz.append(pipo);

  const form = nodo("form", "seccion flex flex-col items-center gap-3", "");
  (form as HTMLFormElement).noValidate = true;
  form.setAttribute("autocomplete", "off");

  const campo = nodo("input", "pea-input", "");
  campo.setAttribute("type", "text");
  campo.setAttribute("aria-label", "Palabra a ordenar");
  campo.setAttribute("autocomplete", "off");
  campo.setAttribute("spellcheck", "false");
  campo.style.width = "14rem";
  form.append(campo);

  const boton = nodo("button", "btn-pea", "");
  boton.type = "submit";
  boton.innerHTML = "<i class=\"bi bi-check2\" aria-hidden=\"true\"></i> Comprobar";
  form.append(boton);

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const intento = campo.value;
    if (intento.trim() === "") {
      burbuja.textContent = "Escribe una palabra antes de comprobar.";
      campo.focus();
      return;
    }
    const esCorrecta = validarPalabra(intento, ronda.palabra.original);
    sumarRespuesta(esCorrecta);
    reproducir(esCorrecta ? "correcto" : "error");
    ronda = {
      ...ronda,
      aciertos: ronda.aciertos + (esCorrecta ? 1 : 0),
      respondida: true,
      ultimaCorrecta: esCorrecta,
    };
    pintar();
  });

  raiz.append(form);
  campo.focus();
}

function feedback(): void {
  const raiz = raizActual!;
  raiz.append(nodoTextoColor(
    ronda.ultimaCorrecta ? "¡Correcto! +10 puntos" : "¡Incorrecto!",
    ronda.ultimaCorrecta ? "var(--tema-correcto)" : "var(--tema-incorrecto)"));

  /* Pipo muestra la palabra correcta. */
  const pipo = nodo("div", "pipo seccion", "");
  const foto = document.createElement("img");
  foto.className = "pipo-foto";
  foto.src = ruta("pinguino_128.png");
  foto.alt = "Pipo, el pingüino";
  pipo.append(foto, nodo("div", "burbuja", `La palabra correcta era: ${ronda.palabra.original}`));
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
      palabra: crearPalabra(nivel),
    };
    pintar();
    return;
  }
  completarActividad("ordenar");
  sumarBonificacion();
  reproducir("ganar");
  sessionStorage.setItem("pea.resultado", JSON.stringify({
    titulo: "¡Ordenar palabra terminado!",
    puntosActividad: ronda.puntosActividad,
    total: ronda.total,
    correctas: ronda.aciertos,
    actividad: "ordenar",
  }));
  navigate(ruta(`resultado/?actividad=ordenar`));
}

function iniciar(): void {
  if (document.body.dataset.pantalla !== "ordenar") return;
  const raiz = document.querySelector<HTMLElement>("[data-isla-ordenar]");
  if (!raiz) return;
  raizActual = raiz;
  const nivel = leerNivel();
  ronda = {
    ronda: 0,
    total: cantidadRondas(nivel, "ordenar"),
    aciertos: 0, puntosActividad: 0,
    respondida: false,
    palabra: crearPalabra(nivel),
    ultimaCorrecta: false,
  };
  pintar();
}

iniciar();
document.addEventListener("astro:page-load", iniciar);
