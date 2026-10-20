# 07 · Las islands: la partida vive en la página

Patrón de cada juego (espejo 1:1 de las pantallas de escritorio):

1. `document.addEventListener("astro:page-load", iniciar)` + llamada
   directa (la carga dura puede llegar después del evento).
2. Estado en un objeto del closure (`partida`): índice, aciertos,
   respondida, elegida — responder RE-PIINTA el contenedor (el ciclo
   PSeInt desenrollado).
3. Puntos: `sumarRespuesta()` del estado; el HUD se sincroniza por el
   módulo global (chip "+N" con vuelo + latido del número).
4. Fin: la bonificación se suma ANTES de navegar a /resultado/ (si se
   sumara tras un repinte, se duplicaría — regla del escritorio).
5. Memoria además: `--i` para el reparto escalonado de cartas y mutación
   de clases en sitio (el lienzo de pygame no se destruye en cada volteo).
