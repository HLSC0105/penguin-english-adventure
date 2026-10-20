/* Island del vocabulario (espejo de vocabulario.py): estudio, no examen.
   Categorías con conteo o fichas de palabra paginadas 4×página; la
   navegación interna es pushState + popstate (la island repinta sin
   recargar — el navigate() del router descarta la query) y la URL
   queda coherente: refresh/back del navegador re-pintan igual. */
import { navigate } from "astro:transitions/client";
import { categoriasDelNivel, CONSTANTES, type Palabra } from "../lib/datos";
import { leerNivel, establecerNivel } from "../lib/estado";
import { nivelValido, type Nivel } from "../lib/datos";
import { reproducir } from "../lib/sonidos";
import { ruta } from "../lib/rutas";

let imagenes: Record<string, string> = {};

function circuloInicial(palabra: Palabra): HTMLElement {
  const envoltura = document.createElement("span");
  envoltura.style.cssText =
    "width:84px;height:84px;border-radius:50%;background:var(--tema-boton);color:#FFF;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:2rem;";
  envoltura.textContent = palabra.ingles.charAt(0).toUpperCase();
  return envoltura;
}

function fichaPalabra(palabra: Palabra): HTMLElement {
  const ficha = document.createElement("div");
  ficha.className = "pea-tarjeta ficha-palabra";

  if (palabra.imagen) {
    const img = document.createElement("img");
    img.src = imagenes[palabra.imagen] ?? "";
    img.alt = "";
    img.loading = "lazy";
    img.addEventListener("error", () => {
      img.replaceWith(circuloInicial(palabra));
    });
    ficha.append(img);
  } else {
    ficha.append(circuloInicial(palabra));
  }

  ficha.append(
    nodo("div", "palabra-ingles", palabra.ingles),
    nodo("div", "palabra-espanol", palabra.espanol),
    nodo("span", "pea-mini", palabra.nivel),
    nodo("div", "palabra-ejemplo", `“${palabra.ejemplo}”`),
  );
  return ficha;
}

function nodo(tag: string, clase: string, texto: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = clase;
  el.textContent = texto;
  return el;
}

function navegarVocabulario(parte: string): void {
  /* pushState + repintar: la island manda su propia URL (query completa)
     sin salir del documento; popstate re-pinta en back/forward. */
  history.pushState({}, "", ruta(parte));
  pintarSegunUrl();
}

function pintarCategorias(raiz: HTMLElement): void {
  const nivel = leerNivel();
  const categorias = categoriasDelNivel(nivel);
  const gripa = nodo("div", "seccion", "");
  const fila = nodo("div", "grid gap-3 mx-auto", "");
  fila.style.gridTemplateColumns = "repeat(auto-fill,minmax(min(100%,300px),1fr))";
  fila.style.maxWidth = "640px";

  for (const [nombre, palabras] of Object.entries(categorias)) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn-categoria";
    boton.setAttribute("aria-label", `Categoría ${nombre} con ${palabras.length} palabras`);
    boton.append(
      document.createTextNode(nombre),
      nodo("span", "conteo fuente-num", `(${palabras.length})`),
    );
    boton.addEventListener("click", () => {
      reproducir("clic");
      navegarVocabulario(`vocabulario/?categoria=${encodeURIComponent(nombre)}`);
    });
    fila.append(boton);
  }
  gripa.append(fila);
  raiz.append(gripa);
}

function pintarPalabras(raiz: HTMLElement, categoria: string, paginaParam: string): void {
  const nivel = leerNivel();
  const palabras = categoriasDelNivel(nivel)[categoria] ?? [];
  const porPagina = CONSTANTES.palabrasPorPagina;
  const totalPaginas = Math.max(1, Math.ceil(palabras.length / porPagina));
  let pagina = Math.min(Math.max(0, Number(paginaParam) - 1), totalPaginas - 1);

  const bloque = nodo("div", "seccion", "");
  bloque.append(nodo("p", "texto-acento-texto font-semibold text-center mb-2", `Categoría: ${categoria}`));

  /* navegación centrada: ◀ Anterior | Página N de M | Siguiente ▶ */
  const nav = nodo("div", "flex items-center justify-center gap-3 mb-3", "");
  if (pagina > 0) {
    const anterior = nodo("button", "btn-pea-ghost", "◀ Anterior");
    anterior.type = "button";
    anterior.setAttribute("aria-label", "Página anterior");
    anterior.addEventListener("click", () => {
      reproducir("clic");
      navegarVocabulario(`vocabulario/?categoria=${encodeURIComponent(categoria)}&pagina=${pagina}`);
    });
    nav.append(anterior);
  }
  nav.append(nodo("span", "texto-secundario fuente-num", `Página ${pagina + 1} de ${totalPaginas}`));
  if (pagina < totalPaginas - 1) {
    const siguiente = nodo("button", "btn-pea-ghost", "Siguiente ▶");
    siguiente.type = "button";
    siguiente.setAttribute("aria-label", "Página siguiente");
    siguiente.addEventListener("click", () => {
      reproducir("clic");
      navegarVocabulario(`vocabulario/?categoria=${encodeURIComponent(categoria)}&pagina=${pagina + 2}`);
    });
    nav.append(siguiente);
  }
  bloque.append(nav);

  const filasTarjetas = nodo("div", "grid gap-3 mx-auto", "");
  filasTarjetas.style.gridTemplateColumns = "repeat(auto-fit,minmax(min(100%,320px),1fr))";
  filasTarjetas.style.maxWidth = "760px";
  palabras.slice(pagina * porPagina, pagina * porPagina + porPagina).forEach((palabra) => {
    filasTarjetas.append(fichaPalabra(palabra));
  });
  bloque.append(filasTarjetas);

  if (pagina >= totalPaginas - 1) {
    const volver = nodo("button", "btn-pea-ghost", "Volver al listado");
    volver.type = "button";
    volver.setAttribute("aria-label", "Volver al listado de categorías");
    volver.addEventListener("click", () => {
      reproducir("clic");
      navegarVocabulario("vocabulario/");
    });
    const caja = nodo("div", "flex justify-center mt-3", "");
    caja.append(volver);
    bloque.append(caja);
  }

  raiz.append(bloque);
}

function iniciar(): void {
  if (document.body.dataset.pantalla !== "vocabulario") return;
  const raiz = document.querySelector<HTMLElement>("[data-isla-vocabulario]");
  if (!raiz) return;
  raiz.replaceChildren();   /* cada page-load repinta desde cero */

  const url = new URL(location.href);
  imagenes = JSON.parse(raiz.dataset.imagenes ?? "{}");

  /* nivel por URL si el jugador cambió en otra pantalla */
  const nivelUrl = url.searchParams.get("nivel");
  if (nivelUrl && nivelValido(nivelUrl)) establecerNivel(nivelUrl as Nivel);

  const categoria = url.searchParams.get("categoria");
  const pagina = url.searchParams.get("pagina") ?? "1";
  if (categoria) pintarPalabras(raiz, categoria, pagina);
  else pintarCategorias(raiz);
}

function pintarSegunUrl(): void {
  /* la lógica de iniciar sin los registros: repintar la isla según URL */
  const raiz = document.querySelector<HTMLElement>("[data-isla-vocabulario]");
  if (!raiz) return;
  raiz.replaceChildren();
  const url = new URL(location.href);
  const nivelUrl = url.searchParams.get("nivel");
  if (nivelUrl && nivelValido(nivelUrl)) establecerNivel(nivelUrl as Nivel);
  const categoria = url.searchParams.get("categoria");
  const pagina = url.searchParams.get("pagina") ?? "1";
  if (categoria) pintarPalabras(raiz, categoria, pagina);
  else pintarCategorias(raiz);
}

window.addEventListener("popstate", pintarSegunUrl);

iniciar();
document.addEventListener("astro:page-load", iniciar);
