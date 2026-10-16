"""Pantalla de completar palabra: elegir la letra que falta.

Explicación académica
---------------------
Muestra ``mostrar_palabra_con_espacios`` (la palabra con ``_``) y
tres botones de letra. La pregunta nueva de cada ronda la crea
``juegos.completar.crear_pregunta`` (incluye la regla B1 de no
ocultar la inicial). Librería: ``tkinter``.
"""

import tkinter as tk

from ..juegos.completar import crear_pregunta, mostrar_palabra_con_espacios
from ..utilidades import puntuacion
from ..utilidades.sonidos import sonido_correcto, sonido_error, sonido_ganar
from .componentes import (crear_barra_progreso, crear_boton, crear_encabezado,
                          crear_pipo, crear_titulo, fuente, guardar_pantalla,
                          lienzo, obtener_color, primer_boton, repintar_pantalla)
from .resultado import mostrar_resultado


def mostrar_completar(ventana, nombre_jugador, ronda, total, aciertos,
                      puntos_actividad, respondida, pregunta, elegida):
    """Dibuja la pantalla de completar palabra."""
    # Importamos el menú aquí dentro para evitar un ciclo de importaciones.
    from .menu import mostrar_menu

    ir_al_menu = lambda: repintar_pantalla(ventana, mostrar_menu, nombre_jugador)
    crear_encabezado(ventana, nombre_jugador, ir_al_menu)
    padre = lienzo(ventana)

    crear_titulo(padre, "Completar palabra").pack(pady=(16, 2))
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

    # La palabra con un guion bajo en la letra que falta.
    palabra_mostrada = mostrar_palabra_con_espacios(pregunta["palabra"],
                                                    pregunta["posicion"])
    etiqueta_palabra = tk.Label(padre, text=palabra_mostrada,
                                font=fuente(30, True),
                                bg=obtener_color("fondo"),
                                fg=obtener_color("acento"))
    etiqueta_palabra.pack(pady=(0, 16))

    marco_opciones = tk.Frame(padre, bg=obtener_color("fondo"))
    marco_opciones.pack()

    if not respondida:
        mostrar_opciones(marco_opciones, ventana, nombre_jugador, ronda,
                         total, aciertos, puntos_actividad, pregunta)
    else:
        mostrar_feedback(marco_opciones, ventana, nombre_jugador, ronda,
                         total, aciertos, puntos_actividad, pregunta, elegida)

    guardar_pantalla(mostrar_completar, nombre_jugador, ronda, total,
                     aciertos, puntos_actividad, respondida, pregunta, elegida)


def mostrar_opciones(marco, ventana, nombre_jugador, ronda, total, aciertos,
                     puntos_actividad, pregunta):
    """Muestra los 3 botones con las letras posibles."""
    opciones = pregunta["opciones"]

    def responder(letra):
        """Valida la letra, suma puntos y muestra la palabra completa."""
        es_correcta = (letra == pregunta["correcta"])
        ganados = puntuacion.sumar_respuesta(es_correcta)
        if es_correcta:
            sonido_correcto()
        else:
            sonido_error()
        repintar_pantalla(ventana, mostrar_completar, nombre_jugador, ronda,
                          total, aciertos + (1 if es_correcta else 0),
                          puntos_actividad + ganados, True, pregunta, letra)

    columna = 0
    for letra in opciones:
        boton = crear_boton(marco, letra,
                            lambda opcion=letra: responder(opcion),
                            ancho=8, alto=2)
        boton.grid(row=0, column=columna, padx=14, pady=8)
        columna += 1


def mostrar_feedback(marco, ventana, nombre_jugador, ronda, total, aciertos,
                     puntos_actividad, pregunta, elegida):
    """Muestra las letras coloreadas y la palabra completa."""
    opciones = pregunta["opciones"]

    columna = 0
    for letra in opciones:
        color = obtener_color("tarjeta")
        if letra == pregunta["correcta"]:
            color = obtener_color("correcto")
        elif letra == elegida:
            color = obtener_color("incorrecto")
        boton = crear_boton(marco, letra, lambda: None, ancho=8, alto=2)
        boton.config(bg=color, activebackground=color)
        boton.grid(row=0, column=columna, padx=14, pady=8)
        columna += 1

    # Pulsamos la letra correcta para reforzar visualmente el acierto.
    _pulsar_letra_correcta(ventana, marco, pregunta["correcta"])

    if elegida == pregunta["correcta"]:
        texto_feedback = "¡Correcto! +10 puntos"
        color = obtener_color("correcto")
    else:
        texto_feedback = f"¡Incorrecto! La letra era: {pregunta['correcta']}"
        color = obtener_color("incorrecto")

    padre = lienzo(ventana)
    etiqueta = tk.Label(padre, text=texto_feedback, font=fuente(15, True),
                        bg=obtener_color("fondo"), fg=color)
    etiqueta.pack(pady=(12, 0))

    # Pipo muestra la palabra completa.
    crear_pipo(padre,
               f"La palabra completa es: {pregunta['palabra']}",
               ancho_burbuja=520)

    def siguiente():
        """Avanza a la siguiente ronda o termina el juego."""
        if ronda + 1 < total:
            nueva_pregunta = crear_pregunta()
            repintar_pantalla(ventana, mostrar_completar, nombre_jugador,
                              ronda + 1, total, aciertos, puntos_actividad,
                              False, nueva_pregunta, None)
        else:
            puntuacion.completar_actividad("completar")
            puntuacion.sumar_bonificacion()
            sonido_ganar()
            repintar_pantalla(ventana, mostrar_resultado, nombre_jugador,
                              "¡Completar palabra terminado!",
                              puntos_actividad, total, aciertos)

    boton_siguiente = crear_boton(padre, "Siguiente", siguiente, ancho=16)
    boton_siguiente.pack(pady=12)


def _pulsar_letra_correcta(ventana, marco, letra_correcta):
    """Pulsa la letra correcta del feedback como celebración."""
    try:
        from .animaciones import pulsar_widget, interpolar_color
    except Exception:
        return
    for hijo in marco.winfo_children():
        boton = primer_boton(hijo)
        if boton is not None and boton.cget("text") == letra_correcta:
            try:
                base = obtener_color("correcto")
                brillo = interpolar_color(base, "#FFFFFF", 0.6)
            except Exception:
                return
            ventana.after(1, lambda b=boton, a=base, c=brillo:
                          pulsar_widget(b, a, c, veces=2))
            return
