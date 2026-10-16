"""Entrada para PyInstaller (import absoluto, sin paquete relativo).

Explicación académica
---------------------
``python -m penguin_english`` usa ``__main__.py`` con ``from .main``.
PyInstaller trata el script de entrada como archivo suelto: los
importes relativos fallan. Este lanzador importa el paquete por
nombre, con ``pathex=src`` en ``penguin.spec``.
"""

from penguin_english.main import iniciar

if __name__ == "__main__":
    iniciar()
