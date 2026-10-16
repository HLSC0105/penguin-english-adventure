"""Pantalla de ayuda: explica cada actividad, el CEFR y los puntos.

Explicación académica
---------------------
Manual estático (tres bloques de texto). No cambia el puntaje. El
importe de ``mostrar_menu`` va **dentro** de la función: ``menu.py``
ya importa este módulo; un importe mutuo al tope del archivo sería
un ciclo.

Librería: ``tkinter``. Pipo usa ``mensaje_pipo("ayuda")`` (``random``).
"""

import tkinter as tk

from ..datos.preguntas import mensaje_pipo
from .componentes import (crear_boton, crear_encabezado, crear_pipo,
                          crear_tarjeta, crear_titulo, fuente, guardar_pantalla,
                          lienzo, obtener_color, repintar_pantalla)


def mostrar_ayuda(ventana, nombre_jugador):
    """Dibuja la pantalla con las instrucciones del juego."""
    from .menu import mostrar_menu

    ir_al_menu = lambda: repintar_pantalla(ventana, mostrar_menu, nombre_jugador)
    crear_encabezado(ventana, nombre_jugador, ir_al_menu)
    padre = lienzo(ventana)
    crear_titulo(padre, "¿Cómo jugar?").pack(pady=(16, 8))

    crear_pipo(padre, mensaje_pipo("ayuda"))

    sombra, marco_texto = crear_tarjeta(padre, offset=5, color="panel")
    sombra.pack(pady=12, padx=40, fill="x")

    bloques = [
        ("Actividades",
         "1. Aprender vocabulario: mira las palabras y sus imágenes.\n"
         "2. Trivia: responde preguntas de opción múltiple.\n"
         "3. Completar palabra: elige la letra que falta.\n"
         "4. Ordenar palabra: escribe la palabra con sus letras desordenadas.\n"
         "5. Juego de memoria: encuentra cada palabra con su imagen."),
        ("Puntos",
         "Cada respuesta correcta vale 10 puntos y, al terminar una\n"
         "actividad, ganas 20 puntos de bonificación. El progreso está\n"
         "en la barra del menú."),
        ("Niveles CEFR",
         "A1: palabras del día a día. A2: escuela, casa y clima.\n"
         "B1: ideas más abstractas y collocations. El nivel más alto\n"
         "incluye el vocabulario de los anteriores (filtro acumulativo)."),
    ]
    for titulo, cuerpo in bloques:
        tk.Label(marco_texto, text=titulo, font=fuente(14, True),
                 bg=obtener_color("panel"), fg=obtener_color("acento"),
                 anchor="w", justify="left").pack(fill="x", padx=24, pady=(12, 0))
        tk.Label(marco_texto, text=cuerpo, font=fuente(13),
                 bg=obtener_color("panel"), fg=obtener_color("texto"),
                 justify="left", anchor="w").pack(fill="x", padx=24, pady=(2, 8))

    boton = crear_boton(padre, "Volver al menú", ir_al_menu, ancho=18)
    boton.pack(pady=12)

    guardar_pantalla(mostrar_ayuda, nombre_jugador)
