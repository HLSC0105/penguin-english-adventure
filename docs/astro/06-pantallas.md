# 06 · Las pantallas, una por una

Cada página: `Layout` (hud) + cascarón estático + island.

- **inicio**: form con input + chips de nivel; error si el nombre queda vacío.
- **menu**: progreso (de la sesión) + 5 fichas con detalles del nivel actual
  + pie con las tres acciones.
- **intro/[actividad]**: la explicación de Pipo + Empezar/Volver.
- **vocabulario**: categorías con conteo o fichas paginadas 4×página.
- **trivia / completar / ordenar**: el juego completo con feedback
  (`.esta-correcta` con pulso+destello, neutras en `.quieto`).
- **memoria**: tablero al azar del nivel; volteo en sitio; `setTimeout`
  para reponer las no-pareja (esperaFlipMs del nivel).
- **resultado**: mensaje de Pipo por umbral + confeti continuo.
- **ayuda / como-esta-hecho**: manuales estáticos (0 JS de juego).
