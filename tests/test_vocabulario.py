"""Pruebas del vocabulario y de las imágenes del juego."""

import unittest
from pathlib import Path

from penguin_english.datos.niveles import NIVELES
from penguin_english.datos.vocabulario import CATEGORIAS, TODAS_LAS_PALABRAS
from penguin_english.utilidades.rutas import carpeta_imagenes

RUTA_IMAGENES = carpeta_imagenes()


class TestVocabulario(unittest.TestCase):

    def test_hay_al_menos_veinte_categorias(self):
        self.assertGreaterEqual(len(CATEGORIAS), 20)

    def test_cada_categoria_tiene_al_menos_siete_palabras(self):
        for categoria, palabras in CATEGORIAS.items():
            self.assertGreaterEqual(len(palabras), 7, f"La categoría {categoria}")

    def test_total_de_palabras_es_extenso(self):
        self.assertGreaterEqual(len(TODAS_LAS_PALABRAS), 300)

    def test_ingles_unicos(self):
        claves = [p["ingles"].lower() for p in TODAS_LAS_PALABRAS]
        self.assertEqual(len(claves), len(set(claves)))

    def test_cada_palabra_tiene_sus_campos(self):
        for palabra in TODAS_LAS_PALABRAS:
            self.assertIn("ingles", palabra)
            self.assertIn("espanol", palabra)
            self.assertIn("imagen", palabra)
            self.assertIn("ejemplo", palabra)
            self.assertIn("nivel", palabra)
            self.assertNotEqual(palabra["ingles"], "")
            self.assertNotEqual(palabra["espanol"], "")
            self.assertNotEqual(palabra["ejemplo"], "")
            self.assertIn(palabra["nivel"], NIVELES)

    def test_imagenes_referenciadas_existen(self):
        for palabra in TODAS_LAS_PALABRAS:
            imagen = palabra["imagen"]
            if imagen is not None:
                ruta = Path(RUTA_IMAGENES) / imagen
                self.assertTrue(ruta.exists(),
                                f"Falta la imagen {imagen} de {palabra['ingles']}")

    def test_pictogramas_coherentes_con_el_texto(self):
        por_ingles = {p["ingles"]: p for p in TODAS_LAS_PALABRAS}
        self.assertEqual(por_ingles["dog"]["imagen"], "1F415.png")
        self.assertEqual(por_ingles["apple"]["imagen"], "1F34E.png")
        self.assertEqual(por_ingles["plane"]["imagen"], "2708.png")
        self.assertEqual(por_ingles["hand"]["imagen"], "270B.png")
        self.assertNotEqual(por_ingles["doctor"]["imagen"], "1FA79.png")
        self.assertGreaterEqual(
            sum(1 for p in TODAS_LAS_PALABRAS if p["imagen"]), 250)

    def test_meses_completos(self):
        meses = [p["ingles"] for p in CATEGORIAS["Meses del año"]]
        self.assertEqual(len(meses), 12)
        self.assertIn("August", meses)
        self.assertIn("December", meses)
