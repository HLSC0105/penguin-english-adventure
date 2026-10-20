# 01 · La estructura espeja el paquete Python

```
web-astro/src/
├─ pages/        ← las RUTAS (10): una por pantalla + getStaticPaths
├─ components/   ← piezas puras reutilizables (HUD, PipoBurbuja…)
├─ layouts/      ← Layout.astro: el cascarón (como componentes.py)
├─ lib/          ← estado · juegos · sonidos · datos · confeti
├─ data/         ← JSON generados del Python EN BUILD
└─ assets/img/   ← OpenMoji 618px (optimizados a webp en build)
```

El paralelismo es a propósito (fin académico):

| Paquete Python | Astro |
|---|---|
| `datos/vocabulario.py` | `src/data/vocabulario.json` + `src/lib/datos.ts` |
| `juegos/*.py` | `src/lib/juegos.ts` |
| `utilidades/puntuacion.py` | `src/lib/estado.ts` |
| `interfaz/componentes.py` | `src/layouts/Layout.astro` + `src/components/` |
| `interfaz/*.py` (pantallas) | `src/pages/*.astro` + islands |
