"""Pruebas de la matemática del volteo 2.5D (sin ventana SDL)."""

import math
import unittest

from penguin_english.interfaz.lienzo_pygame import (
    _pygame_superficie, ancho_carta_volteo, cara_visible, cargar_png_pygame,
    etiqueta_frente, sombra_canto, superficie_a_ppm, usa_imagen_frente)


class TestVolteoCarta(unittest.TestCase):

    def test_cara_plena_mantiene_el_ancho(self):
        self.assertAlmostEqual(ancho_carta_volteo(0, 100), 100, places=5)

    def test_canto_es_estrecho(self):
        ancho = ancho_carta_volteo(math.pi / 2, 100)
        self.assertLess(ancho, 5)

    def test_dorso_a_180(self):
        self.assertEqual(cara_visible(0), "frente")
        self.assertEqual(cara_visible(math.pi), "dorso")

    def test_sombra_maxima_en_el_canto(self):
        self.assertAlmostEqual(sombra_canto(0), 0.0, places=5)
        self.assertGreater(sombra_canto(math.pi / 2), 0.9)

    def test_frente_imagen_no_es_interrogante(self):
        imagen = {"tipo": "imagen", "texto": None, "imagen": "1F34C.png",
                  "par": 0, "visible": True}
        palabra = {"tipo": "palabra", "texto": "BANANA", "imagen": None,
                   "par": 0, "visible": True}
        self.assertTrue(usa_imagen_frente(imagen))
        self.assertIsNone(etiqueta_frente(imagen))
        self.assertFalse(usa_imagen_frente(palabra))
        self.assertEqual(etiqueta_frente(palabra), "BANANA")

    def test_superficie_offscreen_a_ppm(self):
        superficie = _pygame_superficie(8, 6)
        self.assertIsNotNone(
            superficie, "pygame debe pintar en RAM sin ventana SDL")
        ppm = superficie_a_ppm(superficie)
        self.assertTrue(ppm.startswith(b"P6 "))
        self.assertIn(b"8 6 255", ppm[:40])

    def test_png_openmoji_carga_sin_display(self):
        png = cargar_png_pygame("1F34C.png", 64, 64)
        self.assertIsNotNone(
            png, "El PNG debe cargar sin pygame.display.set_mode()")
        self.assertEqual(png.get_size(), (64, 64))

    def test_png_inexistente_es_none(self):
        self.assertIsNone(cargar_png_pygame("no_existe_xyz.png", 64, 64))

    def test_todas_las_parejas_memoria_cargan_png(self):
        from penguin_english.datos.preguntas import PAREJAS_MEMORIA
        for pareja in PAREJAS_MEMORIA:
            png = cargar_png_pygame(pareja["imagen"], 32, 32)
            self.assertIsNotNone(
                png, f"No cargó {pareja['ingles']} ({pareja['imagen']})")

    def test_png_banana_pinta_amarillo_no_circulo_azul(self):
        png = cargar_png_pygame("1F34C.png", 64, 64)
        self.assertIsNotNone(png)
        dest = _pygame_superficie(80, 80)
        self.assertIsNotNone(dest)
        dest.fill((248, 250, 252))
        dest.blit(png, png.get_rect(center=(40, 40)))
        amarillos = 0
        azules_boton = 0
        for y in range(80):
            for x in range(80):
                r, g, b = dest.get_at((x, y))[:3]
                if r > 180 and g > 140 and b < 90:
                    amarillos += 1
                if r < 50 and 50 < g < 90 and b > 120:
                    azules_boton += 1
        self.assertGreater(
            amarillos, 40,
            "La banana OpenMoji debe verse (píxeles amarillos), no el respaldo")
        self.assertLess(azules_boton, amarillos)
