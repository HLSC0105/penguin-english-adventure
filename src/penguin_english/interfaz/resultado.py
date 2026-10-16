"""Pantalla de resultado que se muestra al terminar una actividad.

Explicación académica
---------------------
Resume aciertos y puntos. El umbral 100 % / ≥60 % elige el mensaje
de Pipo (``perfecto``, ``felicitaciones``, ``animo``). La
bonificación **ya está sumada** antes de entrar: si se sumara aquí,
alternar el tema (que redibuja) la duplicaría.

``LienzoCelebracion`` reutiliza el puente pygame→PPM. Librería:
``tkinter`` + pygame opcional.
"""

import tkinter as tk

from ..datos.preguntas import mensaje_pipo
from ..utilidades import puntuacion
from ..utilidades.puntuacion import PUNTOS_BONIFICACION
from .componentes import (crear_boton, crear_encabezado, crear_pipo,
                          crear_titulo, fuente, guardar_pantalla, lienzo,
                          obtener_color, repintar_pantalla)
from .lienzo_pygame import LienzoCelebracion


def mostrar_resultado(ventana, nombre_jugador, titulo, puntos_actividad,
                      total_preguntas, correctas):
    """Muestra el resumen de una actividad terminada."""
    from .menu import mostrar_menu

    ir_al_menu = lambda: repintar_pantalla(ventana, mostrar_menu, nombre_jugador)
    crear_encabezado(ventana, nombre_jugador, ir_al_menu)
    padre = lienzo(ventana)
    crear_titulo(padre, titulo).pack(pady=(16, 8))

    if total_preguntas > 0:
        porcentaje = round(correctas * 100 / total_preguntas)
    else:
        porcentaje = 100
    if porcentaje == 100:
        mensaje = mensaje_pipo("perfecto")
    elif porcentaje >= 60:
        mensaje = mensaje_pipo("felicitaciones")
    else:
        mensaje = mensaje_pipo("animo")
    crear_pipo(padre, mensaje)

    LienzoCelebracion(padre).pack(pady=4)

    marco = tk.Frame(padre, bg=obtener_color("panel"),
                     highlightthickness=1,
                     highlightbackground=obtener_color("borde"))
    marco.pack(pady=12, padx=40)

    lineas = [
        (f"Respuestas correctas: {correctas} de {total_preguntas} ({porcentaje}%)",
         obtener_color("texto")),
        (f"Puntos en la actividad: {puntos_actividad}", obtener_color("texto")),
        (f"Bonificación por terminar: +{PUNTOS_BONIFICACION} puntos",
         obtener_color("acento")),
        (f"Tus puntos totales: {puntuacion.puntos}", obtener_color("acento")),
    ]
    for texto, color in lineas:
        tk.Label(marco, text=texto, font=fuente(14),
                 bg=obtener_color("panel"), fg=color,
                 justify="center").pack(padx=28, pady=4)

    boton = crear_boton(padre, "Volver al menú", ir_al_menu, ancho=20)
    boton.pack(pady=10)

    guardar_pantalla(mostrar_resultado, nombre_jugador, titulo,
                     puntos_actividad, total_preguntas, correctas)
