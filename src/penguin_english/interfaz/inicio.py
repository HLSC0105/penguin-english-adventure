"""Pantalla de inicio: Pipo saluda y el jugador escribe su nombre.

Explicación académica
---------------------
Primera pantalla tras ``crear_ventana``. Algoritmo: leer el ``Entry``,
``strip``; si queda vacío, mostrar error; si no, pasar el nombre al
menú. ``bind("<Return>")`` equivale al ``Leer`` de PSeInt con Enter.

Librería: ``tkinter``. El nombre no se guarda en disco: viaja como
parámetro el resto de la sesión.
"""

import tkinter as tk

from ..datos.niveles import NIVELES
from ..utilidades import puntuacion
from .componentes import (crear_boton, crear_pipo, crear_titulo, fuente,
                          guardar_pantalla, lienzo, obtener_color,
                          repintar_pantalla)
from .menu import mostrar_menu


def mostrar_inicio(ventana):
    """Dibuja la pantalla donde el jugador escribe su nombre."""
    padre = lienzo(ventana)
    crear_titulo(padre, "Penguin English Adventure").pack(pady=(16, 4))

    subtitulo = tk.Label(padre, text="¡Aprende inglés con un pingüino!",
                         font=fuente(15), bg=obtener_color("fondo"),
                         fg=obtener_color("texto_secundario"))
    subtitulo.pack()

    crear_pipo(padre,
               "¡Hola! Soy Pipo. Escribe tu nombre, elige tu nivel y "
               "comencemos a aprender.")

    marco_nombre = tk.Frame(padre, bg=obtener_color("fondo"))
    marco_nombre.pack(pady=10)

    etiqueta = tk.Label(marco_nombre, text="¿Cómo te llamas?",
                        font=fuente(14, True), bg=obtener_color("fondo"),
                        fg=obtener_color("texto"))
    etiqueta.pack(pady=(0, 10))

    entrada = tk.Entry(marco_nombre, font=fuente(16), width=24,
                       justify="center", relief="solid", bd=2,
                       highlightthickness=2,
                       highlightcolor=obtener_color("foco"),
                       highlightbackground=obtener_color("borde"))
    entrada.pack(pady=(0, 10))
    entrada.focus_set()

    etiqueta_error = tk.Label(marco_nombre, text="", font=fuente(12),
                              bg=obtener_color("fondo"),
                              fg=obtener_color("incorrecto"))
    etiqueta_error.pack()

    marco_nivel = tk.Frame(marco_nombre, bg=obtener_color("fondo"))
    marco_nivel.pack(pady=8)
    tk.Label(marco_nivel, text="Nivel CEFR", font=fuente(11),
             bg=obtener_color("fondo"),
             fg=obtener_color("texto_secundario")).pack(side="left", padx=(0, 8))

    eleccion = {"nivel": puntuacion.nivel_actual}

    def pintar_niveles():
        for hijo in list(marco_nivel.winfo_children())[1:]:
            hijo.destroy()
        for nivel in NIVELES:
            activo = nivel == eleccion["nivel"]

            def elegir(n=nivel):
                eleccion["nivel"] = n
                puntuacion.establecer_nivel(n)
                pintar_niveles()

            boton = crear_boton(marco_nivel, nivel, elegir, ancho=6, alto=1)
            if activo:
                boton.config(bg=obtener_color("acento"),
                             fg=obtener_color("sobre_acento"),
                             activebackground=obtener_color("acento"),
                             activeforeground=obtener_color("sobre_acento"))
            boton.pack(side="left", padx=4)

    pintar_niveles()

    def comenzar():
        nombre = entrada.get().strip()
        if nombre == "":
            etiqueta_error.config(text="Escribe tu nombre para continuar.")
            return
        puntuacion.establecer_nivel(eleccion["nivel"])
        repintar_pantalla(ventana, mostrar_menu, nombre)

    boton = crear_boton(marco_nombre, "¡Comenzar!", comenzar, ancho=16)
    boton.pack(pady=8)
    ventana.bind("<Return>", lambda evento: comenzar())

    guardar_pantalla(mostrar_inicio)
