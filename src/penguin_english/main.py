"""Crea la ventana principal del juego y la inicia.

Explicación académica
---------------------
Este módulo es el **arranque**: no contiene reglas de trivia ni dibuja
actividades. Equivale al ``Inicio`` de un algoritmo PSeInt que abre la
ventana y llama al menú.

Librerías: ``tkinter`` (la ventana ``Tk`` y ``mainloop``) y ``sys``
(``platform`` para maximizar en Windows frente a Linux). pygame no se
importa aquí: el mixer se pide a ``sonidos.inicializar_motor``.

Precondición de ``crear_ventana``: un solo ``Tk()`` por hilo.
Postcondición: cascarón instalado, Pipo precargado, pantalla de inicio
visible. ``iniciar`` añade maximizar + ``mainloop``; los tests e2e
llaman solo a ``crear_ventana`` y conducen con ``update()``.
"""

import sys
import tkinter as tk

from .interfaz.componentes import (configurar_estilos, instalar_cascaron,
                                   obtener_color, precargar_imagenes)
from .interfaz.inicio import mostrar_inicio
from .utilidades.puntuacion import reiniciar_puntuacion
from .utilidades.sonidos import inicializar_motor


ANCHO_MINIMO = 1280
ALTO_MINIMO = 720


def maximizar(ventana):
    """Maximiza con barra de título (no pantalla completa)."""
    ventana.update_idletasks()
    if sys.platform == "win32":
        try:
            ventana.state("zoomed")
            return
        except tk.TclError:
            pass
    ancho, alto = ventana.maxsize()
    ventana.geometry(f"{ancho}x{alto}+0+0")


def _silenciar_errores_fondo(ventana):
    """Ignora los errores de Tk cuando los widgets ya están destruidos.

    Las animaciones que usan ``after`` pueden actuar sobre widgets
    borrados al cambiar de pantalla. Silenciamos esos bgerrors de consola.
    """
    ventana.tk.createcommand("bgerror",
                             lambda *args, **kwargs: None)


def crear_ventana():
    """Construye la ventana y muestra el inicio, sin entrar al mainloop.

    Los tests e2e usan esta función para conducir la UI con ``update()``.
    Precondición: no debe haber otro ``Tk()`` huérfano en el hilo.
    Postcondición: mixer intentado, puntuación en cero, inicio visible.
    Tamaño de respaldo 1280×720 (mínimo 720p); ``iniciar()`` maximiza.
    """
    reiniciar_puntuacion()
    inicializar_motor()

    ventana = tk.Tk()
    ventana.title("Penguin English Adventure")
    ventana.geometry(f"{ANCHO_MINIMO}x{ALTO_MINIMO}")
    ventana.minsize(ANCHO_MINIMO, ALTO_MINIMO)
    ventana.configure(bg=obtener_color("fondo"))
    _silenciar_errores_fondo(ventana)
    configurar_estilos()
    instalar_cascaron(ventana)
    precargar_imagenes(ventana)
    mostrar_inicio(ventana)
    return ventana


def iniciar():
    """Crea la ventana del juego, la maximiza y arranca el bucle de eventos."""
    ventana = crear_ventana()
    maximizar(ventana)
    ventana.mainloop()
