# Documentación del código (guía para estudiantes)

Esta guía explica **archivo por archivo** y **función por función** cómo
está construido Penguin English Adventure. Está pensada para quien ya
conoce PSeInt y está aprendiendo Python.

Relato de cómo se armó el sistema: [CONSTRUCCION.md](CONSTRUCCION.md).
Por qué cada librería: [LIBRERIAS.md](LIBRERIAS.md).
Capas y puente pygame↔Tk: [ARQUITECTURA.md](ARQUITECTURA.md).
Niveles A1/A2/B1: [CEFR.md](CEFR.md).

> **Antes de leer**: ejecuta el juego (ver `README.md`). Esta guía no
> repite la instalación.

---

## Índice

1. [Conceptos básicos de Tkinter](#1-conceptos-básicos-de-tkinter)
2. [El arranque del programa](#2-el-arranque-del-programa)
3. [Paquete `datos`](#3-paquete-datos-el-contenido-educativo)
4. [Paquete `juegos` y tablas de algoritmos](#4-paquete-juegos-la-lógica-sin-interfaz)
5. [Paquete `interfaz`](#5-paquete-interfaz-las-pantallas)
6. [Paquete `utilidades`](#6-paquete-utilidades)
7. [Scripts (sonidos, OpenMoji, exe)](#7-scripts-sonidos-openmoji-exe)
8. [Las pruebas automáticas](#8-las-pruebas-automáticas)
9. [Glosario](#9-glosario)

---

## 1. Conceptos básicos de Tkinter

### 1.1 Widgets

Un **widget** es un elemento visual: `Label`, `Button`, `Entry`,
`Progressbar` (ttk), `Frame`, `Canvas`. Se crea indicando el **padre**
y las opciones:

```python
etiqueta = tk.Label(ventana, text="Hola", font=fuente(14))
```

### 1.2 `pack` y `grid`

Hasta que no se “empaca”, el widget no se ve.

- `pack()`: uno debajo de otro, o al lado (`side="left"`).
- `grid()`: cuadrícula (`row`, `column`).

El menú pone las cinco actividades en `grid` de 2 columnas.

### 1.3 El bucle de eventos (`mainloop`)

`ventana.mainloop()` espera clics y teclas. El juego no “termina” solo:
sigue vivo hasta `destroy`. Los tests no llaman a `mainloop`; usan
`update()` para procesar una tanda de eventos.

### 1.4 `after` (hacer algo después)

`widget.after(ms, funcion)` programa un callback **sin bloquear**. Es la
base de animaciones, del volteo que espera `espera_flip_ms()` y del tick
~30 fps del lienzo pygame. Un `time.sleep` congelaría los clics.

### 1.5 `bind`

`ventana.bind("<Return>", funcion)` asocia Enter al callback (inicio y
ordenar). El canvas de memoria usa `<Button-1>` para el clic en una carta.

### 1.6 Callbacks y lambda

```python
boton = tk.Button(ventana, text="Salir", command=ventana.destroy)
```

`command` guarda la función, no la llama todavía. Si hace falta pasar
argumentos:

```python
lambda: repintar_pantalla(ventana, mostrar_menu, nombre_jugador)
```

En el menú, `lambda n=nivel:` captura el nivel del `for` (si no, todos
los botones verían el último valor del ciclo).

### 1.7 `PhotoImage` y el cache

Mientras el widget exista, el `PhotoImage` debe vivir en memoria. El
proyecto lo guarda en `imagenes_guardadas[id(raiz)]`. Una imagen creada
con una ventana no sirve en otra (`image "pyimageX" doesn't exist`).

Pipo en la UI usa `pinguino_128.png`. El PNG de 618 px es respaldo; no
se decodifica en cada cambio de pantalla.

### 1.8 Cascarón persistente (no se destruye toda la ventana)

Tkinter no tiene páginas. El patrón **actual** es:

1. `instalar_cascaron(ventana)` crea una sola vez `_header` (barra) y
   `_contenido` (dentro de un `Canvas` con scroll).
2. `lienzo(ventana)` devuelve `_contenido`: ahí se empaca cada pantalla.
3. `repintar_pantalla` vacía **solo** `_contenido` y llama a `mostrar_*`.
4. `guardar_pantalla(funcion, *argumentos)` recuerda qué pantalla está
   activa para redibujarla al cambiar el tema.

El encabezado se reutiliza (`crear_encabezado` actualiza textos in situ
cuando puede). Destruir toda la ventana recargaba Pipo y se sentía lento.

Si el interior es más alto que el canvas, `_actualizar_scroll` muestra
la barra. La rueda se enlaza con `bind_all` (MouseWheel / Button-4/5)
porque los hijos de `create_window` no reciben Enter/Leave del canvas.

El **estado del juego** sigue viajando en los parámetros de `mostrar_*`
(índice, ronda, tarjetas volteadas, etc.).

---

## 2. El arranque del programa

### 2.1 `src/penguin_english/__main__.py`

```python
from .main import iniciar

if __name__ == "__main__":
    iniciar()
```

Permite `python -m penguin_english`. El `if __name__ == "__main__"` solo
es cierto cuando el archivo se ejecuta como programa, no al importarlo.

PyInstaller no usa este archivo: usa `scripts/lanzar.py` (import
absoluto), porque los relativos se rompen como script congelado.

### 2.2 `src/penguin_english/main.py`

Constantes: `ANCHO_MINIMO = 1280`, `ALTO_MINIMO = 720` (720p).

| Función | Qué hace |
|---|---|
| `maximizar(ventana)` | En Windows intenta `state("zoomed")`. En Linux usa `geometry` al `maxsize()` del escritorio (no pantalla completa: queda la barra de título). |
| `_silenciar_errores_fondo(ventana)` | `bgerror` vacío. Los `after()` pueden tocar widgets ya destruidos al cambiar de pantalla. |
| `crear_ventana()` | Mixer en el hilo principal, puntos a cero, `Tk()`, cascarón, precarga de Pipo, `mostrar_inicio`. **No** entra a `mainloop` (los e2e usan `update()`). |
| `iniciar()` | `crear_ventana()`, `maximizar()`, `mainloop()`. |

Precondición de `crear_ventana`: no debe haber otro `Tk()` huérfano en
el hilo. Postcondición: inicio visible, puntuación en cero.

---

## 3. Paquete `datos` (el contenido educativo)

Solo diccionarios y listas. Sin Tk y (salvo `mensaje_pipo` y el filtro)
sin reglas de partida.

### 3.1 `vocabulario.py`

Cada palabra:

| Clave | Tipo | Ejemplo |
|---|---|---|
| `ingles` | `str` | `"dog"` |
| `espanol` | `str` | `"perro"` |
| `imagen` | `str` o `None` | `"1F415.png"` |
| `ejemplo` | `str` | `"I have a dog."` |
| `nivel` | `str` | `"A1"` |

`CATEGORIAS` agrupa ~20 listas. `TODAS_LAS_PALABRAS` se construye con
dos `for` anidados al importar el módulo (O(n), una vez). Si `imagen`
es `None`, la UI dibuja `circulo_letra`.

### 3.2 `preguntas.py`

Trivia: `pregunta`, `opciones` (4), `correcta` (debe estar en opciones),
`explicacion`, `nivel`. Parejas de memoria: `ingles`, `imagen`, `nivel`.
`MENSAJES_PIPO`: listas por clave (`saludo`, `correcto`, `ayuda`, …).

| Función | Algoritmo | Complejidad |
|---|---|---|
| `mensaje_pipo(clave)` | `random.choice` sobre la lista | O(1) |

### 3.3 `niveles.py`

Filtro **acumulativo**. Detalle pedagógico: [CEFR.md](CEFR.md).

| Función | Entrada | Pasos | Salida | Complejidad |
|---|---|---|---|---|
| `cumple_nivel(etiqueta, nivel)` | dos cadenas A1/A2/B1 | compara índices en `NIVELES` | `bool` | O(1) |
| `filtrar_por_nivel(items, nivel)` | secuencia de dicts con `"nivel"` | comprensión de lista; **no muta** el banco | nueva `list` | O(n) |
| `parametros_nivel(nivel)` | nivel o `None` (usa el actual) | `dict()` copia de `PARAMETROS` | rondas, parejas, flip, hueco inicial | O(1) |
| `palabras_jugables(nivel)` | — | filtra palabras del nivel sin espacio/guion y con ≥ 3 letras | lista para completar/ordenar | O(n) |

A1: 8 trivia / 6 completar-ordenar / 4 parejas, flip lento, hueco
inicial permitido. A2: 10 / 8 / 6. B1: 12 / 10 / 8, flip corto, **no**
hueco en la primera letra.

---

## 4. Paquete `juegos` (la lógica sin interfaz)

Las reglas **no importan Tk**. Se pueden llamar desde la consola. La
interfaz importa juegos; nunca al revés.

### 4.1 `juegos/trivia.py`

`CANTIDAD_PREGUNTAS = 10` es el valor A2; la cantidad real sale de
`parametros_nivel`.

#### Algoritmo `obtener_preguntas`

| | |
|---|---|
| **Entrada** | `cantidad` opcional, `nivel` opcional |
| **Pasos** | 1) `preguntas_del_nivel`. 2) `k = min(cantidad, len(banco))`. 3) `random.sample(banco, k)` — k elementos **sin repetir**. 4) Por cada pregunta: `dict(pregunta)` y `shuffle` de una **copia** de `opciones`. |
| **Salida** | lista de diccionarios listos para la UI |
| **Complejidad** | sample O(k); copiar opciones O(k · 4) |
| **Por qué copiar** | si se mutara el banco, la próxima partida tendría las opciones en el mismo orden |

#### Algoritmo `validar_respuesta`

Igualdad `respuesta == pregunta["correcta"]`. O(1).

### 4.2 `juegos/completar.py`

#### Algoritmo `crear_pregunta`

| | |
|---|---|
| **Entrada** | nivel (palabras jugables) |
| **Pasos** | 1) `random.choice` de una palabra, `upper()`. 2) Posición: `randint(0, L-1)` o, en B1, `randint(1, L-1)` (no la inicial). 3) Distractores: `while len(opciones) < 3` elige letras de `A–Z` no repetidas. 4) `shuffle`. |
| **Salida** | `{palabra, posicion, opciones, correcta}` |
| **Complejidad** | O(L) para armar el dict; el `while` espera 2 letras distintas (casi O(1)) |

#### Algoritmo `mostrar_palabra_con_espacios`

Recorre índices; en `posicion` pone `_`; une con espacios.
`"APPLE"`, posición 3 → `"A P P _ E"`. O(L).

### 4.3 `juegos/ordenar.py`

#### Algoritmo `crear_palabra`

| | |
|---|---|
| **Pasos** | Elige palabra jugable. `list(original)` + `shuffle` en `while True` hasta `desordenada != original`. |
| **Por qué el ciclo** | un anagrama igual a la palabra original es tramposo |
| **Complejidad esperada** | O(L) por intento; para L≥2 la probabilidad de quedar igual es 1/L! |

#### Algoritmo `validar_palabra`

`intento.strip().upper() == original.upper()`. Así `" apple "` vale.

### 4.4 `juegos/memoria.py`

Tarjeta: `par` (int), `tipo` (`palabra`/`imagen`), `texto`, `imagen`,
`visible`.

#### Algoritmo `crear_tablero`

| | |
|---|---|
| **Pasos** | `sample` de `cantidad_parejas()` ítems del banco del nivel. Por cada pareja, dos dicts (palabra + imagen) con el mismo `par`. `shuffle` de la lista. |
| **Salida** | 8 / 12 / 16 tarjetas según A1/A2/B1 |
| **Complejidad** | O(p) parejas |

#### Algoritmo `son_pareja`

`tarjeta_a["par"] == tarjeta_b["par"]`. No compara textos: una carta es
palabra y la otra imagen.

`espera_flip_ms()` lee el parámetro del nivel (1100 / 900 / 650 ms).

---

## 5. Paquete `interfaz` (las pantallas)

Herramientas visuales + una función `mostrar_*` por pantalla. Todas
dibujan sobre `lienzo(ventana)`, no sobre la raíz `Tk` (salvo el
encabezado).

### 5.1 `componentes.py`

Temas `TEMA_CLARO` / `TEMA_OSCURO` (negro profundo `#000000` por
defecto). Claves: `fondo`, `panel`, `tarjeta`, `texto`, `boton`,
`acento`, `correcto`, `incorrecto`, `foco`, `sombra`, `sobre_acento`, …

| Función | Qué hace |
|---|---|
| `obtener_color` / `fuente` | Token del tema; Segoe UI en Windows, DejaVu Sans en el resto |
| `configurar_estilos` | ttk `clam` y colores de la barra |
| `instalar_cascaron` | `_header` + Canvas + scroll + `_contenido` |
| `_actualizar_scroll` | barra solo si el interior es más alto |
| `_enlazar_rueda` | rueda en Windows (`delta`) y X11 (Button-4/5) |
| `lienzo` | padre de la pantalla actual |
| `limpiar_pantalla` | vacía contenido; en tests también el header |
| `repintar_pantalla` | vacía contenido y llama a `mostrar_*` |
| `repintar_si_activa` | no pinta encima del menú si el jugador ya se fue (memoria) |
| `alternar_tema` | cambia tokens, limpia header+contenido, redibuja |
| `cargar_imagen` | cache por `id(raiz)` y tamaño; `subsample` si hace falta |
| `precargar_imagenes` | decodifica `pinguino_128.png` al arrancar |
| `crear_tarjeta` | Frame de sombra offset + panel interior |
| `crear_boton` | hover, foco, sombra; `primer_boton` encuentra el Button real |
| `crear_encabezado` | nombre, puntos, aciertos, nivel, `Vol.` + slider (0–100, default 50) o “Sin sonido”, tema, Menú |
| `crear_pipo` | imagen 128 px + burbuja |
| `circulo_letra` | Canvas con la inicial si no hay PNG |

`_redirigir_geometria` hace que `pack` del botón mueva el Frame sombra.
No se aliasa `destroy` (ciclaba).

### 5.2 `animaciones.py`

Todas usan `after`. Si el widget ya no existe, no hacen nada.
`PEA_SIN_ANIM=1` salta al estado final (tests).

| Función | Idea |
|---|---|
| `ease_out_cubic(t)` | arranque rápido, freno al final |
| `interpolar_color` | mezcla RGB con t ∈ [0,1] |
| `fundir_fondo` | pasos de color de fondo |
| `animar_aparicion_titulo` | crece la fuente |
| `pulsar_widget` | alterna dos colores (acierto) |
| `animar_barra` | sube el porcentaje |
| `resal_burbuja_pipo` | el borde “respira” |
| `bombear_after` | tests: drena la cola de `after` |

### 5.3 `inicio.py`

`mostrar_inicio`: título, Pipo, `Entry` del nombre, Enter o “¡Comenzar!”.
Si el nombre está vacío o solo espacios, aviso en rojo; si no,
`mostrar_menu` con `strip()`.

### 5.4 `menu.py`

`ACTIVIDADES`: cinco tuplas `(etiqueta, clave)`. El selector A1/A2/B1
llama `establecer_nivel` y redibuja. `_clic_y_pintar` reproduce
`sonido_clic` **en el clic**, no al pintar (si no, cada redibujo
sonaría). `elegir_actividad` abre `mostrar_intro`, no el juego directo.

`iniciar_trivia` / `completar` / `ordenar` / `memoria` generan el estado
inicial con las funciones de `juegos/` y llaman a `mostrar_*`.
Vocabulario se marca completado al entrar (es estudio, no puntaje).

### 5.5 `intro.py`

Diccionario `INTROS` por clave. Botones Empezar / Volver. Pipo explica
esa actividad (ayuda contextual, distinta de `ayuda.py`).

### 5.6 `ayuda.py`

Manual global: actividades, puntos, CEFR. Importa `mostrar_menu` **dentro**
de la función para no ciclar con `menu.py`.

### 5.7 `vocabulario.py`

`PALABRAS_POR_PAGINA = 4`. Categorías del nivel en grid 2×N.

Paginación: `_hueco_nav` reserva el ancho de Anterior/Siguiente aunque
el botón no exista (el “Página X de Y” no se desplaza). “Volver al
listado” **solo en la última página**. El bloque se centra con `pack()`.

`crear_tarjeta_palabra`: imagen o círculo, inglés, español, etiqueta
CEFR, ejemplo.

### 5.8 `trivia.py`

Estado: lista de preguntas, índice, aciertos, puntos de la actividad,
`respondida`, opción `elegida`. Al responder: `validar_respuesta`,
`sumar_respuesta`, sonido, repinta con feedback (verde/rojo, explicación
de Pipo, Siguiente). Al terminar: bonificación + `mostrar_resultado`.

### 5.9 `completar.py`

Igual patrón ronda/total. Muestra `mostrar_palabra_con_espacios`. Tres
botones de letra. Pipo dice la palabra completa en el feedback.

### 5.10 `ordenar.py`

Letras desordenadas, `Entry`, Enter o Comprobar. Vacío → aviso de Pipo.
`validar_palabra` ignora mayúsculas y espacios.

### 5.11 `memoria.py`

No hay botones `?`. El tablero es `LienzoMemoria` (pygame o Canvas).
El estado vive en `ventana._memoria_estado` para que el closure del clic
no se quede con `volteadas=[]`. El lienzo **no se recrea** al voltear:
solo `sincronizar(..., animar_indices=)`.

Regla de `voltear_tarjeta`:

1. Ignorar si `esperando` o ya hay 2 volteadas o la carta ya es visible.
2. Marcar `visible`, animar ese índice (giro `π → 0`).
3. Con 2 cartas: `son_pareja` → puntos, destello, ¿tablero completo?;
   si no, `esperando=True` y `after(espera_flip_ms, dar_vuelta_tarjetas)`
   que gira otra vez a dorso.

Los tests pulsan `ventana._control_memoria.proxy(i).invoke()`.

### 5.12 `resultado.py`

Porcentaje de la actividad → mensaje `perfecto` / `felicitaciones` /
`animo`. La bonificación **ya está sumada** (si se sumara aquí, el tema
la duplicaría). Incluye `LienzoCelebracion`.

### 5.13 `lienzo_pygame.py`

#### Algoritmo del volteo

| Función | Fórmula | Aporte |
|---|---|---|
| `ancho_carta_volteo(θ, ancho)` | `max(2, \|cos θ\| · ancho)` | de cara plena a canto |
| `cara_visible(θ)` | frente si `cos θ ≥ 0` | qué textura pintar |
| `sombra_canto(θ)` | `1 − \|cos θ\|` | oscurece al filo |
| `superficie_a_ppm` | cabecera P6 + bytes RGB | Tk sin Pillow |

`LienzoMemoria`: tick `after(33)` a paso `π/12`; clic → índice 4 columnas.
Cara palabra: texto. Cara imagen: blit del PNG OpenMoji **sin**
`convert()`/`convert_alpha()` (exigen `display.set_mode` y, al fallar,
pintaban un círculo azul). El glifo va sobre un recuadro claro. Dorso: `?`.
Fallback Tk: el mismo contrato (incluido el PNG). Ver
[ARQUITECTURA.md](ARQUITECTURA.md).

---

## 6. Paquete `utilidades`

### 6.1 `puntuacion.py`

Estado de **sesión** (globales de módulo). Al cerrar, se pierde.

| Dato | Valor |
|---|---|
| `PUNTOS_CORRECTA` | 10 |
| `PUNTOS_BONIFICACION` | 20 |
| `TOTAL_ACTIVIDADES` | 5 |
| `nivel_actual` | `"A2"` al reiniciar |

#### Algoritmo `porcentaje_aciertos`

Si `preguntas_respondidas == 0` → 0 (no divide). Si no,
`round(correctas * 100 / respondidas)`. O(1).

`progreso_porcentaje` es análogo con `len(actividades_completadas) / 5`.
`completar_actividad` inserta la clave solo la primera vez.

### 6.2 `sonidos.py`

Mixer singleton en el hilo principal. Cache de `Sound`. Volumen por
defecto **0.5** (`Sound.set_volume`); el slider `Vol.` del encabezado
llama a `establecer_volumen`. Reproducción en hilo daemon. Si falla:
el juego sigue, `audio_disponible()` es False y no hay slider.
Windows: `winsound.Beep` si no hay WAV (sin control de volumen).

`PEA_SILENCIO=1` no dispara audio (tests).

### 6.3 `rutas.py`

Lista de candidatos. **Si `sys.frozen`:** `_MEIPASS/recursos` y
`exe/recursos`. Si no: `parents[3]` (raíz del repo), paquete, cwd,
`importlib.resources`. Devuelve el primero que tenga `sonidos/` o
`imagenes/`.

---

## 7. Scripts (sonidos, OpenMoji, exe)

### `scripts/generar_sonidos.py`

WAV PCM 16 bit / 44100 Hz / mono, tono seno + fade. Sin dependencias.
`clic` 800 Hz 60 ms; `correcto` sube; `error` grave; `ganar` arpegio.

### `scripts/descargar_openmoji.py`

Baja un glifo por código Unicode (hace falta red **en desarrollo**). El
juego publicado no llama a la red.

### `scripts/lanzar.py`

`from penguin_english.main import iniciar` — entrada de PyInstaller.

### `scripts/empaquetar.sh` + `Dockerfile.windows-exe` + `penguin.spec`

Docker + Wine + Python Windows 3.12 → onedir `PenguinEnglish/` → zip.
`console=False`. No enviar el `.exe` suelto (`_internal` lleva Tk,
pygame y `recursos/`).

### `scripts/zip_windows.py`

`shutil.make_archive` del directorio onedir.

---

## 8. Las pruebas automáticas

`python -m unittest discover -s tests`. Sin `skip`.

`soporte_display.asegurar_display()`: si `DISPLAY` abre Tk, listo; si
no, lanza Xvfb (`:93` o `PEA_XVFB_DISPLAY`); si no hay Xvfb, **falla**
con el comando de instalación.

| Archivo | Qué verifica |
|---|---|
| `test_puntuacion.py` | acumuladores, bonificación, nivel |
| `test_preguntas.py` | `correcta ∈ opciones`, parejas, Pipo |
| `test_vocabulario.py` | ≥20 categorías, ≥300 palabras, PNG, CEFR |
| `test_niveles.py` | filtro acumulativo y cupos |
| `test_juegos.py` | sample, anagrama, tablero, validaciones |
| `test_temas.py` | mismas claves claro/oscuro; default oscuro |
| `test_sonidos.py` | init en hilo principal; WAV pedido (mock) |
| `test_animaciones.py` | interpolación y callback |
| `test_lienzo_pygame.py` | `cos θ` y PPM sin ventana SDL |
| `test_rutas.py` | candidatos; rama `sys.frozen` |
| `test_e2e.py` | `crear_ventana()` recorrido |
| `test_ui_ux.py` | flujos de las 5 actividades, intro, tema |
| `test_visual_por_seccion.py` | cascarón, scroll, Pipo, cada pantalla |
| `test_animaciones` / visual | `PEA_SIN_ANIM` evita `after` largos |

Cómo se prueba la UI: `tk.Tk()`, `mostrar_*`, `update()`, buscar textos
y `invoke()` de botones (o `proxy` del lienzo), `destroy()`.

---

## 9. Glosario

| Término | Significado |
|---|---|
| **Widget** | Elemento visual de Tkinter |
| **Callback** | Función que corre cuando hay un evento |
| **Lambda** | Función de una expresión, a menudo para `command=` |
| **`after`** | Programar un callback en milisegundos sin bloquear |
| **Cascarón** | Header + canvas de scroll que no se destruyen al cambiar de pantalla |
| **Lienzo** | Frame `_contenido` donde se empaca la pantalla |
| **Estado del juego** | Ronda, índice, volteadas… viaja en parámetros |
| **Onedir** | Carpeta `.exe` + `_internal` (no un solo archivo) |
| **`_MEIPASS`** | Carpeta temporal/interna de PyInstaller con los datas |
| **Filtro acumulativo** | B1 incluye A1 y A2 |
| **PPM** | Formato de imagen cruda que `PhotoImage` abre sin Pillow |
| **Proyección ortográfica** | El volteo usa `cos θ`, no un motor 3D |
| **PSeInt** | Pseudocódigo en español; ver carpeta `pseint/` |
| **Hilo daemon** | Reproduce el WAV sin congelar Tk |
| **Xvfb** | X virtual para tests sin monitor |
