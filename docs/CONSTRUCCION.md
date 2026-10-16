# Cómo se construyó Penguin English Adventure

Informe académico de **construcción por capas**. No es un diario de
cambios: cada paso responde a un problema, nombra el archivo que nació
y el algoritmo que aporta. Para el detalle función por función ver
[DOCUMENTACION.md](DOCUMENTACION.md). Para el porqué de cada librería,
[LIBRERIAS.md](LIBRERIAS.md).

```
PSeInt (idea)
    → datos (contenido)
        → juegos (reglas puras)
            → interfaz Tkinter (pantallas)
                → pygame (audio + lienzo 2.5D)
                    → CEFR (filtro acumulativo)
                        → unittest
                            → exe Windows (Docker + Wine)
```

---

## 1. El problema pedagógico

Se necesitaba un **juego de escritorio** para aprender inglés de A1 a B1,
sin internet, sin cuenta ni inteligencia artificial, pensado para un
estudiante que ya escribe algoritmos en **PSeInt** y está pasando a
Python.

Decisiones que condicionan todo lo demás:

| Decisión | Consecuencia en el código |
|---|---|
| Sin red en tiempo de juego | Vocabulario, PNG y WAV van en `recursos/` |
| Pipo no es un chatbot | Mensajes predefinidos en `MENSAJES_PIPO` + `random.choice` |
| Enseñar el puente PSeInt → GUI | Tkinter (biblioteca estándar), no un motor 3D |
| Una sola dependencia externa | pygame para audio y para pintar cartas |
| El progreso vive en la sesión | Variables de módulo en `puntuacion.py`; al cerrar, cero |

El personaje **Pipo** es un pingüino guía. Explica actividades, anima
aciertos y consuela errores. No decide el contenido: el banco lo escribe
el autor del juego.

---

## 2. De PSeInt a Python

En `pseint/` hay tres algoritmos de apoyo:

- `menu.psc` — elegir actividad (equivalente al `mostrar_menu` de Tk).
- `trivia.psc` — ciclo `Para`, acumuladores `puntos` y `aciertos`.
- `puntos.psc` — suma de +10 / +20.

La trivia en PSeInt cabe en una pantalla:

```
puntos ← 0
Para pregunta ← 1 Hasta 3 Hacer
    Escribir pregunta
    Leer opcion
    Si opcion = correcta Entonces
        puntos ← puntos + 10
    FinSi
FinPara
```

En Python esa idea se **parte en tres archivos**, porque un programa con
interfaz no puede mezclar “qué pregunta sale” con “cómo se dibuja el
botón”:

| Idea PSeInt | Módulo Python | Algoritmo |
|---|---|---|
| Banco escrito a mano | `datos/preguntas.py` | Lista de diccionarios |
| Elegir 3 preguntas | `juegos/trivia.py` → `obtener_preguntas` | `random.sample` + copia |
| `puntos ← puntos + 10` | `utilidades/puntuacion.py` → `sumar_respuesta` | Acumulador |
| `Escribir` / `Leer` | `interfaz/trivia.py` | Widgets y callbacks |

Este es el primer patrón del proyecto: **datos / reglas / pantalla**.
Las reglas se pueden ejecutar en la consola; las pantallas importan las
reglas, nunca al revés.

---

## 3. Capa de datos

Archivos: `src/penguin_english/datos/vocabulario.py`, `preguntas.py`,
más tarde `niveles.py`.

### 3.1 Vocabulario como diccionarios

Cada palabra es un registro:

```
{ingles, espanol, imagen, ejemplo, nivel}
```

Las categorías (`CATEGORIAS`) son un diccionario de listas. Al final del
archivo, dos ciclos anidados construyen `TODAS_LAS_PALABRAS` para no
escribir el banco dos veces. Complejidad: O(n) al importar el módulo,
una sola vez.

Las imágenes son PNG de **OpenMoji** (CC BY-SA 4.0), nombradas con el
código Unicode (`1F415.png` = perro). Si `imagen` es `None`, la interfaz
dibuja un círculo con la primera letra (`circulo_letra`). Créditos en
`recursos/ATRIBUCIONES.md`.

### 3.2 Trivia, memoria y Pipo

`PREGUNTAS_TRIVIA` guarda pregunta, cuatro opciones, la correcta, una
explicación y el nivel CEFR. El invariante (comprobado por tests) es
`correcta ∈ opciones`.

`PAREJAS_MEMORIA` son pares `{ingles, imagen, nivel}` suficientes para
ocho parejas en B1.

`mensaje_pipo(clave)` elige un texto al azar de una lista. Aporta
variedad sin modelo de lenguaje.

### 3.3 Sonidos

`scripts/generar_sonidos.py` sintetiza WAV (tono seno + envolvente) con
la librería estándar. El juego no descarga audio: reproduce archivos
locales con pygame.

---

## 4. Capa de juegos (reglas puras)

Archivos: `src/penguin_english/juegos/{trivia,completar,ordenar,memoria}.py`.

Ninguno importa `tkinter`. Eso permite `tests/test_juegos.py` sin
pantalla.

| Función | Problema que resuelve | Algoritmo |
|---|---|---|
| `obtener_preguntas` | Una partida no debe mutar el banco | `sample` + `dict()` + `shuffle` de opciones |
| `validar_respuesta` | Comparar la elección del jugador | Igualdad de cadenas |
| `crear_pregunta` | Hueco de una letra + 2 distractoras | Posición al azar (en B1 no la inicial); `while` hasta 3 letras distintas |
| `mostrar_palabra_con_espacios` | Mostrar `A P P _ E` | Recorrido O(L) sustituyendo un índice por `_` |
| `crear_palabra` | Anagrama que no sea la palabra | `shuffle` en ciclo hasta `desordenada ≠ original` |
| `validar_palabra` | Aceptar `" apple "` | `strip` + `upper` |
| `crear_tablero` | N parejas palabra/imagen barajadas | Por cada pareja, dos tarjetas; `shuffle` |
| `son_pareja` | ¿Mismo `par`? | Igualdad de enteros |

La cantidad de preguntas, rondas y parejas **no está quemada** en estos
módulos: la lee `parametros_nivel` (paso 8). Las constantes `CANTIDAD_PREGUNTAS = 10`
y `TOTAL_RONDAS = 8` son el valor A2, por si alguien llama sin nivel.

---

## 5. Capa de interfaz (Tkinter)

Tkinter no tiene “páginas”. El estado del juego viaja en los
**parámetros** de `mostrar_*` (índice, aciertos, ronda, tarjetas
volteadas). Al responder, se vuelve a llamar a la misma función con el
estado actualizado.

### 5.1 Arranque

`python -m penguin_english` ejecuta `__main__.py` → `iniciar()`:

1. `reiniciar_puntuacion()`
2. `inicializar_motor()` (mixer en el hilo de Tk)
3. `tk.Tk()`, mínimo 1280×720
4. `instalar_cascaron` + `precargar_imagenes`
5. `mostrar_inicio`
6. `maximizar` y `mainloop`

Los tests e2e llaman `crear_ventana()` **sin** `mainloop` y conducen la
UI con `update()`.

### 5.2 Flujo de una actividad

```
inicio (nombre)
  → menú (nivel CEFR + 5 botones)
      → intro (Pipo explica; Empezar / Volver)
          → juego (trivia / completar / ordenar / memoria / vocabulario)
              → resultado (+20 si aplica)
                  → menú
```

`intro.py` nació para que el jugador no caiga en la actividad sin saber
las reglas. `ayuda.py` sigue existiendo como manual global.

Los importes circulares (menú ↔ trivia) se rompen importando
`mostrar_menu` **dentro** de la función, no al inicio del módulo.

### 5.3 Vocabulario

Paginación de 4 tarjetas. Los huecos `_hueco_nav` reservan el sitio de
Anterior/Siguiente para que el número de página no salte. “Volver al
listado” solo en la última página. El bloque se centra con `pack()` sin
`fill=both`.

---

## 6. Cascarón persistente, scroll y ventana

Al principio cada cambio de pantalla destruía **todos** los hijos de la
ventana. Eso recargaba el PNG grande de Pipo y se sentía lento.

Solución en `instalar_cascaron`:

- `_header` permanente (nombre, puntos, tema, menú).
- `_cuerpo` → `Canvas` + `Scrollbar` + frame `_contenido`.
- `limpiar_pantalla` vacía `_contenido`, no el encabezado.
- `lienzo(ventana)` es el padre de las pantallas.
- La barra vertical solo se empaqueta si el interior es más alto que el
  canvas (`_actualizar_scroll`).
- La rueda se enlaza con `bind_all` porque los hijos del `create_window`
  no reciben Enter/Leave del canvas.

Pipo en UI usa `pinguino_128.png` (no el PNG de 618 px) para no decodificar
una foto enorme en cada pintura.

La ventana mínima es 1280×720. `maximizar` usa `state("zoomed")` en
Windows; en Linux `geometry` al `maxsize()` del escritorio (no pantalla
completa: se conserva la barra de título).

---

## 7. pygame: audio y luego lienzo

### 7.1 Mixer primero

`pygame.mixer` reproduce WAV en Windows, Linux y macOS. Se inicia **una
vez** en el hilo principal. `Sound.play()` corre en un hilo daemon para
no congelar Tk. Si el mixer falla, el juego sigue y el encabezado muestra
“Sin sonido”. En Windows, `winsound.Beep` es el último recurso.

Los WAV se cachean (`_obtener_sound`) para no releer disco en cada clic.

### 7.2 Lienzo 2.5D después

Tkinter no proyecta una carta en 3D. pygame sí pinta en una `Surface`,
pero **abrir `pygame.display`** pelea con `mainloop`.

Contrato:

1. pygame dibuja en RAM (sin ventana SDL).
2. El buffer RGB se serializa a **PPM** (P6), formato que `PhotoImage`
   entiende sin Pillow.
3. Tk muestra esa foto en un `Canvas` y recibe el clic.
4. Un `after(33, tick)` anima ~30 fps. No hay `time.sleep`.

El volteo es una proyección ortográfica, no un motor 3D:

```
ancho_visible = |cos θ| · ancho
cara = frente si cos θ ≥ 0, si no dorso
sombra_canto = 1 − |cos θ|
```

Si pygame no puede crear la Surface, el mismo widget dibuja rectángulos
en el Canvas. Los tests de UI usan `_ProxyTarjeta.invoke()` como si
fueran botones.

La celebración del resultado (`LienzoCelebracion`) reutiliza el mismo
puente.

---

## 8. Niveles CEFR

Un solo banco etiquetado. El filtro es **acumulativo**: B1 incluye A1 y
A2. Ver [CEFR.md](CEFR.md).

`cumple_nivel` compara índices en `("A1", "A2", "B1")`. Complejidad de
filtrar n ítems: O(n).

Además del banco, `PARAMETROS` cambia rondas, parejas, espera del flip y
si el hueco de completar puede ser la letra inicial (en B1 no). Los
puntos por acierto no cambian: la dificultad es el reto, no el premio.

El nivel vive en `puntuacion.nivel_actual` (por defecto A2) y se elige
en el menú.

---

## 9. Pruebas

`unittest` sin `skip`. Si no hay display, `soporte_display.py` arranca
Xvfb; si no puede, **falla** (un skip escondería que la suite gráfica no
corrió).

Variables de entorno para no gastar segundos en CI:

- `PEA_SIN_ANIM=1` — las interpolaciones saltan al estado final.
- `PEA_SILENCIO=1` — no se disparan WAV.
- `SDL_VIDEODRIVER=dummy` — pygame no abre ventana.

Hay dos familias:

| Familia | Qué cubre | ¿Necesita Tk? |
|---|---|---|
| `test_juegos`, `test_niveles`, `test_puntuacion`, … | Reglas y datos | No |
| `test_ui_ux`, `test_e2e`, `test_visual_por_seccion` | Pantallas | Sí |

---

## 10. Distribución Windows desde Linux

PyInstaller **en Linux nativo** produce un ELF, inútil en Windows. En
esta máquina se usa **Docker + Wine + CPython 3.12 para Windows**.

- Entrada: `scripts/lanzar.py` (import absoluto; `__main__.py` relativo
  se rompe como script de PyInstaller).
- Spec: `penguin.spec`, modo **onedir** (carpeta + `_internal`). Un
  `--onefile` gigante suele romper el mixer.
- `rutas.py` mira `sys.frozen` y `sys._MEIPASS` para hallar `recursos/`.
- Entregable: `dist/PenguinEnglish-windows.zip`. No se envía el `.exe`
  suelto.

Comando: `bash scripts/empaquetar.sh`.

---

## Qué aporta cada capa (resumen)

| Capa | Pregunta que responde |
|---|---|
| PSeInt | ¿Cuál es el algoritmo, en español? |
| `datos/` | ¿Qué contenido hay? |
| `juegos/` | ¿Cuáles son las reglas? |
| `interfaz/` | ¿Cómo lo ve y toca el jugador? |
| `utilidades/` | ¿Dónde están los puntos, los WAV y los PNG? |
| pygame lienzo | ¿Cómo se ve una carta al girar? |
| tests | ¿Sigue siendo cierto lo anterior? |
| PyInstaller | ¿Puede jugar alguien sin Python instalado? |
