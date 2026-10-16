"""Pantalla breve de ayuda justo antes de cada actividad.

Explicación académica
---------------------
Pipo explica **esa** actividad (distinto del manual global
``ayuda.py``). El diccionario ``INTROS`` es datos, no un modelo de
lenguaje. Empezar llama a ``iniciar_*`` del menú; Volver no arranca
el juego.

Librería: ``tkinter``. Importa ``iniciar_*`` dentro de la función
para no ciclar con ``menu.py``.
"""

import tkinter as tk

from .componentes import (crear_boton, crear_encabezado, crear_pipo,
                          crear_titulo, fuente, guardar_pantalla, lienzo,
                          obtener_color, repintar_pantalla)

INTROS = {
    "vocabulario": {
        "titulo": "Aprender vocabulario",
        "pipo": (
            "Vas a ver tarjetas con una imagen, la palabra en inglés, "
            "su traducción y un ejemplo. Cambia de categoría o de página "
            "cuando quieras. No hay puntaje aquí: es para estudiar."
        ),
    },
    "trivia": {
        "titulo": "Trivia",
        "pipo": (
            "Te hago preguntas de opción múltiple. Elige una de las cuatro "
            "respuestas. Si aciertas sumas 10 puntos y te explico por qué. "
            "Al terminar hay una bonificación si vas bien."
        ),
    },
    "completar": {
        "titulo": "Completar palabra",
        "pipo": (
            "Verás una palabra en inglés con una letra escondida. "
            "Toca la letra que falta. Solo una de las tres opciones es "
            "la correcta."
        ),
    },
    "ordenar": {
        "titulo": "Ordenar palabra",
        "pipo": (
            "Te muestro las letras de una palabra, pero mezcladas. "
            "Escríbela en el orden correcto y pulsa Comprobar. "
            "Mayúsculas o minúsculas da igual."
        ),
    },
    "memoria": {
        "titulo": "Juego de memoria",
        "pipo": (
            "Voltea dos cartas: una tiene la palabra en inglés y la otra "
            "su imagen. Si forman pareja, se quedan descubiertas. "
            "Si no, se vuelven a tapar. Encuentra todas las parejas."
        ),
    },
}


def mostrar_intro(ventana, nombre_jugador, clave):
    """Explica la actividad y espera Empezar o Volver al menú."""
    from .menu import iniciar_completar, iniciar_memoria, iniciar_ordenar
    from .menu import iniciar_trivia, iniciar_vocabulario, mostrar_menu

    arranques = {
        "vocabulario": iniciar_vocabulario,
        "trivia": iniciar_trivia,
        "completar": iniciar_completar,
        "ordenar": iniciar_ordenar,
        "memoria": iniciar_memoria,
    }
    datos = INTROS[clave]

    ir_al_menu = lambda: repintar_pantalla(ventana, mostrar_menu, nombre_jugador)
    crear_encabezado(ventana, nombre_jugador, ir_al_menu)
    padre = lienzo(ventana)
    crear_titulo(padre, datos["titulo"]).pack(pady=(16, 6))

    aviso = tk.Label(
        padre,
        text="Antes de empezar, esto es lo que vas a hacer:",
        font=fuente(13),
        bg=obtener_color("fondo"),
        fg=obtener_color("texto_secundario"),
    )
    aviso.pack(pady=(0, 4))

    crear_pipo(padre, datos["pipo"], ancho_burbuja=560)

    marco = tk.Frame(padre, bg=obtener_color("fondo"))
    marco.pack(pady=16)
    crear_boton(
        marco, "Empezar",
        lambda: arranques[clave](ventana, nombre_jugador),
        ancho=16, alto=2,
    ).pack(side="left", padx=10)
    crear_boton(marco, "Volver al menú", ir_al_menu, ancho=16, alto=2).pack(
        side="left", padx=10)

    guardar_pantalla(mostrar_intro, nombre_jugador, clave)
