# 09 · Despliegue conmutable en GitHub Pages

**`scripts/desplegar.sh [astro|vanilla]`** — publica la versión elegida
en la rama huérfana `gh-pages` (la misma URL siempre):

- `astro`: `bun run build` en web-astro → sincroniza `dist/` a gh-pages.
- `vanilla`: sincroniza `web/` a gh-pages (la versión offline de pendrive).

El sitio servido: https://hlsc0105.github.io/penguin-english-adventure/
Si Pages está configurado con "Deploy from a branch → gh-pages", cada
push reconstruye solo. Los mensajes de commit indican qué versión y
cuándo desplegó (historia auditable del despliegue).
