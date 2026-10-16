"""Lógica de la trivia: seleccionar preguntas y validar respuestas.

Explicación académica
---------------------
Traduce el ``Para pregunta ← 1 Hasta N`` de ``pseint/trivia.psc`` a dos
funciones puras. No hay Tkinter: la pantalla solo llama a estas APIs.

Algoritmo aportado: ``random.sample`` elige k preguntas **sin repetir**
(O(k)); cada una se copia con ``dict`` y sus opciones se barajan para
no mutar el banco. ``validar_respuesta`` es una igualdad de cadenas.

Librería: ``random`` (stdlib). El filtro CEFR vive en ``datos.niveles``.
Precondición: el banco del nivel tiene al menos k ítems (k se recorta
con ``min``). Postcondición: el módulo ``datos.preguntas`` no cambia.
"""

import random

from ..datos.niveles import parametros_nivel, preguntas_del_nivel

CANTIDAD_PREGUNTAS = 10  # valor A2; la cantidad real sale de parametros_nivel


def cantidad_preguntas(nivel=None):
    """Cuántas preguntas dura una partida en este nivel."""
    return parametros_nivel(nivel)["trivia"]


def obtener_preguntas(cantidad=None, nivel=None):
    """Elige preguntas al azar del banco del nivel y desordena opciones.

    Copiamos cada pregunta con dict() y list() para no mutar el banco
    original: cada partida debe mostrar las opciones en distinto orden.

    Complejidad: sample es O(k) sobre el banco filtrado.
    """
    banco = preguntas_del_nivel(nivel)
    if cantidad is None:
        cantidad = cantidad_preguntas(nivel)
    cantidad = min(int(cantidad), len(banco))
    seleccionadas = random.sample(banco, cantidad)
    preguntas = []
    for pregunta in seleccionadas:
        copia = dict(pregunta)
        opciones = list(pregunta["opciones"])
        random.shuffle(opciones)
        copia["opciones"] = opciones
        preguntas.append(copia)
    return preguntas


def validar_respuesta(pregunta, respuesta):
    """Devuelve True si la respuesta elegida es la correcta."""
    return respuesta == pregunta["correcta"]
