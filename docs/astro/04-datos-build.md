# 04 · Los datos: Python en build, no fetch en runtime

`scripts/astro_exportar.py` emite `src/data/*.json` desde los módulos
reales del paquete (`datos/*.py`). Astro los importa en el FRONTMATTER
(build time):

- Las páginas pasan por Zod (`src/lib/datos.ts` valida el CONTRATO):
  si Python cambia la forma de una entrada, el BUILD falla — el error
  se ve en el pipeline, no en producción.
- El contenido queda INCRUSTADO en el HTML final: la página menú no
  hace fetch ni parsea JSON al cargar (la vanilla emitía 00-datos.js
  para runtime; Astro incrusta y además tipa).
- Mapeo de claves: Python entrega `memoria_parejas` y el exportador
  convierte a JS `memoriaParejas` (mismo puente que la vanilla).
