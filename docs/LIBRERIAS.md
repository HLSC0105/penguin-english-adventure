# Librerías y por qué se usan

Cada ficha responde cuatro preguntas: **qué es**, **para qué está en
este juego**, **qué pasaría si no estuviera** y **qué alternativa se
descartó**. El runtime del jugador solo necesita Python + pygame
(Tkinter viene con el instalador oficial). El resto es stdlib, pruebas
o empaquetado.

Para el relato de construcción ver [CONSTRUCCION.md](CONSTRUCCION.md).

---

## 1. Python 3.10 o superior

**Qué es.** Lenguaje interpretado. El proyecto se prueba con 3.12 y 3.14;
el exe de Windows se congela con 3.12 (más estable con PyInstaller que
3.14).

**Para qué.** Traduce los algoritmos de PSeInt (variables, `Si`, `Para`,
funciones) a un programa real. `>=3.10` permite `match` si se necesitara
y anotaciones modernas; el código en sí es deliberadamente sencillo.

**Si no estuviera.** No hay juego. No se eligió Java/C# para no alejar al
estudiante de PSeInt.

**Descartado.** Un ejecutable “solo binario” sin fuente: el objetivo
académico es **leer** el código.

---

## 2. `tkinter` y `tkinter.ttk` (biblioteca estándar)

**Qué es.** Enlace de Python a Tcl/Tk. `tk` son widgets clásicos
(`Label`, `Button`, `Canvas`, `Entry`). `ttk` aporta `Progressbar` y el
tema `clam`.

**Para qué.** Toda la interfaz que no es el tablero 2.5D: menú, nombre,
trivia, completar, ordenar, vocabulario, ayuda, resultado, tema
claro/oscuro, `after()` para animar sin congelar, `bind("<Return>")`.

**Si no estuviera.** Habría que enseñar otra GUI (Qt, pygame como único
loop) y se pierde el puente “biblioteca que ya viene con Python”.

**Descartado.**

- **pygame como única ventana:** peor para formularios (`Entry`, tema,
  accesibilidad mínima con Tab).
- **PyQt / Kivy:** otra dependencia grande, otro modelo mental.
- **Web (Flask + HTML):** exige servidor o navegador; el enunciado pide
  escritorio sin internet.

El instalador **embeddable** de Python no trae Tcl/Tk. Por eso el exe se
arma con el instalador oficial de Windows dentro de Wine.

---

## 3. `pygame` (y `pygame-ce` en Python 3.14)

**Qué es.** Biblioteca multimedia sobre SDL. Aquí **no** se usa
`pygame.display` ni el bucle de eventos de pygame.

**Para qué, dos usos:**

1. `pygame.mixer` — reproducir WAV (`clic`, `correcto`, `error`, `ganar`)
   igual en Windows, Linux y macOS. `Sound.set_volume` (default 0.5).
2. `pygame.Surface` — pintar el volteo de cartas (PNG OpenMoji en la
   cara imagen) y la celebración en RAM; el buffer RGB se convierte a
   PPM y Tk lo muestra. El PNG se carga con `image.load` + `smoothscale`
   **sin** `convert()`: off-screen no hay formato de display.

En `pyproject.toml` la dependencia es `pygame>=2.5`. Si en 3.14 no hay
rueda, `pip install pygame-ce` (el `import pygame` es el mismo).

**Si no estuviera.** El juego funcionaría en silencio (el código ya
tolera mixer ausente) y el memoria caería al fallback de Canvas Tk
(rectángulos, sin proyección `cos θ`).

**Descartado.**

- `winsound` solo: no existe en Linux.
- `playsound` / `simpleaudio`: otra dependencia y peor portabilidad.
- Pillow para el puente de imagen: innecesaria si se escribe PPM a mano.
- `pygame.display`: dos `mainloop` pelean; Tk pierde clics o pygame
  se come el foco.

---

## 4. `random` (stdlib)

**Qué es.** Generador seudoaleatorio.

**Para qué.**

| Función | Dónde |
|---|---|
| `random.sample` | Trivia (k preguntas sin repetir); tablero de memoria (k parejas) |
| `random.shuffle` | Orden de opciones; letras del anagrama; orden de tarjetas |
| `random.choice` | Palabra de completar/ordenar; mensaje de Pipo; letra distractora |
| `random.randint` | Posición del hueco en completar |

**Si no estuviera.** Cada partida sería idéntica; el estudiante vería
siempre la misma trivia.

**Descartado.** Un “shuffle” hecho a mano con `randint` en un `Para`:
peor de leer y fácil de sesgar. `sample` es el algoritmo de Knuth de
k elementos, O(k).

Las pruebas fijan `random.seed` para ser reproducibles.

---

## 5. `pathlib` y `sys` (stdlib)

**Qué es.** `Path` para rutas; `sys` para `frozen`, `_MEIPASS`,
`executable` y `platform`.

**Para qué.** `utilidades/rutas.py` busca `recursos/` en varios sitios
(árbol fuente, paquete instalado, carpeta del exe). En desarrollo
`Path(__file__).parents[3] / "recursos"`; congelado,
`Path(sys._MEIPASS) / "recursos"`.

`sys.platform == "win32"` elige `state("zoomed")` frente a `maxsize()`
en Linux.

**Si no estuviera.** Las rutas se hardcodearían (`C:\...`) y el exe no
encontraría PNG ni WAV.

**Descartado.** `os.path.join` con strings: más verboso, mismo resultado.
`importlib.resources` se usa como **candidato extra**, no como único
origen, porque los assets viven en `recursos/` junto a la raíz.

---

## 6. `math` (stdlib)

**Qué es.** Funciones matemáticas.

**Para qué.** El volteo 2.5D: `math.cos` para el ancho visible y qué cara
se ve; `math.ceil` para filas del tablero; `math.pi` como ángulo del
dorso.

**Si no estuviera.** Habría que aproximar el coseno a mano, peor para
una defensa oral de dos minutos.

**Descartado.** Un motor 3D (OpenGL, Panda3D): fuera de alcance y otra
dependencia.

---

## 7. `os` y `threading` (stdlib)

**`os.environ`.** Apaga animaciones (`PEA_SIN_ANIM`) y audio
(`PEA_SILENCIO`) en tests; fuerza `SDL_VIDEODRIVER=dummy`.

**`threading.Thread(daemon=True)`.** Reproduce el WAV fuera del hilo de
Tk para no congelar clics. El mixer **no** se crea en ese hilo (falla en
algunos Linux).

**Descartado.** `asyncio` para el audio: Tk ya tiene su loop; mezclar
tres bucles (Tk, pygame, asyncio) es peor que un hilo daemon de tres
líneas.

---

## 8. `logging` (stdlib)

**Para qué.** Avisos de `sonidos.py` cuando el mixer no arranca, sin
`print` que ensucie la consola del exe (`console=False`).

---

## 9. `tkinter.font` (stdlib, junto a Tk)

**Para qué.** `animar_aparicion_titulo` cambia el tamaño de fuente paso
a paso. No es una librería extra.

---

## 10. `unittest` (stdlib)

**Qué es.** Marco de pruebas incluido en Python.

**Para qué.** ~150 tests: datos, reglas, temas, sonidos, lienzo, e2e y
UI. Se corre con `python -m unittest discover -s tests`.

**Si no estuviera.** Habría que jugar a mano cada cambio (CEFR, shuffle,
cascarón).

**Descartado.** pytest: más cómodo, pero es otra dependencia. El curso
usa la biblioteca estándar.

No se usa `skip`: si no hay display ni Xvfb, el test **falla** con
instrucciones de instalación (`soporte_display.py`).

---

## 11. `coverage` (extra `dev`)

**Qué es.** Mide qué líneas ejecutó la suite.

**Para qué.** Opcional: `pip install -e ".[dev]"`. No hace falta para
jugar.

**Descartado.** Como dependencia de runtime: el jugador no la necesita.

---

## 12. PyInstaller (extra `dist`)

**Qué es.** Congela el programa en un árbol con `.exe` + DLLs.

**Para qué.** `penguin.spec` (onedir, `console=False`, nombre
`PenguinEnglish`, datas de `recursos/` y pygame). Entrada
`scripts/lanzar.py`.

**Si no estuviera.** El compañero tendría que instalar Python.

**Descartado.**

- `--onefile`: un solo binario enorme; pygame/Tk suelen romper el mixer
  al extraer a temp.
- cx_Freeze / Nuitka: válidos, pero PyInstaller es el más documentado
  para Tk + pygame.

En Linux nativo PyInstaller genera ELF. Para un PE de Windows hace falta
el paso siguiente.

---

## 13. Docker + Wine + CPython Windows 3.12

**Qué es.** Contenedor `tobix/pywine:3.12`: Wine ejecuta el Python
oficial de Windows (con Tcl/Tk) y `pip install pyinstaller pygame`
instala ruedas `win_amd64`.

**Para qué.** Generar `dist/PenguinEnglish-windows.zip` **en esta
máquina Linux**. Script: `scripts/empaquetar.sh`.

**Si no estuviera.** Habría que construir el exe en un PC Windows.

**Descartado.** Wine del sistema (no está instalado aquí); cross-compile
real de PE desde Linux (PyInstaller no lo hace).

---

## 14. Tcl/Tk embebido en el zip

No se instala con `pip`. Viaja dentro de `_internal` porque el Python
de Windows del contenedor es el instalador completo. El encabezado PPM
y `_tkinter.pyd` son lo que abre la GUI al doble clic, sin Python en el
PATH del destinatario.

---

## 15. `zipfile` / `shutil` (stdlib) en el empaquetado

`scripts/zip_windows.py` usa `shutil.make_archive` para el zip onedir.
No es una librería del juego; es del script de distribución.

---

## Lo que deliberadamente no se usa

| Tecnología | Por qué no |
|---|---|
| Pillow | El puente Surface→Tk es PPM, formato nativo de `PhotoImage`. |
| `pygame.display` / `pygame.event.pump` | Conflicto con `mainloop`. |
| NumPy | pygame opcionalmente lo usa; el volteo no lo necesita. |
| Red, `requests`, APIs de traducción | El juego es local; OpenMoji se descarga **una vez** en desarrollo (`scripts/descargar_openmoji.py`). |
| Modelo de lenguaje / TTS | Pipo es listas de frases; el enunciado pide eso. |
| Base de datos / JSON de guardado | El progreso es de la sesión (variables de módulo). |
| pytest, black, mypy | Fuera del alcance del curso; unittest basta. |
| Qt, Electron, Unity | Otras escuelas de UI; aquí se enseña Tk + un lienzo acotado. |

---

## Mapa archivo → librería principal

| Archivo | Librería que justifica su existencia |
|---|---|
| `interfaz/*.py` salvo `lienzo_pygame.py` | tkinter |
| `lienzo_pygame.py` | pygame Surface + math + tk.Canvas |
| `utilidades/sonidos.py` | pygame.mixer (+ winsound de respaldo) |
| `juegos/*.py` | random |
| `utilidades/rutas.py` | pathlib, sys |
| `datos/niveles.py` | (ninguna externa; índices de tupla) |
| `tests/*` | unittest, tkinter, Xvfb |
| `penguin.spec` | PyInstaller |
| `scripts/empaquetar.sh` | Docker, Wine |
