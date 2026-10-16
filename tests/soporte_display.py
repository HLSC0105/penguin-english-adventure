"""Asegura un servidor gráfico para Tkinter. Nunca hace skip.

Explicación académica
---------------------
Tk necesita un display (X11/Wayland). En CI o SSH no hay uno. Xvfb
es un X virtual: las pruebas dibujan de verdad, nadie ve la ventana.

Si no hay DISPLAY usable ni Xvfb, **fallamos** con un mensaje de
instalación. Un skip escondería que la suite gráfica no corrió.
"""

from __future__ import annotations

import atexit
import os
import shutil
import subprocess
import time

# pygame no abre ventana: el driver dummy evita pelear con Tk por el display.
os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
# Los WAV en hilo + mixer dummy pueden bloquear update() varios segundos.
os.environ.setdefault("PEA_SILENCIO", "1")
# Las interpolaciones con after()+update() se comen segundos por clic.
os.environ.setdefault("PEA_SIN_ANIM", "1")

_proceso_xvfb = None


def _tk_abre():
    import tkinter as tk
    raiz = tk.Tk()
    raiz.destroy()
    tk._default_root = None


def asegurar_display():
    """Deja $DISPLAY listo para ``tk.Tk()`` o lanza RuntimeError."""
    global _proceso_xvfb
    actual = os.environ.get("DISPLAY")
    if actual:
        try:
            _tk_abre()
            return
        except Exception:
            pass

    xvfb = shutil.which("Xvfb")
    if xvfb is None:
        raise RuntimeError(
            "No hay servidor gráfico ni Xvfb. "
            "Instálalo con: sudo apt install xvfb"
        )

    pantalla = os.environ.get("PEA_XVFB_DISPLAY", ":93")
    _proceso_xvfb = subprocess.Popen(
        [xvfb, pantalla, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    os.environ["DISPLAY"] = pantalla
    atexit.register(_cerrar_xvfb)
    ultimo_error = None
    for _ in range(30):
        time.sleep(0.1)
        try:
            _tk_abre()
            return
        except Exception as error:
            ultimo_error = error
    raise RuntimeError(
        f"Xvfb arrancó en {pantalla} pero Tk no conectó: {ultimo_error}"
    )


def _cerrar_xvfb():
    global _proceso_xvfb
    if _proceso_xvfb is not None:
        _proceso_xvfb.terminate()
        try:
            _proceso_xvfb.wait(timeout=2)
        except Exception:
            _proceso_xvfb.kill()
        _proceso_xvfb = None
