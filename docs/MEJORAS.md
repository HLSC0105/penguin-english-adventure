# 💡 Mejoras posibles y dónde tocar el código

Esta guía lista ideas para mejorar Penguin English Adventure. Cada mejora
indica **el archivo exacto** y **qué cambiar**. Está pensada como proyecto
de práctica: puedes empezar con las mejoras fáciles (solo datos) e ir
subiendo de dificultad (lógica e interfaz).

---

## Índice

1. [Cambios fáciles (solo datos, sin tocar lógica)](#1-cambios-fáciles-solo-datos-sin-tocar-lógica)
2. [Cambios de configuración (constantes)](#2-cambios-de-configuración-constantes)
3. [Cambios visuales (temas y animaciones)](#3-cambios-visuales-temas-y-animaciones)
4. [Mejoras de funcionalidad](#4-mejoras-de-funcionalidad)
5. [Nuevas actividades](#5-nuevas-actividades)
6. [Publicación y distribución](#6-publicación-y-distribución)
7. [Orden sugerido de práctica](#7-orden-sugerido-de-práctica)

---

## 1. Cambios fáciles (solo datos, sin tocar lógica)

> No requieren entender mucho del código: solo hay que respetar el formato
> de los diccionarios. Después de cada cambio, corre los tests.

### 1.1 Agregar una palabra a una categoría

**Archivo**: `src/penguin_english/datos/vocabulario.py`

**Qué hacer**: añade un diccionario a la lista de su categoría:

```python
"Animales": [
    ...,
    {"ingles": "turtle", "espanol": "tortuga",
     "imagen": "1F422.png", "ejemplo": "The turtle is slow."},
],
```

> Si la palabra no tiene imagen, usa `"imagen": None` y la interfaz dibuja
> un círculo con la primera letra. Para que muestre imagen, descarga el
> PNG (por ejemplo de OpenMoji) y guárdalo en `recursos/imagenes/`.

### 1.2 Agregar una categoría nueva

**Archivo**: `src/penguin_english/datos/vocabulario.py`

**Qué hacer**: añade una clave nueva al diccionario `CATEGORIAS` con su
lista de 7 palabras. El menú de categorías y las pruebas lo detectan solos.

### 1.3 Agregar preguntas a la trivia

**Archivo**: `src/penguin_english/datos/preguntas.py`

**Qué hacer**: añade diccionarios a `PREGUNTAS_TRIVIA`:

```python
{"pregunta": "¿Qué significa \"TREE\"?", "opciones": ["Árbol", "Flor", "Hoja", "Pasto"],
 "correcta": "Árbol", "explicacion": "Tree significa árbol."},
```

> Regla obligatoria: `correcta` debe estar dentro de `opciones`. El test
> `test_preguntas.py` lo verifica.

### 1.4 Agregar parejas al juego de memoria

**Archivo**: `src/penguin_english/datos/preguntas.py`

**Qué hacer**: añade diccionarios a `PAREJAS_MEMORIA`:

```python
{"ingles": "FISH", "imagen": "1F41F.png"},
```

> El tablero se redimensiona solo (crea 2 tarjetas por pareja), pero el
> `test_juegos.py` espera un número par de tarjetas y el layout de
> `mostrar_memoria` usa 4 tarjetas por fila.

### 1.5 Cambiar o agregar mensajes de Pipo

**Archivo**: `src/penguin_english/datos/preguntas.py`

**Qué hacer**: edita las listas de `MENSAJES_PIPO` o agrega una clave
nueva (ej. `"inicio_actividad"`). Luego úsala en la pantalla que quieras
con `mensaje_pipo("inicio_actividad")`.

---

## 2. Cambios de configuración (constantes)

> Son una sola línea y cambian el comportamiento del juego.

| Mejora | Archivo | Qué cambiar |
|---|---|---|
| Puntos por respuesta | `src/penguin_english/utilidades/puntuacion.py` | `PUNTOS_CORRECTA = 10` |
| Bonificación por terminar | `src/penguin_english/utilidades/puntuacion.py` | `PUNTOS_BONIFICACION = 20` |
| Rondas de completar palabra | `src/penguin_english/juegos/completar.py` | `TOTAL_RONDAS = 8` |
| Rondas de ordenar palabra | `src/penguin_english/juegos/ordenar.py` | `TOTAL_RONDAS = 8` |
| Preguntas por partida de trivia | `src/penguin_english/juegos/trivia.py` | `CANTIDAD_PREGUNTAS = 10` |
| Palabras por página en vocabulario | `src/penguin_english/interfaz/vocabulario.py` | `PALABRAS_POR_PAGINA = 4` |
| Tiempo que se muestran las tarjetas que no son pareja | `src/penguin_english/interfaz/memoria.py` | `ESPERA_FLIP = 900` (milisegundos) |
| Tamaño de la ventana | `src/penguin_english/main.py` | `ventana.geometry("960x680")` y `minsize(860, 620)` |

---

## 3. Cambios visuales (temas y animaciones)

### 3.1 Cambiar los colores de un tema

**Archivo**: `src/penguin_english/interfaz/componentes.py`

**Qué hacer**: edita los valores de `TEMA_CLARO` o `TEMA_OSCURO`. Por
ejemplo, para un fondo azul profundo en el tema oscuro:

```python
TEMA_OSCURO = {
    "fondo": "#0A1A2F",
    ...
}
```

### 3.2 Crear un tema nuevo (ej. tema "noche roja")

**Archivo**: `src/penguin_english/interfaz/componentes.py`

**Qué hacer**:

1. Define el diccionario `TEMA_ROJO = {"fondo": "#1A0000", ...}` con las
   mismas 15 claves que los otros temas.
2. En `alternar_tema()`, agrega la condición para cambiar a este tema.
3. En `crear_encabezado()`, el texto del botón debe mostrar "Modo ..."
   según el tema activo.

> ⚠️ Los tests de temas verifican que cada tema tenga todas las claves.
> Si agregas un tema, los tests existentes siguen pasando; agrega los
> tuyos si quieres.

### 3.3 Cambiar la velocidad de las animaciones

**Archivo**: `src/penguin_english/interfaz/animaciones.py`

**Qué hacer**: modifica los parámetros por defecto (`duracion_ms`,
`pasos`). Más `duracion_ms` = más lento. Ejemplo: `fundir_fondo(..., duracion_ms=500)`.

### 3.4 Desactivar las animaciones

**Archivo**: `src/penguin_english/interfaz/componentes.py`

**Qué hacer**: en `crear_titulo`, `crear_pipo` y `alternar_tema`, pasa
`animar=False` o quita las llamadas a `fundir_fondo`.

---

## 4. Mejoras de funcionalidad

### 4.1 Guardar el progreso en un archivo (para que no se pierda al cerrar)

**Archivo**: `src/penguin_english/utilidades/puntuacion.py`

**Qué hacer**: agrega funciones `guardar_progreso()` y `cargar_progreso()`
que escriban/lean un JSON con el módulo `json`:

```python
import json
from pathlib import Path

ARCHIVO = Path.home() / "penguin_progreso.json"

def guardar_progreso():
    datos = {"puntos": puntos, "actividades": actividades_completadas}
    ARCHIVO.write_text(json.dumps(datos, ensure_ascii=False))
```

**Dónde llamarla**: en `reiniciar_puntuacion()` o al inicio del juego
(`main.py`), y al terminar cada actividad.

### 4.2 Agregar niveles de dificultad

**Hecho.** Selector CEFR A1/A2/B1 en inicio y menú (`puntuacion.nivel_actual`,
`datos/niveles.py`). Ver `docs/CEFR.md`.

### 4.3 Agregar un temporizador por pregunta

**Archivo**: `src/penguin_english/interfaz/trivia.py`

**Qué hacer**: usa `ventana.after(1000, funcion)` para contar segundos y
actualizar una etiqueta "Tiempo: Xs". Si llega a 0, responde automáticamente
como incorrecta.

### 4.4 Guardar el récord (mejor puntaje)

**Archivo**: `src/penguin_english/utilidades/puntuacion.py` y
`src/penguin_english/interfaz/menu.py`

**Qué hacer**: guarda el máximo de `puntos` en un archivo (como en 4.1) y
muestra "Récord: X" en el encabezado o en el menú.

### 4.5 Pronunciar las palabras (texto a voz)

**Archivo**: `src/penguin_english/interfaz/vocabulario.py`

**Qué hacer**: en `crear_tarjeta_palabra`, agrega un botón "🔊" que
reproduzca la pronunciación. En Windows puedes usar el módulo `pyttsx3`
(instalable con pip) o `win32com`. En Linux, `espeak` desde la terminal.

### 4.6 Sonido de "ganar" al terminar una actividad

**Hecho.** `sonido_ganar()` se llama junto a `sumar_bonificacion()` en
trivia, completar, ordenar y memoria.

### 4.7 Mostrar la palabra completa en el feedback de completar

**Archivo**: `src/penguin_english/interfaz/completar.py`

**Qué hacer**: en `mostrar_feedback`, la etiqueta de la palabra aún muestra
el guion bajo (`_`). Cámbiala para que muestre la palabra completa cuando
`respondida` sea `True`:

```python
texto_palabra = pregunta["palabra"] if respondida else palabra_mostrada
```

### 4.8 Validar el nombre con reglas nuevas

**Archivo**: `src/penguin_english/interfaz/inicio.py`

**Qué hacer**: en la función `comenzar()`, agrega más validaciones: nombre
mínimo de 2 letras, sin números, etc. Muestra el error en `etiqueta_error`.

### 4.9 Reordenar las opciones en cada partida (ya implementado en trivia)

Si quieres el mismo efecto en completar u ordenar, revisa cómo `juegos/trivia.py`
copia y desordena las opciones con `random.shuffle`.

---

## 5. Nuevas actividades

Agregar una actividad nueva (ej. "Sopa de letras", "Ahorcado") implica:

1. **Lógica** (sin interfaz): crear `src/penguin_english/juegos/sopa.py` con
   las funciones que generan y validan el juego.
2. **Pantalla**: crear `src/penguin_english/interfaz/sopa.py` con una función
   `mostrar_sopa(ventana, nombre_jugador, ...)` que siga el patrón de las
   otras pantallas (encabezado + título + widgets + `guardar_pantalla`).
3. **Registro**: en `src/penguin_english/interfaz/menu.py`:
   - Agregar la tupla a `ACTIVIDADES`.
   - Agregar la condición en `elegir_actividad`.
   - Crear `iniciar_sopa()` que prepare el estado inicial.
4. **Progreso**: incrementar `TOTAL_ACTIVIDADES` en
   `src/penguin_english/utilidades/puntuacion.py`.
5. **Tests**: crear `tests/test_sopa.py` para la lógica y un test de
   interfaz en `tests/test_ui_ux.py` (o el archivo visual).

---

## 6. Publicación y distribución

### 6.1 Crear un ejecutable de Windows (.exe)

Desde Linux (esta máquina), Docker + Wine + PyInstaller:

```bash
bash scripts/empaquetar.sh
```

El archivo para enviar es `dist/PenguinEnglish-windows.zip` (no el `.exe`
suelto: hace falta `_internal`). En Windows se descomprime y se abre
`PenguinEnglish/PenguinEnglish.exe`. No hace falta Python.

### 6.2 Subir el juego a internet (GitHub)

- Crea un repositorio y sube el proyecto (recuerda el `.gitignore`).
- Los estudiantes pueden clonarlo: `git clone <url>`.
- Documenta en el README los requisitos (ya están en este proyecto).

---

## 7. Orden sugerido de práctica

Si eres estudiante, te recomendamos este orden de dificultad:

1. **Datos**: agregar palabras (1.1) y preguntas (1.3). No rompe nada y
   aprendes el formato de diccionarios.
2. **Constantes**: cambiar puntos y rondas (sección 2). Aprendes qué es un
   acumulador y cómo se usa.
3. **Temas**: cambiar colores (3.1). Aprendes cómo funciona el diccionario
   de colores y el repintado de pantallas.
4. **Lógica**: agregar validaciones (4.8) o sonidos (4.6). Aprendes a
   leer y modificar funciones existentes.
5. **Funcionalidad**: guardar el progreso (4.1) o temporizador (4.3).
   Aprendes a usar archivos y `after`.
6. **Nueva actividad** (sección 5): el proyecto final. Pones en práctica
   todo: datos, lógica, interfaz, menú y tests.

> **Después de cada cambio**: corre `python -m unittest discover`. Si algo
> se rompe, los tests te dirán qué revisar.
