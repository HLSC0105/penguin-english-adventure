"""Pruebas de los temas claro y oscuro de la interfaz."""

import unittest

from penguin_english.interfaz.componentes import (TEMA_CLARO, TEMA_OSCURO,
                                                  colores, tema_actual)

CLAVES_ESPERADAS = {
    "fondo", "panel", "tarjeta", "texto", "texto_secundario",
    "boton", "boton_hover", "boton_texto", "acento", "correcto",
    "incorrecto", "barra_fondo", "barra_relleno", "borde", "burbuja",
    "foco", "sombra", "sobre_acento",
}


class TestTemas(unittest.TestCase):

    def test_ambos_temas_tienen_las_mismas_claves(self):
        self.assertEqual(set(TEMA_CLARO.keys()), CLAVES_ESPERADAS)
        self.assertEqual(set(TEMA_OSCURO.keys()), CLAVES_ESPERADAS)

    def test_tema_oscuro_es_negro_profundo(self):
        self.assertEqual(TEMA_OSCURO["fondo"], "#000000")
        self.assertEqual(TEMA_OSCURO["boton"], "#1E3A8A")
        self.assertNotEqual(TEMA_OSCURO["tarjeta"], "#000000")

    def test_colores_son_validos_para_tk(self):
        for tema in [TEMA_CLARO, TEMA_OSCURO]:
            for color in tema.values():
                self.assertRegex(color, r"^#[0-9A-Fa-f]{6}$", f"Color inválido: {color}")

    def test_tema_activo_por_defecto_es_oscuro(self):
        self.assertEqual(tema_actual, "oscuro")
        self.assertIs(colores, TEMA_OSCURO)
