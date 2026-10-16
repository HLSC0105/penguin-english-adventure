"""Descarga PNG de OpenMoji (CC BY-SA 4.0) hacia recursos/imagenes/.

Uso (desde la raíz del proyecto, con red):

    python scripts/descargar_openmoji.py 1F422 1F98A
    python scripts/descargar_openmoji.py --catalogo
    python scripts/descargar_openmoji.py --catalogo --tamano 618

No se ejecuta al importar el juego: es una herramienta de desarrollo.
Ver recursos/ATRIBUCIONES.md para la licencia.

El tamaño 72 es el clásico (ligero, borroso al escalar). El 618 es el
que emite OpenMoji a resolución completa: origen para escalados nítidos
del catálogo web (DPR de ventanas, tarjetas de memoria, HUD).
"""

from __future__ import annotations

import argparse
import importlib.util
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

RAIZ = Path(__file__).resolve().parents[1]
DESTINO = RAIZ / "recursos" / "imagenes"
TAMANOS_VALIDOS = (72, 618)


def _intentos(codigo: str) -> list[str]:
    codigo = codigo.upper().removesuffix(".PNG")
    opciones = [codigo]
    if not codigo.endswith("-FE0F"):
        opciones.append(codigo + "-FE0F")
    return opciones


def descargar(codigo: str, tamano: int = 72) -> Path | None:
    codigo = codigo.upper().removesuffix(".PNG")
    destino = DESTINO / f"{codigo}.png"
    DESTINO.mkdir(parents=True, exist_ok=True)
    # Re-descarga si el PNG en disco no tiene el tamaño pedido: se lee el
    # ancho del IHDR (barato) en vez de mantener un archivo de estado extra.
    if destino.exists() and destino.stat().st_size > 40:
        if _tamano_png(destino) == tamano:
            return destino
    base = (f"https://github.com/hfg-gmuend/openmoji/raw/master/color/"
            f"{tamano}x{tamano}/{{codigo}}.png")
    for nombre in _intentos(codigo):
        url = base.format(codigo=nombre)
        try:
            with urlopen(url, timeout=30) as respuesta:  # nosec B310 - URL fija de OpenMoji
                destino.write_bytes(respuesta.read())
            return destino
        except (HTTPError, URLError, TimeoutError, OSError):
            continue
    return None


def _tamano_png(ruta: Path) -> int:
    """Lee el ancho (== alto en OpenMoji cuadrado) del IHDR de un PNG."""
    try:
        with ruta.open("rb") as mango:
            mango.seek(16)
            crudo = mango.read(4)
        return int.from_bytes(crudo, "big")
    except OSError:
        return -1


def _codigos_catalogo() -> list[str]:
    ruta = Path(__file__).resolve().parent / "_construir_vocabulario.py"
    spec = importlib.util.spec_from_file_location("construir_vocabulario", ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    vistos = set()
    for valor in modulo.IMAGENES.values():
        vistos.add(valor.upper().removesuffix(".PNG"))
    for _nombre, items in modulo.CATEGORIAS:
        for item in items:
            imagen = item[4]
            if imagen:
                vistos.add(imagen.upper().removesuffix(".PNG"))
    return sorted(vistos)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("codigos", nargs="*", help="códigos OpenMoji (ej. 1F422)")
    parser.add_argument("--catalogo", action="store_true",
                        help="descargar todo el catálogo usado por el juego")
    parser.add_argument("--tamano", type=int, default=72, choices=TAMANOS_VALIDOS,
                        help="tamaño en px (72 ligero · 618 nítido)")
    argumentos = parser.parse_args(argv)
    if argumentos.catalogo:
        codigos = _codigos_catalogo()
    else:
        codigos = argumentos.codigos
    if not codigos:
        parser.error("sin códigos y sin --catalogo no se baja nada")
    fallos = []
    for codigo in codigos:
        ruta = descargar(codigo, tamano=argumentos.tamano)
        if ruta is None:
            fallos.append(codigo)
            print(f"Fallo {codigo}")
        else:
            print(f"Guardado {ruta} ({argumentos.tamano}px)")
    if fallos:
        print(f"No se pudieron descargar {len(fallos)} códigos")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
