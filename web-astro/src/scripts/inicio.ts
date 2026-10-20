/* Island de la pantalla de inicio (espejo de la lógica de inicio.py):
   strip del nombre, error si queda vacío, chips de nivel con estado
   activo, Enter ≡ botón (submit del form) y navegación por ruta. */
import { navigate } from "astro:transitions/client";
import { type Nivel } from "../lib/datos";
import { establecerNombre, establecerNivel, leerNivel } from "../lib/estado";
import { ruta } from "../lib/rutas";
import { reproducir } from "../lib/sonidos";

function iniciar(): void {
  if (document.body.dataset.pantalla !== "inicio") return;
  const form = document.querySelector<HTMLFormElement>("#form-inicio");
  if (!form || form.dataset.iniciado === "1") return;
  form.dataset.iniciado = "1";

  const entrada = form.querySelector<HTMLInputElement>("input[type='text']")!;
  const error = form.querySelector<HTMLElement>("[data-error]")!;
  let eleccion: Nivel = leerNivel();

  function pintarNiveles(): void {
    form.querySelectorAll<HTMLButtonElement>(".pea-chip").forEach((chip) => {
      const activa = chip.dataset.nivel === eleccion;
      chip.classList.toggle("activa", activa);
      chip.setAttribute("aria-pressed", String(activa));
    });
  }
  form.querySelectorAll<HTMLButtonElement>(".pea-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      eleccion = chip.dataset.nivel as Nivel;
      establecerNivel(eleccion);
      pintarNiveles();
      reproducir("clic");
    });
  });
  pintarNiveles();

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const nombre = entrada.value.trim();
    if (nombre === "") {
      error.textContent = "Escribe tu nombre para continuar.";
      entrada.focus();
      return;
    }
    error.textContent = "";
    establecerNombre(nombre);
    establecerNivel(eleccion);
    reproducir("clic");
    navigate(ruta("menu/"));
  });
}

iniciar();
document.addEventListener("astro:page-load", iniciar);
