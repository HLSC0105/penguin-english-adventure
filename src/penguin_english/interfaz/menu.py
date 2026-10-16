"""Menú principal del juego, con las cinco actividades, progreso y CEFR.

Explicación académica
---------------------
Corresponde a ``pseint/menu.psc``: elegir actividad. Aquí además se
elige el nivel CEFR (tres botones; el activo usa el color ``acento``).

Algoritmo de navegación: cada actividad abre ``mostrar_intro``, no el
juego directo. ``_clic_y_pintar`` dispara ``sonido_clic`` en el clic
(si sonara al pintar, cada redibujo pitaría).

Librerías: ``tkinter``; las reglas se importan de ``juegos.*``.
El progreso se lee de ``puntuacion`` (barra y palomitas ✓).
"""

import tkinter as tk

from ..datos.niveles import NIVELES
from ..datos.preguntas import mensaje_pipo
from ..juegos.completar import cantidad_rondas as rondas_completar, crear_pregunta
from ..juegos.memoria import crear_tablero
from ..juegos.ordenar import cantidad_rondas as rondas_ordenar, crear_palabra
from ..juegos.trivia import cantidad_preguntas, obtener_preguntas
from ..utilidades import puntuacion
from ..utilidades.sonidos import sonido_clic
from .ayuda import mostrar_ayuda
from .completar import mostrar_completar
from .componentes import (crear_barra_progreso, crear_boton, crear_encabezado,
                          crear_pipo, crear_titulo, fuente, guardar_pantalla,
                          lienzo, obtener_color, repintar_pantalla)
from .memoria import mostrar_memoria
from .ordenar import mostrar_ordenar
from .trivia import mostrar_trivia
from .vocabulario import mostrar_vocabulario

ACTIVIDADES = [
    ("Aprender vocabulario", "vocabulario"),
    ("Trivia", "trivia"),
    ("Completar palabra", "completar"),
    ("Ordenar palabra", "ordenar"),
    ("Juego de memoria", "memoria"),
]


def mostrar_menu(ventana, nombre_jugador):
    """Dibuja el menú principal del juego."""
    padre = lienzo(ventana)
    ir_al_menu = lambda: repintar_pantalla(ventana, mostrar_menu, nombre_jugador)
    crear_encabezado(ventana, nombre_jugador, ir_al_menu, mostrar_boton_menu=False)
    crear_titulo(padre, "Penguin English Adventure").pack(pady=(10, 4))

    subtitulo = tk.Label(padre, text="Aprende inglés con Pipo",
                         font=fuente(15), bg=obtener_color("fondo"),
                         fg=obtener_color("texto_secundario"))
    subtitulo.pack()

    crear_pipo(padre, mensaje_pipo("saludo"))

    _selector_nivel(padre, ventana, nombre_jugador)

    marco_progreso = tk.Frame(padre, bg=obtener_color("fondo"))
    marco_progreso.pack(pady=(4, 2))
    barra = crear_barra_progreso(marco_progreso,
                                 puntuacion.progreso_porcentaje())
    barra.pack()
    texto_progreso = (
        f"{len(puntuacion.actividades_completadas)} de "
        f"{puntuacion.TOTAL_ACTIVIDADES} actividades completadas "
        f"({puntuacion.progreso_porcentaje()}%)"
    )
    etiqueta_progreso = tk.Label(marco_progreso, text=texto_progreso,
                                 font=fuente(11), bg=obtener_color("fondo"),
                                 fg=obtener_color("texto_secundario"))
    etiqueta_progreso.pack(pady=(4, 0))

    marco_botones = tk.Frame(padre, bg=obtener_color("fondo"))
    marco_botones.pack(pady=8)

    fila = 0
    columna = 0
    for nombre_actividad, clave in ACTIVIDADES:
        texto_boton = nombre_actividad
        if clave in puntuacion.actividades_completadas:
            texto_boton += "  ✓"
        boton = crear_boton(marco_botones, texto_boton,
                            elegir_actividad(ventana, nombre_jugador, clave),
                            ancho=22, alto=2)
        boton.grid(row=fila, column=columna, padx=10, pady=8)
        columna += 1
        if columna == 2:
            columna = 0
            fila += 1

    marco_bajo = tk.Frame(padre, bg=obtener_color("fondo"))
    marco_bajo.pack(pady=(6, 12))
    boton_ayuda = crear_boton(marco_bajo, "¿Cómo jugar?",
                              lambda: _clic_y_pintar(
                                  ventana, mostrar_ayuda, nombre_jugador),
                              ancho=14, alto=1)
    boton_ayuda.pack(side="left", padx=8)
    boton_salir = crear_boton(marco_bajo, "Salir", ventana.destroy,
                              ancho=14, alto=1)
    boton_salir.pack(side="left", padx=8)

    guardar_pantalla(mostrar_menu, nombre_jugador)


def _clic_y_pintar(ventana, funcion, *argumentos):
    """Clic de menú: el WAV suena aquí, no al redibujar la pantalla."""
    sonido_clic()
    repintar_pantalla(ventana, funcion, *argumentos)


def _selector_nivel(padre, ventana, nombre_jugador):
    """Tres botones A1 / A2 / B1; el activo se marca con el acento."""
    marco = tk.Frame(padre, bg=obtener_color("fondo"))
    marco.pack(pady=(2, 4))
    etiqueta = tk.Label(marco, text="Tu nivel de inglés",
                        font=fuente(11), bg=obtener_color("fondo"),
                        fg=obtener_color("texto_secundario"))
    etiqueta.pack(side="left", padx=(0, 10))
    for nivel in NIVELES:
        activo = nivel == puntuacion.nivel_actual

        def elegir(n=nivel):
            puntuacion.establecer_nivel(n)
            _clic_y_pintar(ventana, mostrar_menu, nombre_jugador)

        boton = crear_boton(marco, nivel, elegir, ancho=6, alto=1)
        if activo:
            boton.config(bg=obtener_color("acento"),
                         fg=obtener_color("sobre_acento"),
                         activebackground=obtener_color("acento"),
                         activeforeground=obtener_color("sobre_acento"))
        boton.pack(side="left", padx=4)


def elegir_actividad(ventana, nombre_jugador, clave):
    """Abre la ayuda breve de la actividad antes de empezarla."""
    from .intro import mostrar_intro
    return lambda: _clic_y_pintar(
        ventana, mostrar_intro, nombre_jugador, clave)


def iniciar_vocabulario(ventana, nombre_jugador):
    """Abre la sección de vocabulario y la marca como actividad visitada."""
    puntuacion.completar_actividad("vocabulario")
    repintar_pantalla(ventana, mostrar_vocabulario, nombre_jugador, None, 0)


def iniciar_trivia(ventana, nombre_jugador):
    """Elige preguntas del nivel y abre la trivia."""
    preguntas = obtener_preguntas()
    repintar_pantalla(ventana, mostrar_trivia, nombre_jugador,
                      preguntas, 0, 0, 0, False, None)


def iniciar_completar(ventana, nombre_jugador):
    """Crea la primera pregunta de completar palabra y abre el juego."""
    pregunta = crear_pregunta()
    total = rondas_completar()
    repintar_pantalla(ventana, mostrar_completar, nombre_jugador,
                      0, total, 0, 0, False, pregunta, None)


def iniciar_ordenar(ventana, nombre_jugador):
    """Crea la primera palabra desordenada y abre el juego."""
    palabra = crear_palabra()
    total = rondas_ordenar()
    repintar_pantalla(ventana, mostrar_ordenar, nombre_jugador,
                      0, total, 0, 0, False, palabra)


def iniciar_memoria(ventana, nombre_jugador):
    """Crea el tablero de memoria y abre el juego."""
    tablero = crear_tablero()
    repintar_pantalla(ventana, mostrar_memoria, nombre_jugador,
                      tablero, 0, [], 0, False)
