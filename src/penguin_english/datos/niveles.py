"""Niveles CEFR (A1, A2, B1) y filtro acumulativo del banco.

Explicación académica
---------------------
El MCER (CEFR) ordena la competencia: A1 concreto y cotidiano, A2
escolar, B1 independiente. En un juego no queremos tres bancos
aislados: quien elige B1 **ya sabe** A1 y A2.

El filtro es acumulativo:

    A1 → {A1}
    A2 → {A1, A2}
    B1 → {A1, A2, B1}

Eso se implementa comparando índices en una tupla ordenada
``NIVELES``. Complejidad de filtrar n palabras: O(n).

Además del banco, cada nivel cambia **constantes de juego**
(rondas, parejas, espera del flip). Los puntos por acierto no
cambian: la justicia pedagógica es el reto, no el premio.
"""

from ..utilidades import puntuacion

NIVELES = ("A1", "A2", "B1")
NIVEL_POR_DEFECTO = "A2"

# Parámetros por nivel. Las claves coinciden con lo que leen los juegos.
PARAMETROS = {
    "A1": {
        "trivia": 8,
        "completar": 6,
        "ordenar": 6,
        "memoria_parejas": 4,
        "espera_flip_ms": 1100,
        "hueco_inicial_permitido": True,
    },
    "A2": {
        "trivia": 10,
        "completar": 8,
        "ordenar": 8,
        "memoria_parejas": 6,
        "espera_flip_ms": 900,
        "hueco_inicial_permitido": True,
    },
    "B1": {
        "trivia": 12,
        "completar": 10,
        "ordenar": 10,
        "memoria_parejas": 8,
        "espera_flip_ms": 650,
        "hueco_inicial_permitido": False,
    },
}


def normalizar_nivel(nivel):
    """Devuelve un nivel válido; si llega basura, usa el default."""
    if nivel in NIVELES:
        return nivel
    actual = getattr(puntuacion, "nivel_actual", NIVEL_POR_DEFECTO)
    return actual if actual in NIVELES else NIVEL_POR_DEFECTO


def parametros_nivel(nivel=None):
    """Constantes de juego del nivel (copia para no mutar el diccionario)."""
    clave = normalizar_nivel(nivel)
    return dict(PARAMETROS[clave])


def _indice(nivel):
    return NIVELES.index(normalizar_nivel(nivel))


def cumple_nivel(etiqueta, nivel=None):
    """True si un ítem de ``etiqueta`` CEFR entra en el filtro acumulativo."""
    if etiqueta not in NIVELES:
        return False
    return NIVELES.index(etiqueta) <= _indice(nivel)


def filtrar_por_nivel(items, nivel=None):
    """Filtra una secuencia de diccionarios con clave ``nivel``.

    Precondición: cada ítem tiene ``item['nivel']`` en NIVELES.
    Postcondición: la lista original no se modifica (devolvemos otra).
    """
    elegido = normalizar_nivel(nivel)
    return [item for item in items if cumple_nivel(item.get("nivel"), elegido)]


def palabras_del_nivel(nivel=None):
    """Vocabulario visible/jugable en el nivel actual."""
    from .vocabulario import TODAS_LAS_PALABRAS
    return filtrar_por_nivel(TODAS_LAS_PALABRAS, nivel)


def categorias_del_nivel(nivel=None):
    """Categorías con al menos una palabra del nivel (acumulativo)."""
    from .vocabulario import CATEGORIAS
    elegido = normalizar_nivel(nivel)
    resultado = {}
    for nombre, palabras in CATEGORIAS.items():
        filtradas = filtrar_por_nivel(palabras, elegido)
        if filtradas:
            resultado[nombre] = filtradas
    return resultado


def preguntas_del_nivel(nivel=None):
    """Banco de trivia del nivel."""
    from .preguntas import PREGUNTAS_TRIVIA
    return filtrar_por_nivel(PREGUNTAS_TRIVIA, nivel)


def parejas_del_nivel(nivel=None):
    """Parejas de memoria disponibles en el nivel."""
    from .preguntas import PAREJAS_MEMORIA
    return filtrar_por_nivel(PAREJAS_MEMORIA, nivel)


def palabras_jugables(nivel=None):
    """Palabras aptas para completar/ordenar: sin espacios y ≥ 3 letras.

    'police officer' sirve en vocabulario, pero desordenar un espacio
    confunde al jugador. Filtramos aquí, no en el banco.
    """
    aptas = []
    for palabra in palabras_del_nivel(nivel):
        ingles = palabra["ingles"]
        if " " in ingles or "-" in ingles:
            continue
        if len(ingles) < 3:
            continue
        aptas.append(palabra)
    return aptas
