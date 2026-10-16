"""Carpeta de pruebas del proyecto.

Este archivo agrega la carpeta "src" a las rutas de búsqueda de Python
para poder importar el paquete del juego sin necesidad de instalarlo.
"""

import sys
from pathlib import Path

# Subimos una carpeta desde tests/ y entramos a src/.
RUTA_SRC = Path(__file__).resolve().parents[1] / "src"
if str(RUTA_SRC) not in sys.path:
    sys.path.insert(0, str(RUTA_SRC))