# 🐧 Penguin English Adventure

Juego educativo de escritorio para **aprender inglés de forma interactiva**,
acompañado por **Pipo**, un pingüino que guía al estudiante durante todas
las actividades.

Proyecto académico desarrollado con **Python** (lógica) y **Tkinter/ttk**
(interfaz gráfica), pensado para un estudiante de programación que está
aprendiendo los conceptos básicos con PSeInt.

---

## 1. ¿Qué es el proyecto?

Es una aplicación que se ejecuta en la computadora (sin internet) y que
enseña vocabulario en inglés con cinco actividades:

1. **Aprender vocabulario**: más de 300 palabras en 20 categorías, etiquetadas CEFR A1/A2/B1, con imágenes, traducción y ejemplo.
2. **Trivia**: banco amplio de opción múltiple (8/10/12 por partida según el nivel).
3. **Completar palabra**: elegir la letra que falta en una palabra.
4. **Ordenar palabra**: escribir la palabra correcta con letras desordenadas.
5. **Juego de memoria**: encontrar las parejas palabra → imagen.

El juego incluye sistema de puntos, porcentaje de aciertos, barra de
progreso, tema claro/oscuro y un pingüino que explica las actividades.

## 2. Objetivo educativo

- Aprender vocabulario de inglés de A1 a B1 (animales, escuela, casa, clima, verbos, adjetivos, viajes, tecnología, …).
- Relacionar el **algoritmo** (PSeInt) con un **programa real** (Python) y una **interfaz gráfica** (Tkinter).
- Demostrar los conceptos básicos de programación vistos en clase.

## 3. Características

| Característica | Detalle |
|---|---|
| 5 actividades | Vocabulario, trivia, completar, ordenar, memoria |
| Puntos | +10 por respuesta correcta, +20 de bonificación por terminar una actividad |
| Progreso | En memoria: actividades completadas, % de avance y % de aciertos |
| Pipo | Pingüino con mensajes predefinidos (sin inteligencia artificial) |
| Nivel CEFR | Selector A1 / A2 / B1 (filtro acumulativo; A2 por defecto) |
| Tema | Oscuro noche polar por defecto; botón para alternar a claro |
| Sonidos | `pygame.mixer` al 50% por defecto; slider `Vol.` en el encabezado; aviso "Sin sonido" si el mixer no arranca |
| Imágenes | OpenMoji (CC BY-SA 4.0), locales, cache por ventana |
| Animaciones | Fundido de tema, títulos, pulso, barra; volteo 2.5D con palabra o PNG OpenMoji |
| Sin internet | Todo el contenido es local |

## 4. Tecnologías utilizadas

- **Python 3.10 o superior** (probado con 3.12 y 3.14).
- **Tkinter + ttk**: interfaz gráfica incluida con Python.
- **pygame**: audio portable (`mixer`) y lienzo 2.5D (cartas de memoria
  y celebración). No abre su propia ventana: pinta en RAM y Tk muestra
  la foto. En Python 3.14, si falta rueda, `pygame-ce`.
- **random**: para mezclar preguntas, letras y mensajes.
- **pathlib**: para ubicar la carpeta de imágenes y sonidos.
- **unittest**: pruebas automáticas (incluido con Python).
- **PSeInt**: pseudocódigo de apoyo en la carpeta `pseint/`.

La única dependencia de **runtime** es **pygame** (`pip install -e .`).
Tkinter viene con Python. El porqué de cada librería está en
[docs/LIBRERIAS.md](docs/LIBRERIAS.md).

## 5. Estructura de carpetas

```
penguin-english-adventure/
│
├── pyproject.toml             → configuración del paquete (dependencias, comando)
├── README.md                  → este archivo
├── .gitignore                 → archivos que no se suben a git
│
├── docs/                      → documentación para el estudiante
│   ├── CONSTRUCCION.md        → paso a paso de cómo se armó el juego
│   ├── LIBRERIAS.md           → por qué cada librería (y cuáles no)
│   ├── DOCUMENTACION.md       → archivo por archivo y función por función
│   ├── ARQUITECTURA.md        → capas, flujo de ronda, puente pygame↔Tk
│   ├── CEFR.md                → cómo se etiquetan A1/A2/B1
│   ├── AUDIT.md               → auditoría de escritorio
│   └── MEJORAS.md             → mejoras posibles y dónde tocar el código
│
├── src/penguin_english/
│   ├── __init__.py            → marca el paquete de Python
│   ├── __main__.py            → permite ejecutar con python -m penguin_english
│   ├── main.py                → crea la ventana del juego
│   │
│   ├── datos/                 → el contenido educativo (solo datos)
│   │   ├── vocabulario.py     → 300+ palabras en 20 categorías (CEFR)
│   │   ├── niveles.py         → filtro acumulativo A1/A2/B1
│   │   └── preguntas.py       → trivia, parejas de memoria y mensajes de Pipo
│   │
│   ├── juegos/                → la lógica de cada juego (sin interfaz)
│   │   ├── trivia.py          → elegir preguntas y validar respuestas
│   │   ├── completar.py       → crear preguntas de letra faltante
│   │   ├── ordenar.py         → desordenar palabras y validar intentos
│   │   └── memoria.py         → crear tablero y verificar parejas
│   │
│   ├── interfaz/              → las pantallas de la interfaz gráfica
│   │   ├── componentes.py     → colores, temas, botones, barra, Pipo, imágenes
│   │   ├── animaciones.py     → animaciones y transiciones
│   │   ├── inicio.py          → pantalla del nombre del jugador
│   │   ├── menu.py            → menú principal
│   │   ├── intro.py           → ayuda breve justo antes de cada actividad
│   │   ├── ayuda.py           → instrucciones del juego
│   │   ├── vocabulario.py     → pantalla de vocabulario
│   │   ├── trivia.py          → pantalla de trivia
│   │   ├── completar.py       → pantalla de completar palabra
│   │   ├── ordenar.py         → pantalla de ordenar palabra
│   │   ├── memoria.py         → pantalla del juego de memoria
│   │   ├── lienzo_pygame.py   → volteo 2.5D y celebración
│   │   └── resultado.py       → resumen al terminar una actividad
│   │
│   └── utilidades/
│       ├── puntuacion.py      → puntos, aciertos, progreso y nivel CEFR
│       ├── rutas.py           → dónde está la carpeta recursos/
│       └── sonidos.py         → sonidos con pygame (portable)
│
├── recursos/
│   ├── imagenes/              → imágenes OpenMoji (CC BY-SA 4.0)
│   ├── sonidos/               → WAV del juego (clic, correcto, error, ganar)
│   └── ATRIBUCIONES.md        → créditos y licencias de los recursos
│
├── scripts/
│   ├── generar_sonidos.py     → genera los WAV desde cero (sin dependencias)
│   ├── lanzar.py              → entrada de PyInstaller (import absoluto)
│   ├── empaquetar.sh          → Docker + Wine → zip de Windows
│   └── zip_windows.py         → comprime dist/PenguinEnglish/
│
├── pseint/                    → algoritmos en PSeInt
│   ├── menu.psc
│   ├── trivia.psc
│   └── puntos.psc
│
└── tests/                     → unittest (sin skip; UI vía display o Xvfb)
    ├── soporte_display.py         → arranca Xvfb si no hay DISPLAY
    ├── test_e2e.py                → recorrido completo con crear_ventana()
    ├── test_ui_ux.py
    └── … (niveles, sonidos, animaciones, lienzo, rutas)
```

> 📖 **¿Quieres entender el código a fondo?** Empieza por
> [docs/CONSTRUCCION.md](docs/CONSTRUCCION.md) (cómo se construyó),
> [docs/LIBRERIAS.md](docs/LIBRERIAS.md) (por qué cada librería) y
> [docs/DOCUMENTACION.md](docs/DOCUMENTACION.md) (función por función).

> 💡 **¿Quieres mejorar el juego?** Lee [docs/MEJORAS.md](docs/MEJORAS.md),
> que lista mejoras posibles y exactamente dónde tocar el código.

---

## 6. Cómo instalar y ejecutar

### Paso 0: requisitos previos

- Una computadora con **Windows 10/11** o **Linux** (Debian/Ubuntu).
- **Python 3.10 o superior** (cómo instalarlo está en los pasos siguientes).
- Conexión a internet solo la primera vez (para instalar Python y pygame).

### Windows

**1. Instalar Python**

1. Entra a https://www.python.org/downloads/
2. Descarga la última versión estable (3.12, 3.13 o 3.14).
3. Ejecuta el instalador y **marca la casilla "Add Python to PATH"** (es
   indispensable para que la terminal reconozca el comando `python`).
4. Tkinter ya viene incluido en el instalador oficial: no hay que hacer nada más.

**2. Verificar la instalación**

Abre una terminal (escribe `cmd` en el menú inicio y presiona Enter):

```bat
python --version
```

Debe aparecer algo como `Python 3.12.4`. Si dice "python no se reconoce",
revisa el punto 3 de arriba o consulta la [solución de problemas](#windows-python-no-se-reconoce).

**3. Ir a la carpeta del proyecto**

```bat
cd C:\ruta\donde\descargaste\penguin-english-adventure
```

> Reemplaza la ruta con la carpeta real donde tienes el proyecto.

**4. Crear el entorno virtual**

Un entorno virtual aísla las bibliotecas del proyecto para no ensuciar el sistema:

```bat
python -m venv .venv
```

**5. Activar el entorno virtual**

```bat
.venv\Scripts\activate
```

Verás que la terminal ahora empieza con `(.venv)`.

**6. Instalar el juego (y pygame)**

```bat
pip install -e .
```

Esto instala el juego "en modo editable" (los cambios en el código se ven al
instante) y descarga automáticamente **pygame**, la única dependencia externa.

**7. ¡Ejecutar el juego!**

```bat
python -m penguin_english
```

O también, si el paso anterior terminó bien:

```bat
penguin-english
```

**8. (Opcional) Ejecutar las pruebas automáticas**

```bat
python -m unittest discover -s tests
```

Debe decir `OK`.

### Linux (Debian / Ubuntu)

**1. Instalar Python, Tkinter y pip**

```bash
sudo apt update
sudo apt install python3 python3-tk python3-pip python3-venv
```

> **¿Por qué `python3-tk`?** En Linux, Tkinter es un paquete aparte que no
> viene incluido en Python. Sin él, el juego falla con `ModuleNotFoundError:
> No module named 'tkinter'`. Es **obligatorio**.

**2. Verificar que Tkinter funciona**

```bash
python3 -m tkinter
```

Debe abrirse una ventanita de prueba. Ciérrala para continuar.

**3. Ir a la carpeta del proyecto**

```bash
cd /ruta/donde/descargaste/penguin-english-adventure
```

**4. Crear el entorno virtual**

```bash
python3 -m venv .venv
```

**5. Activar el entorno virtual**

```bash
source .venv/bin/activate
```

Verás que la terminal ahora empieza con `(.venv)`.

**6. Instalar el juego (y pygame)**

```bash
pip install -e .
```

**7. ¡Ejecutar el juego!**

```bash
python3 -m penguin_english
```

O también:

```bash
penguin-english
```

**8. (Opcional) Ejecutar las pruebas automáticas**

```bash
python3 -m unittest discover -s tests -v
```

> Las pruebas de interfaz necesitan un display. Si no hay pantalla:
> `sudo apt install xvfb` y `xvfb-run python3 -m unittest discover -s tests -v`.
>
> En Python 3.14, si `pip install pygame` falla por falta de rueda, usa
> `pip install pygame-ce` (el `import pygame` es el mismo).

### Distribuir el juego en Windows (sin instalar Python)

Desde Linux, con Docker:

```bash
bash scripts/empaquetar.sh
```

Eso crea **`dist/PenguinEnglish-windows.zip`**. Ese es el archivo que se
envía (USB, Drive, correo). No mandes solo el `.exe`: necesita la carpeta
`_internal` (pygame, Tkinter, imágenes y sonidos).

En el PC Windows: descomprimir el zip y doble clic en
`PenguinEnglish/PenguinEnglish.exe`.

### Solución de problemas

#### Windows: "python no se reconoce"

1. Abre el instalador de Python otra vez y elige **Modify**.
2. Marca **Add Python to PATH**.
3. Cierra y vuelve a abrir la terminal.

#### Linux: "No module named 'tkinter'"

Instala el paquete que falta:

```bash
sudo apt install python3-tk
```

#### El juego abre pero no se oyen sonidos

1. Verifica que pygame se instaló: `pip show pygame`.
2. Si pygame no pudo inicializar el audio (por ejemplo, en una máquina
   virtual o un servidor), el juego funciona igual, simplemente sin sonido.
3. En Windows puedes verificar el volumen general del sistema.

#### La ventana no aparece en Linux

El juego necesita una sesión gráfica (X11/Wayland). Si estás en un servidor,
no podrás abrir ventanas de Tk. En una computadora normal con escritorio,
esto no ocurre.

---

## 7. Cómo funciona el programa (vista general)

```
python -m penguin_english
        │
        ▼
┌───────────────────┐
│  __main__.py      │  Punto de entrada: llama a iniciar()
└─────────┬─────────┘
          ▼
┌───────────────────┐
│  main.py          │  Crea la ventana Tk (960x680), pone los puntos en
│  (iniciar)        │  cero, configura los estilos y abre la pantalla de inicio.
└─────────┬─────────┘
          ▼
┌───────────────────┐
│  inicio.py        │  "¿Cómo te llamas?" → el jugador escribe su nombre.
└─────────┬─────────┘
          ▼
┌───────────────────┐
│  menu.py          │  Menú con las 5 actividades + progreso.
└─────┬───────┬─────┘
      │       │
      ▼       ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │vocabulario│ │ trivia    │ │completar │ │ ordenar  │ │ memoria  │
  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
       │              │            │            │            │
       └──────────────┴──────┬─────┴────────────┴────────────┘
                             ▼
                    ┌───────────────────┐
                    │  resultado.py     │  Resumen + bonificación de +20
                    └─────────┬─────────┘
                              ▼
                        Volver al menú
```

**Idea clave**: en Tkinter no hay "pantallas" como en una página web. Cada
pantalla es una función que **borra la ventana** (`limpiar_pantalla`) y
**dibuja widgets nuevos** (etiquetas, botones, barras). Por eso cada función
recibe como parámetro el estado del juego (ronda actual, puntos, etc.): al
volver a dibujar, ese estado se usa para mostrar lo que corresponde.

## 8. Cómo ejecutar las pruebas

Desde la carpeta del proyecto (con el entorno virtual activo):

```bash
python -m unittest discover -s tests -v
```

En un servidor sin pantalla (Linux):

```bash
sudo apt install xvfb
xvfb-run python -m unittest discover -s tests -v
```

Cobertura opcional: `pip install -e ".[dev]"` y luego
`python -m coverage run -m unittest discover -s tests && python -m coverage report`.

En Python 3.14, si `pygame` no tiene rueda, instala `pygame-ce` (mismo `import pygame`).

Esto ejecuta las pruebas que verifican:
- Lógica de puntuación, preguntas, vocabulario CEFR y filtro de nivel.
- Cambios de tema claro/oscuro (con fundido animado).
- Flujos de cada actividad y un e2e de toda la app (`crear_ventana()`, sin skip).
- Estructura visual de cada pantalla (textos clave, botones, Pipo, barra).
- Carga de imágenes PNG, animaciones, volteo 2.5D y sonidos (mixer en hilo principal).

## 9. Conceptos de programación utilizados

| Concepto | Dónde se usa |
|---|---|
| Variables | `puntos`, `pregunta_actual`, `tema_actual` |
| Tipos de datos | `int`, `str`, `bool`, listas y diccionarios |
| Condicionales `if/elif/else` | validar respuestas, colorear opciones |
| Ciclo `for` | recorrer categorías, opciones y tarjetas |
| Ciclo `while` | desordenar letras hasta que cambien |
| Listas | preguntas, opciones, tarjetas, mensajes |
| Diccionarios | cada palabra, cada pregunta, los temas de color |
| Funciones | `calcular_puntos`, `mostrar_menu`, `crear_pregunta`... |
| Parámetros | las pantallas reciben el nombre y el estado del juego |
| Valores de retorno | `mensaje_pipo()`, `porcentaje_aciertos()` |
| Acumuladores | `puntos += 10` |
| Contadores | `respuestas_correctas += 1` |
| Manejo de errores | validación del nombre y de la palabra escrita |
| Módulos | `random`, `tkinter`, `pathlib`, `sys`, `unittest` |

## 10. ¿Qué partes corresponden a PSeInt?

La carpeta `pseint/` contiene los algoritmos en pseudocódigo que se pueden
ejecutar en PSeInt:

| Archivo | Algoritmo | Equivalente en Python |
|---|---|---|
| `pseint/menu.psc` | Menú principal con `Repetir` y `Segun` | `interfaz/menu.py` |
| `pseint/trivia.psc` | Trivia con `Para`, `Si` y acumuladores | `interfaz/trivia.py` y `juegos/trivia.py` |
| `pseint/puntos.psc` | Función `calcular_puntos` | `utilidades/puntuacion.py` |

La idea es ver la relación:

```text
PSeInt (algoritmo)
   ↓
Python (lógica)
   ↓
Tkinter (interfaz gráfica)
```

## 11. Recursos utilizados

- **Imágenes**: proyecto **OpenMoji** (https://openmoji.org/), licencia
  CC BY-SA 4.0. Detalles en `recursos/ATRIBUCIONES.md`.
- **Sonidos**: archivos WAV generados con `scripts/generar_sonidos.py`
  (tonos propios, sin licencia externa) y reproducidos con pygame.
- **Contenido educativo**: vocabulario y frases de ejemplo redactadas para
  el nivel básico del juego.

## 12. Licencias y atribuciones

- El código del proyecto es de uso libre para fines académicos.
- Las imágenes son de OpenMoji (CC BY-SA 4.0): ver `recursos/ATRIBUCIONES.md`.

---

## Explicación para la exposición

### ¿Qué problema resuelve?

Aprender vocabulario en inglés puede ser aburrido con listas de palabras.
Este juego convierte el estudio en una aventura con un pingüino que guía
al estudiante, con puntos, imágenes y minijuegos que motivan a seguir.

### ¿Cómo funciona?

El programa muestra una ventana con Tkinter. Las pantallas se dibujan una
a la vez: al pulsar un botón, se limpia la ventana y se dibuja la siguiente.
Los datos (palabras, preguntas, mensajes) están en listas y diccionarios
dentro del código, así que no se necesita internet ni base de datos.

### ¿Cómo funciona la trivia?

1. El juego elige 10 preguntas al azar de las 40 guardadas.
2. Muestra la pregunta y 4 botones de respuesta.
3. Al pulsar un botón, se compara con la respuesta correcta.
4. Si acierta: +10 puntos, botón verde y Pipo explica. Si falla: 0 puntos,
   la opción se pone roja y Pipo muestra la respuesta correcta.
5. Al terminar, se muestra el resumen y la bonificación de +20 puntos.

### ¿Cómo se calculan los puntos?

En `utilidades/puntuacion.py` hay acumuladores simples:

```python
if es_correcta:
    respuestas_correctas += 1
    puntos += PUNTOS_CORRECTA      # 10
    return PUNTOS_CORRECTA
return 0
```

### ¿Cómo funciona el progreso?

Cada actividad terminada se guarda en la lista `actividades_completadas`.
El porcentaje se calcula dividiendo las completadas entre las 5 actividades
totales. Las respuestas correctas también cuentan su porcentaje.

### ¿Cómo funciona el pingüino?

Pipo es una imagen (OpenMoji) con un globo de diálogo. Sus mensajes están
guardados en un diccionario con listas, y se eligen al azar con `random`:

```python
def mensaje_pipo(clave):
    return random.choice(MENSAJES_PIPO[clave])
```

### ¿Qué estructuras de Python se utilizaron?

Variables, condicionales, ciclos `for` y `while`, listas, diccionarios,
funciones con parámetros y valores de retorno, contadores, acumuladores,
manejo básico de errores y módulos (`random`, `tkinter`, `pathlib`).

### ¿Por qué se utilizó Tkinter?

Porque viene incluido con Python (no hay que instalar nada), funciona en
Windows y Linux, y es ideal para interfaces sencillas como la de este
juego. Además, se puede explicar con facilidad: cada botón es una
instrucción que llama a una función.

### ¿Qué se aprendió desarrollando el proyecto?

- Pasar un algoritmo (PSeInt) a código real (Python).
- Organizar un proyecto en carpetas con datos, lógica e interfaz separadas.
- Usar diccionarios para guardar información con nombre.
- Diseñar una interfaz amigable con colores, temas y estados visuales.
- Probar el código automáticamente con `unittest`.
- Respetar licencias de recursos (CC BY-SA 4.0).

---

## Preguntas frecuentes

**¿Por qué no se oyen sonidos?**
El juego usa `pygame.mixer` para los WAV de `recursos/sonidos/` y una
`Surface` de pygame (sin ventana) para el volteo 2.5D de las cartas.
Si pygame no logra inicializar el audio (por ejemplo, en una máquina
virtual), el juego funciona igual pero en silencio. En Windows, además,
hay un respaldo con `winsound.Beep` si falta el archivo WAV.

**¿Dónde se guarda el progreso?**
En memoria: al cerrar el juego, los puntos vuelven a cero. Se eligió así
para mantener el proyecto sencillo (sin archivos ni bases de datos). En
[docs/MEJORAS.md](docs/MEJORAS.md) se explica cómo guardarlo en un archivo.

**¿Cómo cambio el tema de color?**
Con el botón **Modo oscuro / Modo claro** que aparece arriba en todas las
pantallas. El tema oscuro (por defecto) es negro profundo (`#000000`) con
tarjetas un poco más claras, y el cambio de tema es inmediato.

**¿Las imágenes se descargan de internet al jugar?**
No. Las imágenes se guardan en `recursos/imagenes/` y el juego no necesita
internet para funcionar.

**¿Puedo agregar mis propias palabras o preguntas?**
Sí, y es muy fácil: solo hay que editar `src/penguin_english/datos/vocabulario.py`
(palabras) o `src/penguin_english/datos/preguntas.py` (preguntas y mensajes).
La guía completa está en [docs/DOCUMENTACION.md](docs/DOCUMENTACION.md).

**¿El juego funciona en macOS?**
Sí, el código usa Tkinter y pygame, que también funcionan en macOS. Las
instrucciones de este README cubren Windows y Linux, que son los sistemas
donde se probó.