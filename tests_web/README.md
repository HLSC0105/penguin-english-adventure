# Suite E2E de la web — Penguin English Adventure

Suite de Playwright que verifica **toda** la web (`web/index.html`, HTML+CSS+JS
vanilla sin build) **por `file://`, sin servidor y con la red externa
bloqueada** — el juego debe ser 100 % offline. Las pantallas espejan la app
Tkinter original; la suite verifica cada una y que **cada juego con puntos
se complete al 100 %** (trivia 10/10, completar 8/8, ordenar 8/8 y memoria
6/6 en A2, además de los detalles por nivel A1/B1).

## Cómo correr

```bash
cd tests_web
npm i        # instala playwright@1.64.1 (una sola vez)
npm test     # node suite.mjs — ~60 s en una notebook mediana
```

Los navegadores ya están provisionados en `~/.cache/ms-playwright`
(`chromium-1248`). Si en tu máquina no están:

```bash
npx playwright install chromium
```

La suite abre `file://` directamente en Chromium: no hace falta levantar
un servidor ni tocar nada de `web/`.

## Qué cubre (25 tests, ~420 asertos)

| # | Test | Verifica |
|---|------|----------|
| 01 | Splash natural | Pipo + título + barra + "Toca para saltar"; muere a los ~2.2 s y debajo ya está vivo el inicio |
| 02 | Splash saltado | un clic a ~700 ms dispara `carga-muriendo` y el velo sale en ≤1.4 s |
| 03 | Splash reducido | con `prefers-reduced-motion` el splash es breve (ver nota abajo) |
| 04-06 | Inicio / HUD | nombre vacío → "Escribe tu nombre para continuar."; chips A1/A2/B1; nombre válido → menú; HUD con Jugador/Puntos/Aciertos/Nivel |
| 07-09 | Menú | 5 fichas con los detalles del nivel, barra "0 de 5", y las acciones ¿Cómo jugar?, ¿Cómo está hecho? y Cerrar sesión |
| 10 | Ayuda | 3 bloques (Actividades, Puntos, Niveles CEFR) |
| 11 | Documentación extendida | cajón del repositorio GitHub (×2, arriba y al cierre), 8 secciones, 9 tarjetas de módulos con su espejo "Web →", árbol del proyecto (21 renglones), 2 tablas (7 equivalencias + 6 métricas), 18 tarjetas (6 conceptos + 6 decisiones + 6 pasos), 4 subgrupos y 9 `<figure class="doc-captura">` reales (`web/assets/capturas/`, cargan de verdad) con `<figcaption>` |
| 12-14 | Vocabulario | 20 categorías con conteo que suma 255 (A2); "Animales" paginado 4 por página hasta la última, con imagen/OpenMoji + inglés/español/nivel/ejemplo; "Volver al listado" SOLO en la última página; los puntos del HUD quedan intactos |
| 15-16 | Trivia completa | 10 preguntas respondidas con clics reales; feedback con `.esta-correcta` + `.pulso-acierto` y `.quieto` en las neutras; pantalla final con 4 líneas de resultado y confeti (`#confeti`); los Puntos del HUD suben |
| 17 | Completar completa | 8 rondas con `.letra-celda.hueco`, 3 letras por ronda y feedback con "La palabra completa es: …" |
| 18 | Ordenar completa | el envío VACÍO muestra "Escribe una palabra antes de comprobar." sin navegar; "XXXXX" ×8 → resultado 0 de 8 y Pipo con mensaje de ánimo |
| 19-20 | Memoria completa | tablero de 12 cartas leído del DOM; las 6 parejas se DERIVAN de los datos reales (carta con `.palabra-memo` = palabra; carta con `<img>` → su filename se mapea contra `PEA_DATOS.parejas`); volteo con clics reales; contador "Parejas encontradas: N de 6"; resultado "¡Juego de memoria terminado!" con aritmética exacta del HUD; el chip `+10` del HUD nace y se autodestruye (~950 ms) |
| 21 | Menú tras jugar | progreso "4 de 5" y check en las 4 fichas con puntos (el vocabulario, que es estudio, nunca se marca) |
| 22 | Niveles | B1 → 12 preguntas / 10 rondas / 8 parejas y 309 palabras; A1 → 8/6/4 y 149 palabras; el HUD acompaña cada cambio |
| 23 | Tema | claro/oscuro alterna `data-bs-theme` de `<html>` sin romper la pantalla actual |
| 24 | Cerrar sesión | vuelve al inicio con HUD oculto y la sesión ya no sobrevive una recarga |
| 25 | Audit global | 0 pedidos de red externa y 0 `pageerror`/`console.error` en toda la suite |

## Reglas de robustez (y por qué)

- **Muro de red externa**: `context.route` aborta cualquier pedido
  `http(s)/ws`; el test 25 exige que **no hubo ninguno que bloquear**. Si el
  juego pidiera algo externo, la suite lo reporta sin maquillaje.
- **0 errores de consola**: se recolectan `pageerror` + `console error` por
  página y **cada test falla si aparecen**. Única excepción documentada:
  si las imágenes de `assets/capturas/` estuvieran AUSENTES del repositorio
  (lo estaban cuando se escribió la suite), sus mensajes
  `Failed to load resource` se descuentan por conteo, apareados con los
  `requestfailed` del mismo recurso — un faltante de estáticos, no un
  problema del juego. Hoy esas capturas están en `HEAD` y cargan offline,
  así que la expectativa es cero mensajes en pantalla alguna.
- **Derivación del tablero de memoria**: los tableros son aleatorios por
  partida; la suite NUNCA hardcodea parejas: lee los 12 frentes del tablero
  vivo y arma las 6 parejas contra los datos reales. Después se juegan las
  parejas de a una, sin fallos, y el resultado queda determinista
  (6/6 al 100 % con mensaje de Pipo "perfecto").
- **Esperas espejo del juego**: la navegación tiene fase de salida (95 ms) +
  cascada (~400 ms); tras cada click/navegación se espera ~480-600 ms antes
  de asertar (`asentar()`). Con cada recarga el splash vuelve
  (`saltarSplash()`), y el estado vive en `sessionStorage`:
  `recargarLimpio()` devuelve el juego a su estado virgen.
- **Mensajes de Pipo**: varias burbujas eligen un mensaje al azar dentro de
  una clave (`PEA_DATOS.pipo[*]`). La suite valida la CLAVE ("ánimo",
  "perfecto") en vez de una frase fija — si el juego agregara más frases,
  la suite sigue pasando.
- **Recuperación entre tests**: si un test falla, el siguiente arranca con
  el estado re-armado (sessionStorage limpio → menú), para que el reporte
  gara la causa raíz y no una cascada de locator-timeouts.

## Salida

En consola: un ✔/✘ por test con su tiempo, y al final el resumen:

```
Tests: 25 · Passed: 25 · Failed: 0 · Asertos: 417 · Tiempo: 62545 ms
```

En `tests_web/artefactos/` quedan pantallazos fullPage de cada test que
falló (el nombre del archivo es el del test). El directorio es solo
diagnóstico y está ignorado por git.

## Nota medida sobre reduced-motion

El pedido decía que con `prefers-reduced-motion: reduce` el splash dura
"≤1 s". Según el propio código del juego, con movimiento reducido la
secuencia es de 700 ms y luego hay 340 ms de desvanecimiento
(`DURACION_REDUCIDO` + `carga-muriendo`): un ciclo completo de ~1.04 s.
El test exige entonces: empieza a morir pronto (≤1.1 s desde el primer
avistamiento), desvanecimiento ≤0.6 s y ciclo completo desde la recarga
≤1.8 s — mantiene la intención "breve" sin exigir un margen imposible.

---

# Suite E2E de la versión ASTRO (`suite-astro.mjs` + `helpers-astro.mjs`)

Suite espejo de la vanilla, pero contra la web `web-astro/` (Astro 7 +
Tailwind v4): **rutas reales** navegadas con View Transitions en lugar
de pantallas de una SPA por `file://`. Misma mecánica de aserciones
(`assert`/`assertEq` propios, sin librería externa), mismo runner
(un ✔/✘ por test + audit de consola por test + capturas de fallos).

## Cómo correr

```bash
# 1) construir y servir el sitio (sirve dist/ con la base de Pages):
cd web-astro && bun run build && bun run preview
#    → http://localhost:4321/penguin-english-adventure/

# 2) correr la suite (otra terminal):
cd tests_web && node suite-astro.mjs
#    Tests: 25 · Passed: 25 · Failed: 0 · Asertos: 476 · Tiempo: ~74 s
```

La base se pasa por **`ASTRO_BASE`** (default
`http://127.0.0.1:4321/penguin-english-adventure/`) y la misma suite
sirve para verificar un despliegue:

```bash
ASTRO_BASE=https://hlsc0105.github.io/penguin-english-adventure/ node suite-astro.mjs
```

Como el sitio vive en HTTP, el "muro de red" es consciente del origen:
todo pedido al ORIGEN de la base pasa (es el sitio bajo prueba) y
cualquier `http(s)` a OTRO origen se aborta y queda registrado — el
test 25 exige cero (el juego debe ser autosuficiente). Los datos de
derivación (parejas de memoria, conteos por nivel, mensajes de Pipo)
se leen del repo: `web-astro/src/data/*.json`.

## Qué cubre (25 tests, ~476 asertos)

| # | Test | Verifica |
|---|------|----------|
| 01 | Splash en carga dura | el velo monta con Pipo + título + barra + "Toca para saltar", muere a los ~2.2 s (+340 ms de fade) y debajo ya está vivo el inicio |
| 02 | Splash saltado | clic a ~700 ms (saltable desde 500) → `carga-muriendo` y fuera en ≤1.4 s |
| 03 | Splash reducido + View Transitions | con `prefers-reduced-motion` el velo NO se monta (diseño Astro); y con motion normal, la navegación interna (login → menú → documentación) NO lo repite — verificado con un MutationObserver instalado antes de la recarga |
| 04-06 | Inicio / HUD | nombre vacío → "Escribe tu nombre para continuar." y sin navegar; 3 chips con A2 por defecto; nombre válido → `/menu/` con HUD Jugador/Puntos/Aciertos/Nivel |
| 07-09 | Menú | 5 fichas con detalles por nivel (A1: 149 palabras/8 preguntas/6/6/4 parejas; A2: 255/10/8/8/6; B1: 309/12/10/10/8), progreso "X de 5 (Y%)" y las tres acciones del pie |
| 10 | Ayuda | 3 bloques (Actividades, Puntos, Niveles CEFR) — y verifica el src del Pipo normalizado (bug #1 corregido) |
| 11 | Documentación | 2 cajones del repo, 9 secciones (con "La versión Astro"), 9 módulos con espejo, árbol (21 renglones), 2 tablas (7+6 filas), 24 tarjetas, 4 subgrupos y 9 capturas |
| 12-14 | Vocabulario | 20 categorías con conteo que suma 255 (A2); "Animales" 4 por página con clics reales (pushState) hasta la última, "Volver al listado" SOLO al final; deep-link `?categoria=Animales&pagina=2` repinta igual; los puntos del HUD intactos |
| 15-16 | Trivia completa | 10 preguntas con clics reales; feedback `.esta-correcta`/`.pulso-acierto`/`.quieto`; resultado con 4 líneas y confeti; HUD subió; menú "1 de 5 (20%)" con check |
| 17 | Completar completa | 8 rondas con `.letra-celda.hueco`, 3 letras y "La palabra completa es: …" |
| 18 | Ordenar completa | envío VACÍO avisa sin navegar; "XXXXX" ×8 → 0 de 8 y Pipo con la clave 'animo' (contra `data/pipo.json`) |
| 19-20 | Memoria completa | tablero de 12 DERIVADO del tablero vivo: `.palabra-memo` = palabra; `<img>` → su src se mapea con el mapa `data-imagenes` (invertido) contra `data/parejas.json`; clics reales, contador exacto, resultado con aritmética exacta del HUD (+60+20) y Pipo 'perfecto' |
| 21 | Menú tras jugar | progreso "4 de 5 (80%)" y checks en las 4 fichas con puntos |
| 22 | Niveles | chips repintan fichas por la MISMA ruta; B1 → 309/12/10/10/8; A1 → 149/8/6/6/4; HUD acompaña |
| 23 | Tema | alterna `data-tema` de `<html>` (la vanilla usa `data-bs-theme`) sin romper la pantalla; el HUD repinta su etiqueta |
| 24 | Cerrar sesión | vuelve a `/` con HUD oculto y sin splash; la sesión no sobrevive la recarga |
| 25 | Audit global | 0 pedidos a otro origen y 0 `pageerror`/`console.error` en toda la suite |

## Reglas de robustez (espejadas de la vanilla + las de Astro)

- **~850 ms tras cada navegación**: las islands se inicializan en
  `astro:page-load` (y también con llamada directa al montar el
  módulo): tras cada navegación con View Transition se espera antes de
  asertar. Entre rondas de un MISMO juego (repinte in-place, sin
  navegación) el margen es menor (~220-350 ms).
- **Tablero de memoria estable**: la island de memoria re-crea su
  tablero en cada `astro:page-load`; el lector hace DOBLE lectura
  idéntica antes de derivar parejas (nunca índices fijos).
- **Menú listo = HUD + 5 fichas**: el nivel del HUD lo pinta el sync
  del Layout y las fichas la island del menú, en el mismo
  `astro:page-load`; esperar ambos evita asertar un repinte a medias.
- **"Volver al menú" del RESULTADO es carga dura** (`location.href`):
  el splash vuelve ahí y hay que saltarlo — es el único camino interno
  que re-monta el velo (coherente con "splash SOLO en carga dura").
- **Recarga = ruta actual**: a diferencia de la vanilla (SPA, todo
  vuelve al inicio), recargar cae en la MISMA ruta; los tests que
  necesitan el inicio usan `irAlInicio()` (goto real + splash).
- **HUD de puntos sin el chip**: el chip "+N" vive ~950 ms DENTRO del
  valor de "Puntos:"; la lectura toma solo el primer nodo de texto.
  Nota de producto: el HUD repinta SOLO en navegación — durante una
  partida los puntos del HUD no suben en vivo (el chip nace al llegar
  al resultado).

## Bugs reales documentados por la suite (NO parcheados)

1. **El Pipo de `/ayuda/` sale roto (404)**. Repro: abrir
   `/penguin-english-adventure/ayuda/` (preview o Pages) — la imagen de
   Pipo no carga y la consola registra
   `Failed to load resource ... /penguin-english-adventurepinguino_128.png`.
   Causa: el script inline de `src/pages/ayuda.astro` construye el src
   con `new URL(import.meta.env.BASE_URL, location.href)` + concatena
   `"pinguino_128.png"` SIN normalizar el slash final (en el build
   `BASE_URL` viaja sin slash). El resto del sitio usa
   `ruta()` de `src/lib/rutas.ts`, que normaliza. La suite lo verifica
   tal cual está (test 10, con su rastro de consola consumido y
   documentado); si se corrige, ese aserto avisará de actualizarlo.

2. **(Corregido durante la escritura de la suite)** Los clics de
   vocabulario (categoría, "Siguiente ▶", "◀ Anterior", "Volver al
   listado") lanzaban `ReferenceError: ruta is not defined` y no
   navegaban — a `src/scripts/vocabulario.ts` le faltaba importar
   `ruta`. Quedó arreglado por el commit `76af4f3` (pushState +
   popstate); el test 13 hoy verifica la conducta buena con clics
   reales y deep-links.
