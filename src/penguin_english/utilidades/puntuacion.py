"""Puntos, aciertos, progreso y nivel CEFR del jugador.

Explicación académica
---------------------
Equivale a los acumuladores de ``pseint/puntos.psc``. Son variables
de **módulo** (globales) porque el progreso es de la sesión: no hay
archivo ni base de datos. Al cerrar la ventana, todo vuelve a cero.

Algoritmos: suma (+10 / +20); porcentaje con guarda contra división
por cero; conjunto de actividades (lista sin repetir claves).

No usa librerías externas. ``nivel_actual`` lo leen ``datos.niveles``
y el menú. Precondición de ``sumar_respuesta``: una llamada por
intento. Postcondición: ``preguntas_respondidas`` aumenta en 1.
"""

PUNTOS_CORRECTA = 10
PUNTOS_BONIFICACION = 20
TOTAL_ACTIVIDADES = 5
NIVEL_POR_DEFECTO = "A2"

puntos = 0
preguntas_respondidas = 0
respuestas_correctas = 0
actividades_completadas = []
nivel_actual = NIVEL_POR_DEFECTO


def reiniciar_puntuacion():
    """Pone todas las variables del jugador en cero y el nivel en A2."""
    global puntos, preguntas_respondidas, respuestas_correctas
    global actividades_completadas, nivel_actual
    puntos = 0
    preguntas_respondidas = 0
    respuestas_correctas = 0
    actividades_completadas = []
    nivel_actual = NIVEL_POR_DEFECTO


def establecer_nivel(nivel):
    """Cambia el nivel CEFR si es A1, A2 o B1."""
    global nivel_actual
    if nivel in ("A1", "A2", "B1"):
        nivel_actual = nivel
    return nivel_actual


def sumar_respuesta(es_correcta):
    """Suma los puntos de una respuesta y devuelve cuántos puntos ganó."""
    global puntos, preguntas_respondidas, respuestas_correctas
    preguntas_respondidas += 1
    if es_correcta:
        respuestas_correctas += 1
        puntos += PUNTOS_CORRECTA
        return PUNTOS_CORRECTA
    return 0


def sumar_bonificacion():
    """Da una bonificación por terminar una actividad completa."""
    global puntos
    puntos += PUNTOS_BONIFICACION


def porcentaje_aciertos():
    """Calcula el porcentaje de respuestas correctas."""
    if preguntas_respondidas == 0:
        return 0
    return round(respuestas_correctas * 100 / preguntas_respondidas)


def completar_actividad(nombre_actividad):
    """Marca una actividad como completada (solo la primera vez)."""
    if nombre_actividad not in actividades_completadas:
        actividades_completadas.append(nombre_actividad)


def progreso_porcentaje():
    """Calcula el porcentaje de actividades completadas."""
    return round(len(actividades_completadas) * 100 / TOTAL_ACTIVIDADES)
