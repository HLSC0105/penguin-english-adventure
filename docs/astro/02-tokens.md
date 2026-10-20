# 02 · Los tokens: herencia, no rediseño

Los 20 tokens de color son COPIA VERBATIM de `TEMA_OSCURO/TEMA_CLARO`
(`src/penguin_english/interfaz/componentes.py`). La técnica de Tailwind v4:

1. Tokens **vivos por tema** en variables (`--tema-fondo`, `--tema-tarjeta`…)
   bajo `:root` (oscuro default) y `html[data-tema="claro"]`.
2. `@theme inline` los registra → nacen utilidades (`bg-tarjeta`,
   `text-texto-secundario`, `font-display`…). `inline` significa que las
   utilidades leen la variable EN RUNTIME: el botón de tema solo cambia
   el atributo y TODO el mundo repinta sin CSS duplicado.
3. Tokens de elevación (`--elev-1/2/3`, `--luces-canto`, `--anillo-tarjeta`):
   el mismo mundo premium de la ronda Impeccable (glow azul sobre el negro
   polar, bevel de luz en el canto).
