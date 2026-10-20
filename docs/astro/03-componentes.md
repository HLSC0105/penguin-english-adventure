# 03 · El design system (componentes .astro)

- **`HUD.astro`** — el pill persistente (jugador/puntos/aciertos/nivel +
  volumen + tema + Menú). En el Layout lleva `transition:persist="hud"`:
  el navegador conserva el NODO entre rutas (el slider no parpadea).
- **`PipoBurbuja.astro`** — imagen + burbuja con cola (::before/::after)
  y la respiración en ámbar (`respirar-burbuja`).
- **`BarraProgreso.astro`** — hundida, con relleno luminoso, barrido y
  `--lleno` fracción para las islands.
- **`FichaActividad.astro`** — la tarjeta clicable del menú con check
  (pop-check) y detalle por nivel.

Ninguno declara `script`: el comportamiento lo añade la island de la
página — así el HTML de las páginas estáticas NO carga JS de juego.
