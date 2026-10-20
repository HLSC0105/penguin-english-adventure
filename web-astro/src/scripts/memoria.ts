/* Island de memoria (espejo de mostrar_memoria/voltear_tarjeta/
   dar_vuelta_tarjetas/terminar_memoria): el estado viaja en un objeto
   vivo (como ventana._memoria_estado); las guardias del volteo son las
   mismas: nada si esperando o 2 volteadas; una carta visible no se
   vuelve a tocar. La cara frontal entra por el mapa de imágenes
   optimizadas del build. */
import { navigate } from "astro:transitions/client";
import { crearTablero, sonPareja, cantidadParejas, esperaFlipMs, type Tarjeta } from "../lib/juegos";
import { sumarRespuesta, sumarBonificacion, completarActividad, leerNivel } from "../lib/estado";
import { reproducir } from "../lib/sonidos";
import { ruta } from "../lib/rutas";

interface EstadoPartida {
  tablero: Tarjeta[];
  parejas: number;
  volteadas: number[];
  intentos: number;
  esperando: boolean;
  nivel: Parameters<typeof crearTablero>[0];
}

let partida: EstadoPartida;
let raizActual: HTMLElement | null = null;
let cartas: HTMLButtonElement[] = [];
let etiquetaActual: HTMLElement | null = null;
let burbujaActual: HTMLElement | null = null;
let mapaimagenes: Record<string, string> = {};

function mensajePipo(): string {
  if (partida.esperando) {
    return "¡Casi! Esas dos tarjetas no eran pareja. Sigue intentando.";
  }
  if (partida.volteadas.length === 1) {
    return "Ahora encuentra la tarjeta que hace pareja con esa.";
  }
  return "Voltea dos tarjetas: una palabra y su imagen forman una pareja.";
}

function refrescarTextos(): void {
  if (etiquetaActual) {
    etiquetaActual.textContent =
      `Parejas encontradas: ${partida.parejas} de ${cantidadParejas(partida.nivel)}`;
  }
  if (burbujaActual) burbujaActual.textContent = mensajePipo();
}

function pintarTablero(raiz: HTMLElement): void {
  const tableroEl = document.createElement("div");
  tableroEl.className = "memo-tablero seccion";
  cartas = [];
  partida.tablero.forEach((info, indice) => {
    const carta = crearCarta(info, indice);
    if (info.visible) {
      carta.classList.add("volteada");
      carta.disabled = true;
      carta.querySelector(".cara-frente")?.removeAttribute("aria-hidden");
      etiquetaCarta(carta, info);
    }
    cartas.push(carta);
    tableroEl.append(carta);
  });
  raiz.append(tableroEl);
}

function crearCarta(info: Tarjeta, indice: number): HTMLButtonElement {
  const carta = document.createElement("button");
  carta.type = "button";
  carta.className = "memoria-carta";
  carta.style.setProperty("--i", String(indice));
  carta.setAttribute("aria-label", `Carta ${indice + 1}, sin voltear`);

  const envuelta = document.createElement("div");
  envuelta.className = "cara-envuelta";

  const trasera = document.createElement("div");
  trasera.className = "cara cara-trasera";
  trasera.setAttribute("aria-hidden", "true");
  const marca = document.createElement("span");
  marca.className = "marca-trasera";
  marca.textContent = "?";
  trasera.append(marca);

  const frente = document.createElement("div");
  frente.className = "cara cara-frente";
  frente.setAttribute("aria-hidden", "true");
  if (info.tipo === "imagen" && info.imagen) {
    /* alt vacío: revelar el texto del alt delataría la pareja. */
    const img = document.createElement("img");
    img.className = "imagen-memo";
    img.src = mapaimagenes[info.imagen] ?? "";
    img.alt = "";
    img.loading = "lazy";
    frente.append(img);
  } else {
    const texto = document.createElement("span");
    texto.className = "palabra-memo";
    texto.textContent = info.texto ?? "";
    frente.append(texto);
  }

  envuelta.append(trasera, frente);
  carta.append(envuelta);
  carta.addEventListener("click", () => voltea(indice));
  return carta;
}

/* Para un lector de pantalla la carta voltea a "la imagen" o a la
   palabra — nunca adelanta el contenido de las tapadas. */
function etiquetaCarta(carta: HTMLButtonElement, tarjeta: Tarjeta): void {
  if (tarjeta.tipo === "imagen") {
    carta.setAttribute("aria-label", "Carta con una imagen de la pareja");
  } else {
    carta.setAttribute("aria-label", `Carta con la palabra: ${tarjeta.texto ?? ""}`);
  }
}

function voltea(indice: number): void {
  if (partida.esperando || partida.volteadas.length >= 2) return;
  const tarjeta = partida.tablero[indice];
  if (tarjeta.visible) return;

  tarjeta.visible = true;
  partida.volteadas.push(indice);
  const carta = cartas[indice];
  carta.classList.add("volteada");
  carta.disabled = true;
  etiquetaCarta(carta, tarjeta);
  carta.querySelector(".cara-frente")?.removeAttribute("aria-hidden");

  if (partida.volteadas.length === 2) evaluarParejas();
  else refrescarTextos();
}

function evaluarParejas(): void {
  partida.intentos += 1;
  const primera = partida.tablero[partida.volteadas[0]];
  const segunda = partida.tablero[partida.volteadas[1]];
  const esPareja = sonPareja(primera, segunda);

  if (esPareja) {
    sumarRespuesta(true);
    reproducir("correcto");
    partida.parejas += 1;
    [primera, segunda].forEach((tarjeta) => {
      const carta = cartas[partida.tablero.indexOf(tarjeta)];
      carta.classList.add("resuelta", "destello-pareja");
      carta.setAttribute("aria-label", "Pareja encontrada");
    });
    partida.volteadas = [];
    refrescarTextos();
    if (partida.parejas === cantidadParejas(partida.nivel)) {
      window.setTimeout(terminar, 420);
    }
    return;
  }

  sumarRespuesta(false);
  reproducir("error");
  partida.esperando = true;
  refrescarTextos();
  const pendientes = partida.volteadas.slice();
  partida.volteadas = [];
  window.setTimeout(() => reponer(pendientes), esperaFlipMs(partida.nivel));
}

function reponer(pendientes: number[]): void {
  pendientes.forEach((indice) => {
    partida.tablero[indice].visible = false;
    const carta = cartas[indice];
    if (carta.classList.contains("resuelta")) return;
    carta.classList.remove("volteada");
    carta.disabled = false;
    carta.querySelector(".cara-frente")?.setAttribute("aria-hidden", "true");
    carta.setAttribute("aria-label", `Carta ${indice + 1}, sin voltear`);
  });
  partida.esperando = false;
  refrescarTextos();
}

function terminar(): void {
  completarActividad("memoria");
  sumarBonificacion();
  reproducir("ganar");
  /* Paridad de Tk: el "respuestas" del resultado son los intentos. */
  sessionStorage.setItem("pea.resultado", JSON.stringify({
    titulo: "¡Juego de memoria terminado!",
    puntosActividad: partida.intentos,
    total: partida.intentos,
    correctas: partida.parejas,
    actividad: "memoria",
  }));
  navigate(ruta(`resultado/?actividad=memoria`));
}

function iniciar(): void {
  console.log("[pea-memoria] iniciar, pantalla=", document.body.dataset.pantalla, "isla=", !!document.querySelector("[data-isla-memoria]"));
  if (document.body.dataset.pantalla !== "memoria") return;
  const raiz = document.querySelector<HTMLElement>("[data-isla-memoria]");
  if (!raiz) return;
  raizActual = raiz;
  raiz.replaceChildren();

  const nivel = leerNivel();
  partida = {
    nivel,
    tablero: crearTablero(nivel),
    parejas: 0, volteadas: [], intentos: 0, esperando: false,
  };
  mapaimagenes = JSON.parse(raiz.dataset.imagenes ?? "{}");

  const etiqueta = document.createElement("p");
  etiqueta.className = "texto-secundario fuente-num text-center mb-1";
  etiquetaActual = etiqueta;
  raiz.append(etiqueta);

  const pipo = document.createElement("div");
  pipo.className = "pipo seccion";
  const foto = document.createElement("img");
  foto.className = "pipo-foto";
  foto.src = ruta("pinguino_128.png");
  foto.alt = "Pipo, el pingüino";
  const burbuja = document.createElement("div");
  burbuja.className = "burbuja";
  burbujaActual = burbuja;
  pipo.append(foto, burbuja);
  raiz.append(pipo);

  pintarTablero(raiz);
  refrescarTextos();
}

iniciar();
document.addEventListener("astro:page-load", iniciar);
