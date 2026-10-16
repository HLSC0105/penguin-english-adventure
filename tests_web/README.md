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
| 11 | Documentación | 8 tarjetas de módulos con su espejo "Web →", tabla de equivalencias de 7 filas, 5 conceptos y 4 `<figure class="doc-captura">` con `<figcaption>` |
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
