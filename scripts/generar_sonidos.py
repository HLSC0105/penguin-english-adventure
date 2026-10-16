"""Genera los archivos WAV de sonidos del juego.

Si la carpeta `recursos/sonidos/` no contiene los WAV, el juego funciona
en modo silencioso. Este script crea los WAV desde cero con un tono
sencillo (sin dependencias externas).
"""

import math
import struct
import wave
from pathlib import Path

RUTA = Path(__file__).resolve().parents[1] / "recursos" / "sonidos"
RUTA.mkdir(parents=True, exist_ok=True)

FRECUENCIA_MUESTREO = 44100  # Hz


def tono(frecuencia, duracion_ms, volumen=0.35):
    """Genera muestras PCM de un tono seno a la frecuencia indicada."""
    cantidad = int(FRECUENCIA_MUESTREO * duracion_ms / 1000)
    muestras = []
    for n in range(cantidad):
        # Aplicamos una pequeña envolvente (fade-in/out) para evitar chasquidos.
        if n < 100:
            env = n / 100
        elif n > cantidad - 200:
            env = max(0, (cantidad - n) / 200)
        else:
            env = 1
        valor = int(volumen * 32767 * env *
                    math.sin(2 * math.pi * frecuencia * n / FRECUENCIA_MUESTREO))
        muestras.append(struct.pack("<h", max(-32767, min(32767, valor))))
    return b"".join(muestras)


def guardar(nombre, datos):
    ruta = RUTA / nombre
    with wave.open(str(ruta), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(FRECUENCIA_MUESTREO)
        f.writeframes(datos)
    print(f"Generado: {ruta}")


# Clic: 800 Hz, 60 ms.
guardar("clic.wav", tono(800, 60, volumen=0.25))

# Correcto: subir escala 880 → 1175 Hz (~un acorde exitoso).
guardar("correcto.wav", tono(880, 110) + tono(1175, 160, volumen=0.4))

# Error: 220 Hz, 250 ms.
guardar("error.wav", tono(220, 250, volumen=0.4))

# Ganar: 660 → 880 → 990 Hz.
guardar("ganar.wav",
        tono(660, 130) + tono(880, 130) + tono(990, 220, volumen=0.4))

print("Hecho. WAVs disponibles en", RUTA)
