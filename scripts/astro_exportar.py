"""Exporta los datos del paquete Python a JSON para la versión Astro.

Explicación académica
---------------------
Espejo de scripts/web_exportar.py con un cambio de filosofía: en la web
vanilla el JSON se EMITÍA para runtime (el navegador lo leía al cargar);
en Astro el JSON se emite a ``web-astro/src/data/`` y Astro lo IMPORTA
en **build time** — el contenido queda incrustado en el HTML final y no
hay fetch, hay tipos, y el "single source of truth" sigue siendo Python.

Uso (desde la raíz del proyecto, tras editar datos/):

    source .venv/bin/activate
    python scripts/astro_exportar.py

Postcondición: los JSON en web-astro/src/data/ están al día con el
paquete Python; Astro build los convierte en páginas estáticas.
"""

import datetime
import json
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "src"))

DESTINO = RAIZ / "web-astro" / "src" / "data"


def main():
    from penguin_english.datos.niveles import NIVELES, NIVEL_POR_DEFECTO, PARAMETROS
    from penguin_english.datos.preguntas import (
        PAREJAS_MEMORIA,
        PREGUNTAS_TRIVIA,
        MENSAJES_PIPO,
    )
    from penguin_english.datos.vocabulario import CATEGORIAS
    from penguin_english.interfaz.intro import INTROS

    DESTINO.mkdir(parents=True, exist_ok=True)

    def js_parametros():
        """Parámetros por nivel en clave JS (la island lee memoriaParejas,
        esperaFlipMs...); mismo mapeo que hace web_exportar.py."""
        salida = {}
        for nivel, valores in PARAMETROS.items():
            salida[nivel] = {
                "trivia": valores["trivia"],
                "completar": valores["completar"],
                "ordenar": valores["ordenar"],
                "memoriaParejas": valores["memoria_parejas"],
                "esperaFlipMs": valores["espera_flip_ms"],
                "huecoInicialPermitido": valores["hueco_inicial_permitido"],
            }
        return salida

    ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    total_palabras = sum(len(v) for v in CATEGORIAS.values())
    print(f"Fuente: src/penguin_english/datos ({ahora})")

    emisiones = {
        "vocabulario.json": {
            "meta": {"total": total_palabras, "categorias": len(CATEGORIAS)},
            "categorias": CATEGORIAS,
        },
        "trivia.json": {"preguntas": PREGUNTAS_TRIVIA},
        "parejas.json": {"parejas": PAREJAS_MEMORIA},
        "pipo.json": {"mensajes": MENSAJES_PIPO},
        "niveles.json": {
            "niveles": list(NIVELES),
            "nivelPorDefecto": NIVEL_POR_DEFECTO,
            "parametros": js_parametros(),
        },
        "intros.json": {"intros": INTROS},
        "constantes.json": {
            "palabrasPorPagina": 4,
            "puntosCorrecta": 10,
            "puntosBonificacion": 20,
            "totalActividades": 5,
        },
    }

    for nombre, contenido in emisiones.items():
        ruta = DESTINO / nombre
        ruta.write_text(
            json.dumps(contenido, ensure_ascii=False, indent=1),
            encoding="utf-8",
        )
        print(f"  {nombre}  ({ruta.stat().st_size:,} bytes)")

    print(f"  → {total_palabras} palabras en {len(CATEGORIAS)} categorías · "
          f"{len(PREGUNTAS_TRIVIA)} trivia · {len(PAREJAS_MEMORIA)} parejas")


if __name__ == "__main__":
    main()
