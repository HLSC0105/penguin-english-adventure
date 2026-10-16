"""Pantalla para aprender vocabulario por categorías y nivel CEFR.

Explicación académica
---------------------
Estudio, no examen: no suma puntos. Las categorías salen de
``categorias_del_nivel`` (filtro acumulativo). Paginación: 4 tarjetas;
el total de páginas es ``ceil(n / 4)`` escrito como división entera
``(n + 3) // 4``.

``_hueco_nav`` reserva el sitio de Anterior/Siguiente para que el
rótulo central no salte. ``Volver al listado`` solo en la última
página. Librería: ``tkinter`` + ``PhotoImage`` para OpenMoji.
"""

import tkinter as tk

from ..datos.niveles import categorias_del_nivel
from .componentes import (cargar_imagen, circulo_letra, crear_boton,
                          crear_encabezado, crear_tarjeta, crear_titulo, fuente,
                          guardar_pantalla, lienzo, obtener_color,
                          repintar_pantalla)

PALABRAS_POR_PAGINA = 4
_ANCHO_HUECO_NAV = 210
_ALTO_HUECO_NAV = 52


def _hueco_nav(padre, columna, sticky):
    """Reserva el sitio de Anterior/Siguiente para que el centro no se mueva."""
    caja = tk.Frame(padre, bg=obtener_color("fondo"),
                    width=_ANCHO_HUECO_NAV, height=_ALTO_HUECO_NAV)
    caja.grid(row=0, column=columna, padx=8, sticky=sticky)
    caja.grid_propagate(False)
    caja.pack_propagate(False)
    return caja


def mostrar_vocabulario(ventana, nombre_jugador, categoria, pagina):
    """Dibuja la pantalla de vocabulario filtrada por el nivel actual."""
    from .menu import mostrar_menu

    ir_al_menu = lambda: repintar_pantalla(ventana, mostrar_menu, nombre_jugador)
    crear_encabezado(ventana, nombre_jugador, ir_al_menu)
    padre = lienzo(ventana)
    crear_titulo(padre, "Aprender vocabulario").pack(pady=(8, 4))

    if categoria is None:
        mostrar_categorias(ventana, nombre_jugador)
    else:
        mostrar_palabras(ventana, nombre_jugador, categoria, pagina)


def mostrar_categorias(ventana, nombre_jugador):
    """Muestra los botones de las categorías visibles en el nivel."""
    marco = tk.Frame(lienzo(ventana), bg=obtener_color("fondo"))
    marco.pack(pady=16)
    categorias = categorias_del_nivel()

    fila = 0
    columna = 0
    for categoria, palabras in categorias.items():
        cantidad = len(palabras)
        boton = crear_boton(
            marco, f"{categoria} ({cantidad})",
            lambda nombre=categoria: repintar_pantalla(
                ventana, mostrar_vocabulario, nombre_jugador, nombre, 0),
            ancho=22, alto=2)
        boton.grid(row=fila, column=columna, padx=10, pady=8)
        columna += 1
        if columna == 2:
            columna = 0
            fila += 1
    guardar_pantalla(mostrar_vocabulario, nombre_jugador, None, 0)


def mostrar_palabras(ventana, nombre_jugador, categoria, pagina):
    """Muestra las palabras de una categoría, 4 por página."""
    categorias = categorias_del_nivel()
    palabras = categorias.get(categoria, [])
    total_paginas = max(1, (len(palabras) + PALABRAS_POR_PAGINA - 1) // PALABRAS_POR_PAGINA)
    if pagina >= total_paginas:
        pagina = total_paginas - 1

    padre = lienzo(ventana)
    bloque = tk.Frame(padre, bg=obtener_color("fondo"))
    bloque.pack(pady=8)

    etiqueta = tk.Label(bloque, text=f"Categoría: {categoria}",
                        font=fuente(15, True), bg=obtener_color("fondo"),
                        fg=obtener_color("acento"))
    etiqueta.pack(pady=(0, 4))

    marco_navegacion = tk.Frame(bloque, bg=obtener_color("fondo"))
    marco_navegacion.pack(pady=4)
    marco_navegacion.grid_columnconfigure(0, weight=1, uniform="flechas")
    marco_navegacion.grid_columnconfigure(1, weight=0)
    marco_navegacion.grid_columnconfigure(2, weight=1, uniform="flechas")

    def ir_a(pagina_nueva):
        repintar_pantalla(ventana, mostrar_vocabulario, nombre_jugador,
                          categoria, pagina_nueva)

    caja_anterior = _hueco_nav(marco_navegacion, 0, "e")
    if pagina > 0:
        crear_boton(caja_anterior, "◀ Anterior",
                    lambda: ir_a(pagina - 1), ancho=12, alto=1).pack()

    tk.Label(marco_navegacion,
             text=f"Página {pagina + 1} de {total_paginas}",
             font=fuente(12), bg=obtener_color("fondo"),
             fg=obtener_color("texto_secundario")).grid(
        row=0, column=1, padx=14)

    caja_siguiente = _hueco_nav(marco_navegacion, 2, "w")
    if pagina < total_paginas - 1:
        crear_boton(caja_siguiente, "Siguiente ▶",
                    lambda: ir_a(pagina + 1), ancho=12, alto=1).pack()

    marco_tarjetas = tk.Frame(bloque, bg=obtener_color("fondo"))
    marco_tarjetas.pack(pady=10)

    inicio = pagina * PALABRAS_POR_PAGINA
    fin = inicio + PALABRAS_POR_PAGINA
    posicion = 0
    for palabra in palabras[inicio:fin]:
        fila = posicion // 2
        columna = posicion % 2
        crear_tarjeta_palabra(marco_tarjetas, palabra).grid(
            row=fila, column=columna, padx=12, pady=6)
        posicion += 1

    if pagina >= total_paginas - 1:
        crear_boton(
            bloque, "Volver al listado",
            lambda: repintar_pantalla(ventana, mostrar_vocabulario,
                                      nombre_jugador, None, 0),
            ancho=18, alto=1).pack(pady=(4, 12))

    guardar_pantalla(mostrar_vocabulario, nombre_jugador, categoria, pagina)


def crear_tarjeta_palabra(ventana, palabra):
    """Crea una tarjeta con la imagen, la palabra, el nivel y su ejemplo."""
    sombra, marco = crear_tarjeta(ventana, ancho=300, alto=210, offset=5)

    imagen = cargar_imagen(ventana, palabra["imagen"], tamano_max=80)
    if imagen is not None:
        etiqueta_imagen = tk.Label(marco, image=imagen, bg=obtener_color("tarjeta"))
    else:
        etiqueta_imagen = circulo_letra(marco, palabra["ingles"][0].upper())
    etiqueta_imagen.pack(pady=(10, 2))

    tk.Label(marco, text=palabra["ingles"].upper(),
             font=fuente(16, True),
             bg=obtener_color("tarjeta"),
             fg=obtener_color("texto")).pack()
    tk.Label(marco, text=palabra["espanol"],
             font=fuente(12),
             bg=obtener_color("tarjeta"),
             fg=obtener_color("texto_secundario")).pack()
    tk.Label(marco, text=palabra["nivel"],
             font=fuente(10, True),
             bg=obtener_color("tarjeta"),
             fg=obtener_color("acento")).pack()
    tk.Label(marco, text=f'"{palabra["ejemplo"]}"',
             font=fuente(11),
             bg=obtener_color("tarjeta"),
             fg=obtener_color("acento"),
             wraplength=260).pack(pady=(2, 8))
    return sombra
