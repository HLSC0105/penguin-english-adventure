# Product

<!-- impeccable:product-schema 1 -->

## Platform

desktop

<!-- Inferido del código y del plan: no es web ni iOS/Android. Es una
aplicación de escritorio con Tkinter. El esquema Impeccable no tiene
un valor `desktop`; se registra así como verdad de producto. -->

## Stack

Python 3.10+ · Tkinter/ttk (interfaz) · pygame (audio y lienzo 2.5D en memoria/resultados) · unittest · PSeInt como puente académico.

## Users

- **Jugador:** estudiante de inglés de secundaria o universidad inicial (CEFR A1–B1) que practica vocabulario sin internet.
- **Autor/defensor:** estudiante de programación que demuestra el puente PSeInt → Python → Tkinter en una defensa oral.

## Product Purpose

Enseñar vocabulario de inglés con cinco actividades guiadas por Pipo (un pingüino), con puntos, temas claro/oscuro y un nivel CEFR elegido por el jugador. El éxito es que el jugador complete las actividades en su nivel y que el código se pueda explicar en clase.

## Positioning

No es un curso ni un traductor: es un **juego de escritorio offline** donde Pipo acompaña cada actividad y el nivel CEFR cambia el banco y la dureza (rondas, parejas, huecos), no solo una etiqueta cosmética.

## Operating Context

Se ejecuta en Windows, Linux y macOS con `python -m penguin_english` o `penguin-english`. Todo el contenido vive en el repositorio (`recursos/`, `src/penguin_english/datos/`). Las pruebas de interfaz necesitan un display (Xvfb en CI). No hay servidor ni cuenta de usuario.

## Capabilities and Constraints

- Cinco actividades: vocabulario, trivia, completar, ordenar, memoria.
- Selector CEFR A1 / A2 / B1 (filtro acumulativo; A2 por defecto).
- Progreso y puntos **solo en memoria** (se pierden al cerrar). <!-- confirmado por el código actual; persistencia queda fuera de alcance -->
- Offline: OpenMoji local, WAV locales, pygame.mixer.
- Una dependencia externa: pygame.
- Sin rediseñar a Pipo ni el nombre del producto.

## Brand Commitments

- Nombre: **Penguin English Adventure**.
- Guía: **Pipo**, pingüino (`recursos/imagenes/pinguino_618.png`).
- Voz: tuteo cercano, español de interfaz, inglés en el contenido de aprendizaje.
- Identidad visual: hielo/azul, tema oscuro por defecto, OpenMoji.

## Evidence on Hand

- Vocabulario, trivia y parejas en `src/penguin_english/datos/`.
- Imágenes OpenMoji y WAV en `recursos/`.
- Pseudocódigo en `pseint/`.
- No hay testimonios, métricas de aprendizaje ni capturas de usuarios reales. No inventarlas.

## Product Principles

1. **Explicable en oral:** cada módulo documenta el porqué (bucle de eventos, interpolación, CEFR).
2. **Jugar sin red:** si el audio o pygame fallan, el juego sigue.
3. **El nivel cambia el reto:** el CEFR filtra palabras y ajusta constantes.
4. **Pipo guía, no distrae:** el pingüino explica estados; no es un chatbot.
5. **Una identidad:** polar/hielo, no un skin genérico de app.

## Accessibility & Inclusion

Teclado (Tab/Enter), contraste AA en ambos temas, botones de clic amplio, indicador si no hay sonido. No hay requisito WCAG formal de un cliente; se toma AA como piso académico.
