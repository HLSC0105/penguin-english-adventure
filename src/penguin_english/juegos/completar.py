"""Lógica de completar palabras: falta una letra y hay que elegirla.

Explicación académica
---------------------
Algoritmo: elegir una palabra jugable, ocultar **una** posición, armar
tres letras (la correcta + dos distractoras distintas) y barajarlas.
En B1 no se oculta la inicial: el hueco es más difícil.

``mostrar_palabra_con_espacios`` es un recorrido O(L) que sustituye un
índice por ``_`` y une con espacios (``A P P _ E``).

Librería: ``random`` (choice, randint, shuffle). Sin Tkinter.
Precondición: hay al menos una palabra jugable en el nivel.
"""

import random

from ..datos.niveles import parametros_nivel, palabras_jugables

TOTAL_RONDAS = 8  # valor A2; la cantidad real sale de parametros_nivel
LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def cantidad_rondas(nivel=None):
    """Rondas de completar según el nivel CEFR."""
    return parametros_nivel(nivel)["completar"]


def crear_pregunta(nivel=None):
    """Crea una pregunta de completar palabra con 3 opciones de letra.

    En B1 no se oculta la primera letra (hueco más difícil).
    Precondición: hay al menos una palabra jugable en el nivel.
    """
    palabras = palabras_jugables(nivel)
    palabra_info = random.choice(palabras)
    palabra = palabra_info["ingles"].upper()
    permite_inicial = parametros_nivel(nivel)["hueco_inicial_permitido"]
    if not permite_inicial and len(palabra) > 1:
        posicion = random.randint(1, len(palabra) - 1)
    else:
        posicion = random.randint(0, len(palabra) - 1)
    letra_correcta = palabra[posicion]

    opciones = [letra_correcta]
    while len(opciones) < 3:
        letra = random.choice(LETRAS)
        if letra not in opciones:
            opciones.append(letra)
    random.shuffle(opciones)

    return {
        "palabra": palabra,
        "posicion": posicion,
        "opciones": opciones,
        "correcta": letra_correcta,
    }


def mostrar_palabra_con_espacios(palabra, posicion):
    """Devuelve la palabra separada por espacios y con _ en la letra que falta.

    Ejemplo: palabra "APPLE" y posición 3 -> "A P P _ E"
    """
    letras = []
    for indice in range(len(palabra)):
        if indice == posicion:
            letras.append("_")
        else:
            letras.append(palabra[indice])
    return " ".join(letras)
