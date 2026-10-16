"""Sonidos del juego con pygame.mixer.

Explicación académica
---------------------
pygame.mixer es un **singleton**: se inicializa una sola vez en el
hilo principal (el de Tkinter). Reproducir desde un hilo daemon evita
que ``Sound.play()`` congele la interfaz, pero **crear** el mixer en
ese hilo falla en algunos Linux.

El volumen por defecto es 0.5 (pygame usa 1.0 si no se llama
``Sound.set_volume``). El slider del encabezado escribe
``establecer_volumen`` y se aplica a todos los WAV cacheados.

Si el mixer no arranca (servidor sin tarjeta, CI, Wayland raro), las
funciones no lanzan excepción: el juego sigue y ``audio_disponible()``
devuelve False para que la UI muestre "Sin sonido" (sin slider).

En Windows queda ``winsound.Beep`` como último recurso (sin volumen).
"""

import logging
import os
import sys
import threading

from .rutas import archivo_sonido

_log = logging.getLogger("penguin_english.sonidos")

_motor = None
_inicializado = False
_sonidos_cache = {}
_volumen = 0.5
VOLUMEN_POR_DEFECTO = 0.5
_WAVS = ("clic.wav", "correcto.wav", "error.wav", "ganar.wav")


def _reiniciar_para_pruebas():
    """Vuelve el módulo al estado inicial (solo tests)."""
    global _motor, _inicializado, _sonidos_cache, _volumen
    _motor = None
    _inicializado = False
    _sonidos_cache = {}
    _volumen = VOLUMEN_POR_DEFECTO


def volumen():
    """Nivel de mezcla actual, entre 0.0 y 1.0 (por defecto 0.5)."""
    return _volumen


def establecer_volumen(valor):
    """Fija el volumen (0 silencia, 1 máximo) y lo aplica a los WAV."""
    global _volumen
    try:
        numero = float(valor)
    except (TypeError, ValueError):
        numero = VOLUMEN_POR_DEFECTO
    _volumen = max(0.0, min(1.0, numero))
    for sonido in _sonidos_cache.values():
        try:
            sonido.set_volume(_volumen)
        except Exception:
            pass
    return _volumen


def audio_disponible():
    """True si pygame.mixer está listo y existe al menos un WAV."""
    return _motor == "pygame" and archivo_sonido("clic.wav") is not None


def inicializar_motor():
    """Inicializa pygame.mixer en el hilo que llama (debe ser el principal).

    Postcondición: ``_inicializado`` es True. ``_motor`` vale ``"pygame"``
    o ``None``. Idempotente: llamarla dos veces no vuelve a init.
    """
    global _motor, _inicializado
    if _inicializado:
        return _motor
    _inicializado = True
    try:
        import pygame
        pygame.mixer.init()
        _motor = "pygame"
    except Exception as error:
        _log.warning("No se pudo iniciar el audio: %s", error)
        _motor = None
        return _motor
    try:
        _precargar_sonidos()
    except Exception as error:
        _log.debug("No se pudieron precargar los WAV: %s", error)
    return _motor


def _obtener_sound(nombre_wav):
    """Devuelve un pygame.mixer.Sound cacheado (no relee el WAV)."""
    if nombre_wav in _sonidos_cache:
        return _sonidos_cache[nombre_wav]
    if _motor != "pygame":
        return None
    ruta = archivo_sonido(nombre_wav)
    if ruta is None:
        return None
    try:
        import pygame
        sonido = pygame.mixer.Sound(str(ruta))
        sonido.set_volume(_volumen)
    except Exception as error:
        _log.debug("No se pudo cargar %s: %s", nombre_wav, error)
        return None
    _sonidos_cache[nombre_wav] = sonido
    return sonido


def _precargar_sonidos():
    """Carga los cuatro WAV una vez, en el hilo del mixer."""
    for nombre in _WAVS:
        _obtener_sound(nombre)


def _motor_activo():
    """Asegura el init (por si un test llama a sonar sin pasar por main)."""
    if not _inicializado:
        return inicializar_motor()
    return _motor


def _beep_respaldo(frecuencia, duracion):
    """Suena un beep con winsound en Windows (sin pygame)."""
    if sys.platform == "win32":
        try:
            import winsound
            winsound.Beep(frecuencia, duracion)
        except Exception:
            pass


def _reproducir(nombre_wav, frecuencia_beep, duracion_beep):
    """Reproduce un WAV con pygame; si falla, beep en Windows.

    El mixer no se inicializa aquí: eso vive en el hilo principal.
    El hilo daemon solo llama a ``Sound.play()``.
    """
    if os.environ.get("PEA_SILENCIO"):
        return

    def _tarea():
        sonido = _obtener_sound(nombre_wav)
        if sonido is not None:
            try:
                sonido.play()
                return
            except Exception as error:
                _log.debug("Fallo al reproducir %s: %s", nombre_wav, error)
        _beep_respaldo(frecuencia_beep, duracion_beep)
    threading.Thread(target=_tarea, daemon=True).start()


def sonido_clic():
    """Sonido corto para los botones del menú."""
    _reproducir("clic.wav", 600, 60)


def sonido_correcto():
    """Sonido alegre cuando la respuesta es correcta."""
    _reproducir("correcto.wav", 880, 120)


def sonido_error():
    """Sonido grave cuando la respuesta es incorrecta."""
    _reproducir("error.wav", 220, 250)


def sonido_ganar():
    """Melodía corta al terminar una actividad."""
    _reproducir("ganar.wav", 660, 120)
