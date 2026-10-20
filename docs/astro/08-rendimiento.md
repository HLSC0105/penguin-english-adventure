# 08 · Rendimiento: lo que Astro ahorra

- **238 imágenes → webp**: `astro:assets.getImage` en frontmatter con
  caché por proceso (una sola optimización por build). Ejemplo real:
  8kB → 2kB por imagen (~70% menos).
- **Cero JS en las páginas estáticas**: menú, ayuda, intro, documentación
  y resultado no envían JS de juego (solo hud/tema/splash del Layout).
- **Hidratación aislada**: cada juego carga su lógica SOLO en su ruta.
- **Fuentes locales preloaded**: Fredoka vendida en public/vendor/.
- Objetivo: Lighthouse ≥95 en performance y accesibilidad.
