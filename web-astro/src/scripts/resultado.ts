/* Island del resultado (espejo de mostrar_resultado): porcentaje →
   clave del mensaje de Pipo (100→perfecto, ≥60→felicitaciones, <60→
   ánimo) sorteado de MENSAJES_PIPO; líneas del resumen y confeti
   continuo hasta "Volver al menú". */
import { MENSAJES_PIPO } from "../lib/datos";
import { leerPuntos, leerNombre, leerTema } from "../lib/estado";
import { confeti } from "../lib/confeti";
import { RUTA_PIPO, ruta } from "../lib/rutas";

interface Resumen {
  titulo: string;
  puntosActividad: number;
  total: number;
  correctas: number;
  actividad: string;
}

function nodo(tag: string, clase: string, texto?: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function pintar(): void {
  const raiz = document.querySelector<HTMLElement>("[data-isla-resultado]");
  if (!raiz || raiz.dataset.hecho === "1") return;
  raiz.dataset.hecho = "1";
  raiz.replaceChildren();

  const bruto = sessionStorage.getItem("pea.resultado");
  if (!bruto) {
    /* Sin resumen (entrada directa): un fallback amable, como si el
       jugador recargara tras terminar. */
    raiz.append(
      nodo("h1", "titulo-pantalla text-center", "Actividad terminada"),
      pipo("Practicar más te ayudará a mejorar."),
      volver());
    return;
  }
  const resumen = JSON.parse(bruto) as Resumen;

  raiz.append(nodo("h1", "titulo-pantalla text-center", resumen.titulo));

  const porcentaje = resumen.total > 0
    ? Math.round((resumen.correctas * 100) / resumen.total) : 100;
  const clave = porcentaje === 100 ? "perfecto"
    : porcentaje >= 60 ? "felicitaciones" : "animo";
  const mensajes = MENSAJES_PIPO[clave] ?? ["¡Buen trabajo!"];
  raiz.append(pipo(mensajes[Math.floor(Math.random() * mensajes.length)]));

  const lienzo = document.createElement("canvas");
  lienzo.id = "confeti";
  lienzo.setAttribute("aria-hidden", "true");
  raiz.append(lienzo);

  const tarjeta = nodo("div", "pea-tarjeta seccion medida mx-auto py-1", "");
  const lineas = nodo("div", "flex flex-col items-center text-center px-3 py-2", "");
  lineas.style.rowGap = ".45rem";
  lineas.append(
    nodo("span", "linea", `Respuestas correctas: ${resumen.correctas} de ${resumen.total} (${porcentaje}%)`),
    nodo("span", "linea", `Puntos en la actividad: ${resumen.puntosActividad}`),
    nodo("span", "linea linea-acento",
      `Bonificación por terminar: +${raiz.dataset.constantesBonificacion} puntos`),
    nodo("span", "linea linea-acento", `Tus puntos totales: ${leerPuntos()}`),
  );
  tarjeta.append(lineas);
  raiz.append(tarjeta);

  raiz.append(volver());

  confeti(lienzo);
  sessionStorage.removeItem("pea.resultado");
}

function pipo(mensaje: string): HTMLElement {
  const caja = nodo("div", "pipo seccion", "");
  const foto = document.createElement("img");
  foto.className = "pipo-foto";
  foto.src = RUTA_PIPO;
  foto.alt = "Pipo, el pingüino";
  caja.append(foto, nodo("div", "burbuja", mensaje));
  return caja;
}

function volver(): HTMLElement {
  const caja = nodo("div", "flex justify-center seccion", "");
  const boton = nodo("button", "btn-pea", "");
  boton.type = "button";
  boton.innerHTML = "<i class=\"bi bi-arrow-left\" aria-hidden=\"true\"></i> Volver al menú";
  boton.addEventListener("click", () => {
    reproducirClic();
    location.href = ruta("menu/");
  });
  caja.append(boton);
  return caja;
}

/* import diferido del sonido: el click del botón Volver */
function reproducirClic(): void {
  import("../lib/sonidos").then(({ reproducir }) => reproducir("clic"));
}

pintar();
document.addEventListener("astro:page-load", pintar);
