# 00 · Instalación del proyecto Astro

**Por qué Astro:** la versión vanilla (`web/`) enseña cómo funciona una
web SIN herramientas; Astro es su evolución natural con rutas reales,
HTML pre-renderizado y JS enviado solo donde vive. El conmutador
`scripts/desplegar.sh` permite publicar cualquiera de las dos.

## Comandos (bun, con fallback npm)

```bash
cd web-astro
bun install          # o: npm install
bun run dev          # desarrollo (HMR) en http://localhost:4321
bun run build        # salida estática a dist/
bun run preview      # sirve dist/ para probarla
```

## Configuración clave (`astro.config.mjs`)

- `site: "https://hlsc0105.github.io"` y `base: "/penguin-english-adventure"`: 
  el sitio vive en la subcarpeta del repo en GitHub Pages.
- `vite.plugins: [tailwindcss()]` — Tailwind **v4** se conecta como plugin
  de Vite: no hay archivo de configuración de Tailwind ni postcss.

## Aprendido

- `create-astro` es cómodo, pero el scaffolding manual enseña qué es lo
  mínimo que Astro necesita: `package.json` + `astro.config.mjs` +
  `tsconfig.json` (hereda `astro/tsconfigs/strict`) + `src/pages/`.
