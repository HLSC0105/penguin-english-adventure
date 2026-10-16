"""Resolución de la carpeta ``recursos/`` del proyecto.

Explicación académica
---------------------
Un archivo de datos (PNG, WAV) no viaja dentro del ``.py``. Hay que
**buscarlo** en el disco. Si hardcodeamos una sola ruta
(``Path(__file__).parents[3]``), el juego funciona en desarrollo y
falla cuando el paquete se instala en otro sitio.

La solución clásica es una **lista de candidatos** (patrón Chain of
Responsibility): se prueba cada ubicación hasta encontrar una carpeta
que contenga ``sonidos/`` o ``imagenes/``.

Precondición: ninguna (funciona aunque pygame no esté).
Postcondición: ``carpeta_recursos()`` siempre devuelve un ``Path``;
puede no existir todavía (entonces las funciones de carga fallan
con gracia y el juego sigue).
"""

import sys
from pathlib import Path


def _desde_paquete():
    """Candidatos vía ``importlib.resources`` (paquete instalado)."""
    encontrados = []
    try:
        from importlib.resources import files
    except ImportError:
        return encontrados
    for nombre, extra in (
        ("penguin_english.recursos", None),
        ("penguin_english", "recursos"),
    ):
        try:
            nodo = files(nombre)
            if extra:
                nodo = nodo.joinpath(extra)
            candidato = Path(str(nodo))
        except (ModuleNotFoundError, TypeError, FileNotFoundError, ValueError, OSError):
            continue
        if candidato not in encontrados:
            encontrados.append(candidato)
    return encontrados


def _candidatos():
    """Rutas posibles, de más específica a más general."""
    if getattr(sys, "frozen", False):
        base = Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent))
        return [
            base / "recursos",
            Path(sys.executable).parent / "recursos",
        ]
    aqui = Path(__file__).resolve()
    return [
        # Árbol de desarrollo: src/penguin_english/utilidades/rutas.py
        # parents[0]=utilidades, [1]=penguin_english, [2]=src, [3]=raíz
        aqui.parents[3] / "recursos",
        # Si alguien copia recursos junto al paquete instalado
        aqui.parents[2] / "recursos",
        aqui.parents[1] / "recursos",
        Path.cwd() / "recursos",
        *_desde_paquete(),
    ]


def carpeta_recursos():
    """Devuelve la carpeta ``recursos/`` que sí contiene assets, si existe.

    Complejidad: O(k) con k = número de candidatos (constante pequeña).
    """
    for candidato in _candidatos():
        if (candidato / "sonidos").is_dir() or (candidato / "imagenes").is_dir():
            return candidato
    return _candidatos()[0]


def carpeta_sonidos():
    """Carpeta de los WAV del juego."""
    return carpeta_recursos() / "sonidos"


def carpeta_imagenes():
    """Carpeta de los PNG (OpenMoji y Pipo)."""
    return carpeta_recursos() / "imagenes"


def archivo_sonido(nombre):
    """Ruta a un WAV, o ``None`` si el archivo no está."""
    ruta = carpeta_sonidos() / nombre
    return ruta if ruta.is_file() else None


def archivo_imagen(nombre):
    """Ruta a un PNG, o ``None`` si el archivo no está."""
    if not nombre:
        return None
    ruta = carpeta_imagenes() / nombre
    return ruta if ruta.is_file() else None
