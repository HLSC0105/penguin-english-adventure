"""Pantalla de trivia: preguntas de opción múltiple.

Explicación académica
---------------------
La UI no elige preguntas: recibe la lista de ``obtener_preguntas``.
El **estado** (índice, aciertos, respondida, elegida) viaja en
parámetros; al pulsar una opción se vuelve a llamar ``mostrar_trivia``
con esos valores nuevos. Equivale a un ciclo PSeInt desenrollado en
callbacks.

Librerías: ``tkinter``; validación en ``juegos.trivia``; puntos y
WAV en utilidades. El pulso verde es ``pulsar_widget`` (``after``).
"""

import tkinter as tk

from ..juegos.trivia import validar_respuesta
from ..utilidades import puntuacion
from ..utilidades.sonidos import sonido_correcto, sonido_error, sonido_ganar
from .componentes import (crear_barra_progreso, crear_boton, crear_encabezado,
                          crear_pipo, crear_titulo, fuente, guardar_pantalla,
                          lienzo, obtener_color, primer_boton, repintar_pantalla)
from .resultado import mostrar_resultado


def mostrar_trivia(ventana, nombre_jugador, preguntas, indice, aciertos,
                   puntos_actividad, respondida, elegida):
    """Dibuja la pantalla de trivia con la pregunta actual."""
    # Importamos el menú aquí dentro para evitar un ciclo de importaciones.
    from .menu import mostrar_menu

    ir_al_menu = lambda: repintar_pantalla(ventana, mostrar_menu, nombre_jugador)
    crear_encabezado(ventana, nombre_jugador, ir_al_menu)
    padre = lienzo(ventana)

    pregunta = preguntas[indice]
    total = len(preguntas)

    crear_titulo(padre, "Trivia").pack(pady=(16, 2))
    etiqueta_numero = tk.Label(padre,
                               text=f"Pregunta {indice + 1} de {total}",
                               font=fuente(13), bg=obtener_color("fondo"),
                               fg=obtener_color("texto_secundario"))
    etiqueta_numero.pack()

    barra = crear_barra_progreso(padre,
                                 round((indice + 1) * 100 / total))
    barra.pack(pady=(8, 12))

    etiqueta_pregunta = tk.Label(padre, text=pregunta["pregunta"],
                                 font=fuente(18, True),
                                 bg=obtener_color("fondo"),
                                 fg=obtener_color("texto"),
                                 wraplength=720, justify="center")
    etiqueta_pregunta.pack(pady=(0, 16))

    # Animamos el crecimiento de la barra de progreso.
    try:
        from .animaciones import animar_barra
        valor_objetivo = round((indice + 1) * 100 / total)
        ventana.after(1, lambda b=barra, v=valor_objetivo:
                      animar_barra(b, v))
    except Exception:
        pass

    marco_opciones = tk.Frame(padre, bg=obtener_color("fondo"))
    marco_opciones.pack()

    if not respondida:
        mostrar_opciones(marco_opciones, ventana, nombre_jugador, preguntas,
                         indice, aciertos, puntos_actividad, pregunta)
    else:
        mostrar_feedback(marco_opciones, ventana, nombre_jugador, preguntas,
                         indice, aciertos, puntos_actividad, pregunta, elegida)

    guardar_pantalla(mostrar_trivia, nombre_jugador, preguntas, indice,
                     aciertos, puntos_actividad, respondida, elegida)


def mostrar_opciones(marco, ventana, nombre_jugador, preguntas, indice,
                     aciertos, puntos_actividad, pregunta):
    """Muestra los 4 botones de respuesta de la pregunta actual."""
    opciones = pregunta["opciones"]
    letras = ["A", "B", "C", "D"]

    def responder(texto_opcion):
        """Valida la respuesta, suma puntos y muestra la explicación."""
        es_correcta = validar_respuesta(pregunta, texto_opcion)
        ganados = puntuacion.sumar_respuesta(es_correcta)
        if es_correcta:
            sonido_correcto()
        else:
            sonido_error()
        repintar_pantalla(
            ventana, mostrar_trivia, nombre_jugador, preguntas, indice,
            aciertos + (1 if es_correcta else 0),
            puntos_actividad + ganados, True, texto_opcion)

    fila = 0
    columna = 0
    for posicion in range(4):
        boton = crear_boton(marco, f"{letras[posicion]}. {opciones[posicion]}",
                            lambda texto=opciones[posicion]: responder(texto),
                            ancho=24, alto=2)
        boton.grid(row=fila, column=columna, padx=10, pady=8)
        columna += 1
        if columna == 2:
            columna = 0
            fila += 1


def _pulsar_boton_correcto(ventana, marco, opciones, pregunta):
    """Pulsamos el botón de la respuesta correcta como celebración."""
    try:
        from .animaciones import pulsar_widget, interpolar_color
    except Exception:
        return
    indice_correcto = None
    for i, op in enumerate(opciones):
        if op == pregunta["correcta"]:
            indice_correcto = i
            break
    if indice_correcto is None:
        return
    letras = ["A", "B", "C", "D"]
    prefijo = letras[indice_correcto] + "."
    for hijo in marco.winfo_children():
        boton = primer_boton(hijo)
        if boton is not None and boton.cget("text").startswith(prefijo):
            try:
                base = obtener_color("correcto")
                brillo = interpolar_color(base, "#FFFFFF", 0.6)
            except Exception:
                base = "#FFFFFF"
                brillo = "#FFFFFF"
            ventana.after(1, lambda b=boton, a=base, c=brillo:
                          pulsar_widget(b, a, c, veces=2))
            return


def mostrar_feedback(marco, ventana, nombre_jugador, preguntas, indice,
                     aciertos, puntos_actividad, pregunta, elegida):
    """Muestra las opciones coloreadas y la explicación de la respuesta."""
    opciones = pregunta["opciones"]
    letras = ["A", "B", "C", "D"]

    for posicion in range(4):
        opcion = opciones[posicion]
        color = obtener_color("tarjeta")
        if opcion == pregunta["correcta"]:
            color = obtener_color("correcto")
        elif opcion == elegida:
            color = obtener_color("incorrecto")
        boton = crear_boton(marco, f"{letras[posicion]}. {opcion}",
                            lambda: None, ancho=24, alto=2)
        boton.config(bg=color, activebackground=color)
        boton.grid(row=posicion // 2, column=posicion % 2, padx=10, pady=8)

    # Pulsamos el botón de la respuesta correcta para celebrarlo.
    _pulsar_boton_correcto(ventana, marco, opciones, pregunta)

    if elegida == pregunta["correcta"]:
        texto_feedback = "¡Correcto! +10 puntos"
        color = obtener_color("correcto")
    else:
        texto_feedback = f"¡Incorrecto! La respuesta era: {pregunta['correcta']}"
        color = obtener_color("incorrecto")

    padre = lienzo(ventana)
    etiqueta = tk.Label(padre, text=texto_feedback, font=fuente(15, True),
                        bg=obtener_color("fondo"), fg=color)
    etiqueta.pack(pady=(12, 0))

    # Pipo explica por qué era esa la respuesta correcta.
    crear_pipo(padre, pregunta["explicacion"], ancho_burbuja=520)

    def siguiente():
        """Avanza a la siguiente pregunta o termina la trivia."""
        if indice + 1 < len(preguntas):
            repintar_pantalla(ventana, mostrar_trivia, nombre_jugador,
                              preguntas, indice + 1, aciertos,
                              puntos_actividad, False, None)
        else:
            puntuacion.completar_actividad("trivia")
            puntuacion.sumar_bonificacion()
            sonido_ganar()
            repintar_pantalla(ventana, mostrar_resultado, nombre_jugador,
                              "¡Trivia completada!", puntos_actividad,
                              len(preguntas), aciertos)

    boton_siguiente = crear_boton(padre, "Siguiente", siguiente, ancho=16)
    boton_siguiente.pack(pady=12)