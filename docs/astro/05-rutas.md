# 05 · Rutas reales con View Transitions

Diez rutas (`src/pages/`): `/` inicio · `/menu/` · `/intro/[actividad]/`
(páginas estáticas pre-renderizadas) · `/vocabulario/` (?categoria=&pagina=)
· `/trivia/` · `/completar/` · `/ordenar/` · `/memoria/` ·
`/resultado/?actividad=X` · `/ayuda/` · `/como-esta-hecho/`.

- **ClientRouter** (`astro:transitions`) en el `<head>` del Layout.
- El vaivén entre páginas es NATIVO del navegador:
  `::view-transition-old(root)` sale (160ms, curva de cierre) y
  `::view-transition-new(root)` entra (260ms, curva polar de salida).
- La navegación interna usa `navigate()` de `astro:transitions/client`
  (sin recargar el documento) o `<a>` reales (historia del navegador
  correcta: refresh/back funcionan como en una web de archivos).
