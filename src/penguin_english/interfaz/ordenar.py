"""Pantalla de ordenar palabra: escribir la palabra con letras desordenadas.

Explicación académica
---------------------
El jugador escribe en un ``Entry`` (como ``Leer`` en PSeInt). Enter
dispara el mismo ``comprobar`` que el botón. Vacío → aviso; si hay
texto, ``validar_palabra`` ignora mayúsculas y espacios.

Librería: ``tkinter``. El anagrama lo arma ``juegos.ordenar``, no esta
pantalla.
"""

import tkinter as tk

from ..juegos.ordenar import crear_palabra, validar_palabra
from ..utilidades import puntuacion
from ..utilidades.sonidos import sonido_correcto, sonido_error, sonido_ganar
from .componentes import (crear_barra_progreso, crear_boton, crear_encabezado,
                          crear_pipo, crear_titulo, fuente, guardar_pantalla,
                          lienzo, obtener_color, repintar_pantalla)
from .resultado import mostrar_resultado


def mostrar_ordenar(ventana, nombre_jugador, ronda, total, aciertos,
                    puntos_actividad, respondida, palabra, ultima_correcta=None):
    """Dibuja la pantalla de ordenar palabra."""
    # Importamos el menú aquí dentro para evitar un ciclo de importaciones.
    from .menu import mostrar_menu

    ir_al_menu = lambda: repintar_pantalla(ventana, mostrar_menu, nombre_jugador)
    crear_encabezado(ventana, nombre_jugador, ir_al_menu)
    padre = lienzo(ventana)

    crear_titulo(padre, "Ordenar palabra").pack(pady=(16, 2))
    etiqueta_numero = tk.Label(padre, text=f"Ronda {ronda + 1} de {total}",
                               font=fuente(13), bg=obtener_color("fondo"),
                               fg=obtener_color("texto_secundario"))
    etiqueta_numero.pack()

    barra = crear_barra_progreso(padre, round((ronda + 1) * 100 / total))
    barra.pack(pady=(8, 12))
    try:
        from .animaciones import animar_barra
        ventana.after(1, lambda b=barra, v=round((ronda + 1) * 100 / total):
                      animar_barra(b, v))
    except Exception:
        pass

    # Las letras desordenadas, separadas para que se lean fácil.
    letras_desordenadas = " ".join(palabra["desordenada"])
    etiqueta_palabra = tk.Label(padre, text=letras_desordenadas,
                                font=fuente(30, True),
                                bg=obtener_color("fondo"),
                                fg=obtener_color("acento"))
    etiqueta_palabra.pack(pady=(0, 14))

    if not respondida:
        mostrar_entrada(ventana, nombre_jugador, ronda, total, aciertos,
                        puntos_actividad, palabra)
    else:
        mostrar_feedback(ventana, nombre_jugador, ronda, total, aciertos,
                         puntos_actividad, palabra, ultima_correcta)

    guardar_pantalla(mostrar_ordenar, nombre_jugador, ronda, total, aciertos,
                     puntos_actividad, respondida, palabra, ultima_correcta)


def mostrar_entrada(ventana, nombre_jugador, ronda, total, aciertos,
                    puntos_actividad, palabra):
    """Muestra el campo de texto y el botón para comprobar la palabra."""
    # Pipo da la instrucción.
    padre = lienzo(ventana)
    burbuja = crear_pipo(padre,
                         "Escribe la palabra correcta usando las letras "
                         "desordenadas.", ancho_burbuja=520)

    marco_entrada = tk.Frame(padre, bg=obtener_color("fondo"))
    marco_entrada.pack(pady=14)

    entrada = tk.Entry(marco_entrada, font=fuente(16), width=18,
                       justify="center", relief="solid", bd=2,
                       highlightthickness=0)
    entrada.pack(pady=(0, 10))
    entrada.focus_set()

    def comprobar():
        """Valida la palabra escrita y muestra el resultado."""
        intento = entrada.get()
        if intento.strip() == "":
            burbuja.config(text="Escribe una palabra antes de comprobar.")
            entrada.focus_set()
            return
        es_correcta = validar_palabra(intento, palabra["original"])
        ganados = puntuacion.sumar_respuesta(es_correcta)
        if es_correcta:
            sonido_correcto()
        else:
            sonido_error()
        repintar_pantalla(ventana, mostrar_ordenar, nombre_jugador, ronda,
                          total, aciertos + (1 if es_correcta else 0),
                          puntos_actividad + ganados, True, palabra,
                          es_correcta)

    boton = crear_boton(marco_entrada, "Comprobar", comprobar, ancho=14)
    boton.pack()
    ventana.bind("<Return>", lambda evento: comprobar())


def mostrar_feedback(ventana, nombre_jugador, ronda, total, aciertos,
                     puntos_actividad, palabra, ultima_correcta):
    """Muestra la palabra correcta y el resultado de la ronda."""
    if ultima_correcta:
        texto_feedback = "¡Correcto! +10 puntos"
        color = obtener_color("correcto")
    else:
        texto_feedback = "¡Incorrecto!"
        color = obtener_color("incorrecto")

    padre = lienzo(ventana)
    etiqueta = tk.Label(padre, text=texto_feedback, font=fuente(15, True),
                        bg=obtener_color("fondo"), fg=color)
    etiqueta.pack(pady=(12, 0))

    # Pipo muestra la palabra correcta.
    crear_pipo(padre,
               f"La palabra correcta era: {palabra['original']}",
               ancho_burbuja=520)

    def siguiente():
        """Avanza a la siguiente ronda o termina el juego."""
        if ronda + 1 < total:
            nueva_palabra = crear_palabra()
            repintar_pantalla(ventana, mostrar_ordenar, nombre_jugador,
                              ronda + 1, total, aciertos, puntos_actividad,
                              False, nueva_palabra, None)
        else:
            puntuacion.completar_actividad("ordenar")
            puntuacion.sumar_bonificacion()
            sonido_ganar()
            repintar_pantalla(ventana, mostrar_resultado, nombre_jugador,
                              "¡Ordenar palabra terminado!",
                              puntos_actividad, total, aciertos)

    boton_siguiente = crear_boton(padre, "Siguiente", siguiente, ancho=16)
    boton_siguiente.pack(pady=12)