"""Pruebas de interpolación y de que los callbacks de after sí corren."""

import os
import unittest

from tests.soporte_display import asegurar_display

asegurar_display()

import tkinter as tk

from penguin_english.interfaz.animaciones import (
    ANIMACIONES_ACTIVAS, animar_aparicion_titulo, bombear_after, ease_out_cubic,
    fundir_fondo, interpolar_color, pulsar_widget)
from penguin_english.interfaz import componentes as c


class TestAnimaciones(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        os.environ.pop("PEA_SIN_ANIM", None)

    @classmethod
    def tearDownClass(cls):
        os.environ["PEA_SIN_ANIM"] = "1"

    def setUp(self):
        self.ventana = tk.Tk()
        self.ventana.geometry("400x200")
        self.ventana.withdraw()
        self.addCleanup(self._cerrar)

    def _cerrar(self):
        try:
            self.ventana.destroy()
        except Exception:
            pass

    def test_interpolar_color(self):
        self.assertEqual(interpolar_color("#000000", "#FFFFFF", 0.5), "#808080")
        self.assertEqual(interpolar_color("#000000", "#FFFFFF", 1), "#FFFFFF")
        self.assertEqual(interpolar_color("#000000", "#FFFFFF", 0), "#000000")

    def test_ease_out_cubic_extremos(self):
        self.assertEqual(ease_out_cubic(0), 0)
        self.assertEqual(ease_out_cubic(1), 1)
        self.assertGreater(ease_out_cubic(0.5), 0.5)

    def test_fundir_fondo_llama_callback_y_cambia_color(self):
        self.ventana.configure(bg="#112233")
        llamado = []
        fundir_fondo(self.ventana, "#AABBCC", duracion_ms=80, pasos=4,
                     callback=lambda: llamado.append(True))
        bombear_after(self.ventana, tope_ms=1200)
        self.assertTrue(llamado, "El callback del fundido debe ejecutarse")
        self.assertEqual(str(self.ventana.cget("bg")).lower(), "#aabbcc")

    def test_titulo_crece_aunque_la_fuente_sea_string(self):
        etiqueta = tk.Label(self.ventana, text="Hola",
                            font="DejaVuSans 14 bold", fg="#fff", bg="#000")
        etiqueta.pack()
        animar_aparicion_titulo(etiqueta, tam_final=22, tam_inicial=12,
                                duracion_ms=60, pasos=3)
        bombear_after(self.ventana, tope_ms=300)
        fuente = str(etiqueta.cget("font"))
        self.assertTrue(fuente)

    def test_pulsar_widget_termina(self):
        etiqueta = tk.Label(self.ventana, text="X", bg="#FFFFFF")
        etiqueta.pack()
        pulsar_widget(etiqueta, "#FF0000", "#00FF00", veces=2, duracion_ms=40)
        bombear_after(self.ventana, tope_ms=250)

    def test_constante_de_motion_existe(self):
        self.assertIsInstance(ANIMACIONES_ACTIVAS, bool)
        self.assertIs(c.colores, c.TEMA_OSCURO)
