# Audit de escritorio (Impeccable, adaptado)

El audit web de Impeccable (ARIA, HTML, viewports móviles) no aplica 1:1 a Tkinter. Esta ficha traduce las cinco dimensiones al escritorio.

### Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3 | Tab/Enter, anillo de foco, contraste AA; no hay lector de pantalla nativo de Tk |
| 2 | Performance | 3 | `after()` a 30 fps en el lienzo; fundido corto; imágenes cacheadas por ventana |
| 3 | Responsive Design | 2 | Escritorio con `minsize`; no es una app móvil (fuera de alcance) |
| 4 | Theming | 4 | Tokens claros/oscuros alineados, incluido `foco` |
| 5 | Implementation Integrity | 4 | Pipo, polar, CEFR y OpenMoji coherentes; no es un skin genérico |
| **Total** | | **16/20** | **Good** |

### Implementation Integrity Verdict

**Pass.** El producto se reconoce como Penguin English Adventure: Pipo, hielo, actividades escolares, nivel CEFR visible. El lienzo pygame está acotado a memoria/resultados.

### Executive Summary

- Score: **16/20** (Good)
- P0: 0 · P1: 0 · P2: 2 · P3: 2
- El fundido de tema, `sonido_ganar` y el mixer en hilo principal quedaron corregidos en este ciclo.
- Siguiente: `/impeccable harden` si se añade persistencia o TTS (fuera de este alcance).

### Detailed Findings

- **[P2] Tk no expone roles ARIA** — Category: Accessibility — Impact: un lector de pantalla ve poco. Recommendation: mantener etiquetas visibles y orden de foco. Suggested: `/impeccable harden`
- **[P2] Lienzo pygame sin texto accesible** — las cartas son dibujo. Los tests usan proxies. Suggested: `/impeccable clarify`
- **[P3] after() huérfanos en tests** — Tcl `invalid command name "...paso"`. Ya hay `bgerror` silenciado. Suggested: `/impeccable optimize`
- **[P3] Python 3.14 y ruedas de pygame** — pygame-ce es el fallback documentado. Suggested: `/impeccable harden`

### Positive Findings

- Contraste de texto sobre paneles oscuros y claros por encima de 4.5:1 en tokens actuales.
- Botones con `pady=8` y `takefocus=1`.
- Indicador "Sin sonido" cuando el mixer no arranca.

### Recommended Actions

1. **[P2] `/impeccable harden`**: persistencia y TTS siguen en MEJORAS.
2. **[P3] `/impeccable polish`**: ya aplicado en este ciclo (temas, foco, resultado).
