"""Lógica de ordenar letras: hay que escribir la palabra correcta.

Explicación académica
---------------------
Algoritmo del anagrama: ``list`` + ``random.shuffle`` en un ``while``
hasta que el resultado **no** coincida con el original. Si no, el
ejercicio sería tramposo. Complejidad esperada O(L) por intento.

``validar_palabra`` normaliza con ``strip`` y ``upper``: ``" apple "``
y ``"APPLE"`` cuentan. Librería: ``random``. Sin Tkinter.
"""

import random

from ..datos.niveles import parametros_nivel, palabras_jugables

TOTAL_RONDAS = 8  # valor A2; la cantidad real sale de parametros_nivel


def cantidad_rondas(nivel=None):
    """Rondas de ordenar según el nivel CEFR."""
    return parametros_nivel(nivel)["ordenar"]


def crear_palabra(nivel=None):
    """Elige una palabra del nivel y desordena sus letras.

    El ciclo while evita el caso (poco probable) de que el shuffle
    deje la palabra igual. Complejidad esperada: O(L) por intento.
    """
    palabra_info = random.choice(palabras_jugables(nivel))
    original = palabra_info["ingles"].upper()

    letras = list(original)
    while True:
        random.shuffle(letras)
        desordenada = "".join(letras)
        if desordenada != original:
            break

    return {"original": original, "desordenada": desordenada}


def validar_palabra(palabra_intento, palabra_original):
    """Devuelve True si el intento es la palabra correcta.

    Quitamos los espacios y convertimos a mayúsculas para que
    " apple " y "APPLE" también se acepten.
    """
    intento = palabra_intento.strip().upper()
    return intento == palabra_original.upper()
