"""Lógica del juego de memoria: crear tarjetas y verificar parejas.

Explicación académica
---------------------
Cada pareja son **dos** tarjetas (palabra + imagen) con el mismo
entero ``par``. El jugador no compara textos: compara ese identificador
(``son_pareja`` es O(1)).

``crear_tablero``: ``random.sample`` de N parejas del banco CEFR, dos
dicts por pareja, ``shuffle``. No muta ``PAREJAS_MEMORIA``. N y la
espera del flip salen de ``parametros_nivel`` (4/6/8 parejas).

Librería: ``random``. La proyección 2.5D **no** está aquí: vive en
``interfaz.lienzo_pygame``.
"""

import random

from ..datos.niveles import parametros_nivel, parejas_del_nivel


def cantidad_parejas(nivel=None):
    """Cuántas parejas tiene el tablero en este nivel."""
    return parametros_nivel(nivel)["memoria_parejas"]


def espera_flip_ms(nivel=None):
    """Milisegundos que se ven dos tarjetas que no son pareja."""
    return parametros_nivel(nivel)["espera_flip_ms"]


def crear_tablero(nivel=None):
    """Crea las tarjetas del tablero y las desordena.

    Cada tarjeta es un diccionario:
    - "par":     el número de la pareja a la que pertenece (0..N-1)
    - "tipo":    "palabra" o "imagen"
    - "texto":   la palabra (solo tipo palabra)
    - "imagen":  el archivo de imagen (solo tipo imagen)
    - "visible": True si la tarjeta está mostrándose
    """
    banco = parejas_del_nivel(nivel)
    cuantas = min(cantidad_parejas(nivel), len(banco))
    elegidas = random.sample(banco, cuantas)
    tarjetas = []
    numero_pareja = 0
    for pareja in elegidas:
        tarjetas.append({"par": numero_pareja, "tipo": "palabra",
                         "texto": pareja["ingles"], "imagen": None,
                         "visible": False})
        tarjetas.append({"par": numero_pareja, "tipo": "imagen",
                         "texto": None, "imagen": pareja["imagen"],
                         "visible": False})
        numero_pareja += 1
    random.shuffle(tarjetas)
    return tarjetas


def son_pareja(tarjeta_a, tarjeta_b):
    """Devuelve True si las dos tarjetas pertenecen a la misma pareja."""
    return tarjeta_a["par"] == tarjeta_b["par"]
