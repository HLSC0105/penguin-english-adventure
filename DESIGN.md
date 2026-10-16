---
name: Penguin English Adventure
description: Juego de escritorio para aprender inglés con Pipo, noche polar y hielo.
colors:
  fondo-oscuro: "#000000"
  panel-oscuro: "#0D0D0D"
  tarjeta-oscuro: "#171717"
  texto-oscuro: "#F1F5F9"
  secundario-oscuro: "#94A3B8"
  boton-oscuro: "#1E3A8A"
  acento-oscuro: "#FBBF24"
  correcto-oscuro: "#22C55E"
  incorrecto-oscuro: "#F87171"
  foco-oscuro: "#FBBF24"
  fondo-claro: "#E8F1FA"
  panel-claro: "#FFFFFF"
  texto-claro: "#0F2744"
  boton-claro: "#1E5AB8"
  acento-claro: "#D97706"
  correcto-claro: "#15803D"
  foco-claro: "#1E5AB8"
typography:
  display:
    fontFamily: "DejaVu Sans, Segoe UI, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "DejaVu Sans, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  button:
    fontFamily: "DejaVu Sans, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.boton-oscuro}"
    textColor: "#FFFFFF"
    typography: "{typography.button}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "#1D4ED8"
    textColor: "#FFFFFF"
  header-bar:
    backgroundColor: "{colors.panel-oscuro}"
    textColor: "{colors.texto-oscuro}"
    padding: "8px 16px"
---

## Overview

Identidad polar: Pipo, hielo y noche. Modo Operate — el jugador termina actividades. El tema oscuro es el predeterminado: fondo negro profundo `#000000`, paneles y tarjetas un peldaño arriba. El momento autorial de motion es el volteo 2.5D de las cartas de memoria; el resto de transiciones es corto.

## Colors

Los diccionarios `TEMA_OSCURO` y `TEMA_CLARO` en `interfaz/componentes.py` son la fuente de verdad. El acento ámbar marca nivel CEFR y puntos. Verde/rojo semánticos para acierto y error. El anillo de foco usa `foco` (ámbar en oscuro, azul en claro).

## Typography

Una sola familia de sistema: Segoe UI en Windows, DejaVu Sans en el resto. Títulos 26 bold, cuerpo 13, botones 14 bold. No hay display face descargada: el proyecto debe correr offline en el aula.

## Layout

Ventana maximizada al abrir (1080p en un monitor Full HD), mínimo 1280×720. Ritmo de 8px. Encabezado compacto (jugador, puntos, aciertos, nivel). Actividades en grilla 2×N. El lienzo de memoria ocupa el centro; Pipo va arriba.

## Elevation & Depth

Tk no tiene `box-shadow`. Las tarjetas y botones usan un Frame offset (`sombra`) detrás del contenido. Capas: `fondo` < `panel` < `tarjeta`. Las cartas pygame redondean con `border_radius`.

**Web — sistema de elevación (`--elev-1/2/3` en `estilos.css`).** La web hereda
la paleta exacta de Tk (20 tokens verbatim) y agrega tokens *de profundidad*,
no de color:

- `--elev-1` **apoyada**: hairline `--anillo-tarjeta` + bevel superior (`--luces-canto`) + sombra corta. Inputs, celdas de letras, chips y opciones en reposo.
- `--elev-2` **elevada**: sombras largas y suaves + glow azul derivado de `--boton`. Es el estado base de fichas, Pipo, `pea-tarjeta` y cartas de memoria.
- `--elev-3` **flotante**: doble capa (glow + sombra difusa) que entra SOLO en hover/celebración junto con `translateY(-3/-4px)`. Nunca en estado base.

Reglas fijas: (1) sobre fondo `#000` las sombras negras no se ven — el
volumen oscuro se logra con glow azul `rgba(30,58,138,…)` + canto con luz
blanca de inset, no con una paleta nueva; (2) en claro las sombras son
tintas de `--texto` (`rgba(15,39,68,…)`); (3) el gradiente del suelo
(`--suelo`, azul profundo arriba, negro/hielo abajo) existe para que las
sombras tengan contra qué leerse; (4) la barra de progreso es el único
elemento hundido (inset), por contraste físico; (5) `prefers-reduced-motion`
congela el movimiento pero conserva la elevación estática.

## Shapes

Botones y tarjetas de vocabulario con sombra offset 4–5 px. Burbuja de Pipo con highlight 2px. El volteo usa rectángulos de ancho `|cos θ|`.

## Components

- **Encabezado:** panel + nivel CEFR + aviso "Sin sonido" si no hay mixer.
- **Botón primario:** hover, takefocus, anillo `foco`.
- **Pipo:** PNG local o círculo con P.
- **Lienzo memoria:** pygame off-screen → PhotoImage, fallback Canvas Tk.
- **Resultado:** confeti 2D + resumen tipográfico, no un bloque único.

## Do's and Don'ts

- Do: tokens de tema; no hex sueltos en pantallas nuevas.
- Do: filtro CEFR acumulativo; no esconder A1 cuando el jugador elige B1.
- Do: fondo oscuro negro profundo `#000000`; paneles y tarjetas más claros para que se lean.
- Don't: rediseñar a Pipo ni sustituir OpenMoji por emojis de sistema.
- Don't: bloquear `mainloop` con `time.sleep` en la UI real.
- Don't: tweens de más de ~120 ms en cambios de pantalla (se sienten lentos).
