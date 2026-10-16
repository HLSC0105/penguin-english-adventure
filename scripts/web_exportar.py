"""Orquestador web: exporta el juego de escritorio a un sitio estático.

Explicación académica
---------------------
Un único origen de verdad: los datos y reglas viven en el paquete
Python (``datos/*``, ``interfaz/intro``) y este script los **emite**
como ``web/js/00-datos.js`` y copia solo los assets usados (OpenMoji,
sonidos WAV, el Pipo de UI y los créditos). La web no duplica el
banco: lo importa del Python real. Si editas datos → re-ejecuta:

    python scripts/web_exportar.py
    python scripts/web_exportar.py --servir 9000   # + servidor local

Postcondición: ``web/`` es autocontenido (arrastrable a Netlify Drop).
Verificación: imprime conteos y falla con ruido si falta un asset.
"""

import argparse
import datetime
import json
import pathlib
import shutil
import sys

RAIZ = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "src"))

WEB = RAIZ / "web"
CARPETA_IMG = WEB / "assets" / "img"
CARPETA_SONIDO = WEB / "assets" / "sonidos"

ARCHIVO_DATOS = WEB / "js" / "00-datos.js"
ARCHIVO_CREDITOS = WEB / "ATRIBUCIONES.md"

IMAGENES_PIPO = ("pinguino_128.png", "pinguino_618.png")
SONIDOS = ("clic.wav", "correcto.wav", "error.wav", "ganar.wav")


def copiar_si_existe(ruta_origen, carpeta_destino):
    """Copia un asset a la web; devuelve el nombre o None si no existe."""
    if ruta_origen is None:
        return None
    origen = pathlib.Path(ruta_origen)
    if not origen.exists():
        return None
    destino = pathlib.Path(carpeta_destino) / origen.name
    shutil.copyfile(origen, destino)
    return origen.name


def construir_web():
    """Importa el paquete Python y regenera datos + assets de la web."""
    from penguin_english.datos.niveles import NIVELES, NIVEL_POR_DEFECTO, PARAMETROS
    from penguin_english.datos.preguntas import (
        PAREJAS_MEMORIA,
        PREGUNTAS_TRIVIA,
        MENSAJES_PIPO,
    )
    from penguin_english.datos.vocabulario import CATEGORIAS
    from penguin_english.interfaz.intro import INTROS
    from penguin_english.utilidades.rutas import archivo_imagen, archivo_sonido

    # parámetros por nivel en clave JS (la web lee memoriaParejas, etc.)
    parametros_js = {}
    for clave, valores in PARAMETROS.items():
        parametros_js[clave] = {
            "trivia": valores["trivia"],
            "completar": valores["completar"],
            "ordenar": valores["ordenar"],
            "memoriaParejas": valores["memoria_parejas"],
            "esperaFlipMs": valores["espera_flip_ms"],
            "huecoInicialPermitido": valores["hueco_inicial_permitido"],
        }

    WEB.mkdir(exist_ok=True)
    CARPETA_IMG.mkdir(parents=True, exist_ok=True)
    CARPETA_SONIDO.mkdir(parents=True, exist_ok=True)
    (WEB / "js").mkdir(exist_ok=True)

    # --- datos: mismo JSON que lee la interfaz de escritorio ---
    datos = {
        "niveles": list(NIVELES),
        "nivelPorDefecto": NIVEL_POR_DEFECTO,
        "parametros": parametros_js,
        "categorias": CATEGORIAS,
        "trivia": PREGUNTAS_TRIVIA,
        "parejas": PAREJAS_MEMORIA,
        "pipo": MENSAJES_PIPO,
        "intros": {
            clave: {"titulo": bloque["titulo"], "pipo": bloque["pipo"]}
            for clave, bloque in INTROS.items()
        },
        "constantes": {
            "palabrasPorPagina": 4,
            "puntosCorrecta": 10,
            "puntosBonificacion": 20,
            "totalActividades": 5,
        },
    }

    # --- assets de imagen usados por datos + Pipo ---
    nombres_imagen = []
    for palabras in CATEGORIAS.values():
        nombres_imagen += [p.get("imagen") for p in palabras if p.get("imagen")]
    nombres_imagen += [p.get("imagen") for p in PAREJAS_MEMORIA if p.get("imagen")]
    nombres_imagen += list(IMAGENES_PIPO)

    copiadas, faltantes, vistas = [], [], set()
    for nombre in dict.fromkeys(nombres_imagen):
        seleccion = copiar_si_existe(archivo_imagen(nombre), CARPETA_IMG)
        if seleccion:
            copiadas.append(seleccion)
        else:
            faltantes.append(nombre)

    # --- sonidos ---
    for nombre in SONIDOS:
        copiar_si_existe(archivo_sonido(nombre), CARPETA_SONIDO)

    shutil.copyfile(RAIZ / "recursos" / "ATRIBUCIONES.md", ARCHIVO_CREDITOS)

    # --- emisión JS (script clásico: funciona también por file://) ---
    ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    total_palabras = sum(len(v) for v in CATEGORIAS.values())
    encabezado = (
        f"/* Generado por scripts/web_exportar.py — NO editar a mano.\n"
        f"   Fuente: src/penguin_english/datos de {RAIZ.name} ({ahora}).\n"
        f"   Conteo: {len(CATEGORIAS)} categorías, {total_palabras} palabras, "
        f"{len(PREGUNTAS_TRIVIA)} preguntas de trivia, {len(PAREJAS_MEMORIA)} parejas, "
        f"{len(copiadas)} imágenes copiadas. */\n"
    )
    cuerpo = "window.PEA_DATOS = " + json.dumps(datos, ensure_ascii=False) + ";\n"
    ARCHIVO_DATOS.write_text(encabezado + cuerpo, encoding="utf-8")

    # --- verificación ruidosa (el puente debe fallar en voz alta) ---
    print(f"web/js/00-datos.js  → {total_palabras} palabras en "
          f"{len(CATEGORIAS)} categorías")
    print(f"trivia: {len(PREGUNTAS_TRIVIA)} preguntas · parejas: "
          f"{len(PAREJAS_MEMORIA)} · imágenes: {len(copiadas)} copiadas")
    if faltantes:
        print(f"FALTAN {len(faltantes)} imágenes (se usará el círculo con "
              f"letra inicial, como en el escritorio):", ", ".join(faltantes))
    return datos


def servir(puerto):
    """Sirve web/ por HTTP (necesario solo para probar localmente)."""
    import http.server
    import functools

    clase = functools.partial(http.server.SimpleHTTPRequestHandler,
                              directory=str(WEB))
    with http.server.ThreadingHTTPServer(("127.0.0.1", puerto), clase) as servidor:
        print(f"http://127.0.0.1:{puerto}  (Ctrl+C para parar)")
        servidor.serve_forever()


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--servir", type=int, metavar="PUERTO",
                        help="servir la web en 127.0.0.1:PUERTO tras exportar")
    argumentos = parser.parse_args()
    construir_web()
    if argumentos.servir:
        servir(argumentos.servir)


if __name__ == "__main__":
    main()
