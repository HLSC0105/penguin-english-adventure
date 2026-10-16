"""Pruebas de resolución de la carpeta recursos/."""

import unittest
from pathlib import Path
from unittest.mock import patch

from penguin_english.utilidades import rutas
from penguin_english.utilidades.rutas import (
    _candidatos, archivo_imagen, archivo_sonido, carpeta_imagenes,
    carpeta_recursos, carpeta_sonidos)


class TestRutas(unittest.TestCase):

    def test_recursos_existe_en_el_arbol_fuente(self):
        recursos = carpeta_recursos()
        self.assertTrue(recursos.is_dir(), f"No se encontró recursos/ en {recursos}")
        self.assertEqual(recursos.name, "recursos")

    def test_wav_conocidos_existen(self):
        for nombre in ("clic.wav", "correcto.wav", "error.wav", "ganar.wav"):
            ruta = archivo_sonido(nombre)
            self.assertIsNotNone(ruta, f"Falta {nombre}")
            self.assertTrue(Path(ruta).is_file())

    def test_pipo_existe(self):
        grande = archivo_imagen("pinguino_618.png")
        ui = archivo_imagen("pinguino_128.png")
        self.assertIsNotNone(grande)
        self.assertIsNotNone(ui, "Falta el Pipo de UI (128 px)")
        self.assertTrue(carpeta_imagenes().is_dir())
        self.assertTrue(carpeta_sonidos().is_dir())

    def test_archivo_inexistente_es_none(self):
        self.assertIsNone(archivo_sonido("no_existe.wav"))
        self.assertIsNone(archivo_imagen("no_existe.png"))
        self.assertIsNone(archivo_imagen(None))

    def test_candidatos_incluyen_paquete_y_cwd(self):
        candidatos = _candidatos()
        self.assertTrue(any(c.name == "recursos" for c in candidatos))
        self.assertGreaterEqual(len(candidatos), 4)

    def test_candidatos_frozen_usa_meipass(self):
        with patch.object(rutas.sys, "frozen", True, create=True):
            with patch.object(rutas.sys, "_MEIPASS", "/tmp/meipass", create=True):
                with patch.object(rutas.sys, "executable", "/tmp/app.exe"):
                    candidatos = rutas._candidatos()
        self.assertEqual(candidatos[0], Path("/tmp/meipass") / "recursos")
        self.assertEqual(candidatos[1], Path("/tmp") / "recursos")
