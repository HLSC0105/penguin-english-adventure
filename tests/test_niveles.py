"""Pruebas del filtro CEFR acumulativo y de las constantes por nivel."""

import unittest

from penguin_english.datos.niveles import (
    NIVELES, categorias_del_nivel, cumple_nivel, filtrar_por_nivel,
    palabras_del_nivel, palabras_jugables, parametros_nivel,
    parejas_del_nivel, preguntas_del_nivel)
from penguin_english.datos.preguntas import PAREJAS_MEMORIA, PREGUNTAS_TRIVIA
from penguin_english.datos.vocabulario import TODAS_LAS_PALABRAS
from penguin_english.utilidades import puntuacion


class TestNiveles(unittest.TestCase):

    def setUp(self):
        puntuacion.reiniciar_puntuacion()

    def test_filtro_acumulativo(self):
        self.assertTrue(cumple_nivel("A1", "A1"))
        self.assertFalse(cumple_nivel("A2", "A1"))
        self.assertTrue(cumple_nivel("A1", "A2"))
        self.assertTrue(cumple_nivel("A2", "B1"))
        self.assertTrue(cumple_nivel("B1", "B1"))
        self.assertFalse(cumple_nivel("B1", "A2"))

    def test_palabras_a1_solo_a1(self):
        palabras = palabras_del_nivel("A1")
        self.assertGreaterEqual(len(palabras), 80)
        self.assertTrue(all(p["nivel"] == "A1" for p in palabras))

    def test_a2_incluye_a1(self):
        a1 = {p["ingles"] for p in palabras_del_nivel("A1")}
        a2 = {p["ingles"] for p in palabras_del_nivel("A2")}
        self.assertTrue(a1.issubset(a2))
        self.assertGreater(len(a2), len(a1))

    def test_b1_es_todo_el_banco(self):
        self.assertEqual(len(palabras_del_nivel("B1")), len(TODAS_LAS_PALABRAS))

    def test_parametros_por_nivel(self):
        self.assertEqual(parametros_nivel("A1")["trivia"], 8)
        self.assertEqual(parametros_nivel("A2")["trivia"], 10)
        self.assertEqual(parametros_nivel("B1")["trivia"], 12)
        self.assertEqual(parametros_nivel("A1")["memoria_parejas"], 4)
        self.assertEqual(parametros_nivel("B1")["memoria_parejas"], 8)
        self.assertFalse(parametros_nivel("B1")["hueco_inicial_permitido"])

    def test_hay_suficientes_preguntas_por_nivel(self):
        for nivel in NIVELES:
            banco = preguntas_del_nivel(nivel)
            self.assertGreaterEqual(
                len(banco), parametros_nivel(nivel)["trivia"],
                f"El banco de {nivel} no alcanza para una partida")

    def test_hay_suficientes_parejas_por_nivel(self):
        for nivel in NIVELES:
            banco = parejas_del_nivel(nivel)
            self.assertGreaterEqual(
                len(banco), parametros_nivel(nivel)["memoria_parejas"])

    def test_filtrar_no_muta_el_original(self):
        copia = list(PREGUNTAS_TRIVIA)
        filtrar_por_nivel(PREGUNTAS_TRIVIA, "A1")
        self.assertEqual(PREGUNTAS_TRIVIA, copia)

    def test_palabras_jugables_sin_espacios(self):
        for palabra in palabras_jugables("B1"):
            self.assertNotIn(" ", palabra["ingles"])
            self.assertGreaterEqual(len(palabra["ingles"]), 3)

    def test_categorias_a1_no_vacias(self):
        cats = categorias_del_nivel("A1")
        self.assertGreaterEqual(len(cats), 10)

    def test_parejas_tienen_nivel(self):
        for pareja in PAREJAS_MEMORIA:
            self.assertIn(pareja["nivel"], NIVELES)
