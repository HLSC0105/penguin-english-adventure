"""Recorrido de punta a punta: main.crear_ventana y las cinco actividades."""

import os
import unittest

os.environ.setdefault("TK_SILENCE_DEPRECATION", "1")

from tests.soporte_display import asegurar_display

asegurar_display()

import tkinter as tk

from penguin_english.datos.niveles import preguntas_del_nivel, palabras_jugables
from penguin_english.juegos.completar import cantidad_rondas as rondas_completar
from penguin_english.juegos.ordenar import cantidad_rondas as rondas_ordenar
from penguin_english.juegos.trivia import cantidad_preguntas
from penguin_english.interfaz import componentes as c
from penguin_english.main import crear_ventana
from penguin_english.utilidades import puntuacion
from tests.test_ui_ux import (buscar, clic, entrar_actividad, esperar, hay_texto,
                              hay_texto_en_alguna_etiqueta, letra_correcta_de_pantalla,
                              tarjetas)


class PruebasE2E(unittest.TestCase):

    def setUp(self):
        c.tema_actual = "claro"
        c.colores = c.TEMA_CLARO
        self.ventana = crear_ventana()
        self.ventana.withdraw()
        self.ventana.update()
        self.addCleanup(self._cerrar)

    def _cerrar(self):
        try:
            self.ventana.destroy()
        except Exception:
            pass
        tk._default_root = None

    def test_crear_ventana_muestra_inicio(self):
        self.assertTrue(hay_texto(self.ventana, "Penguin English Adventure"))
        self.assertIsNotNone(buscar(self.ventana, tk.Entry))
        self.assertEqual(self.ventana.minsize(), (1280, 720))

    def test_flujo_completo_con_nivel_y_tema(self):
        buscar(self.ventana, tk.Entry).insert(0, "Ana")
        clic(self.ventana, "¡Comenzar!")
        self.assertTrue(hay_texto(self.ventana, "Nivel: A2"))

        clic(self.ventana, "B1")
        self.assertTrue(hay_texto(self.ventana, "Nivel: B1"))
        clic(self.ventana, "A2")
        self.assertTrue(hay_texto(self.ventana, "Nivel: A2"))

        clic(self.ventana, "¿Cómo jugar?")
        self.assertTrue(hay_texto_en_alguna_etiqueta(self.ventana, "CEFR"))
        clic(self.ventana, "Volver al menú")

        entrar_actividad(self.ventana, "Aprender vocabulario")
        clic(self.ventana, prefijo="Animales")
        self.assertTrue(hay_texto_en_alguna_etiqueta(self.ventana, "Página 1"))
        clic(self.ventana, "Menú")

        entrar_actividad(self.ventana, "Trivia")
        for _ in range(cantidad_preguntas()):
            textos = []
            def rec(w):
                for h in w.winfo_children():
                    if isinstance(h, tk.Label):
                        textos.append(h.cget("text"))
                    rec(h)
            rec(self.ventana)
            banco = {p["pregunta"]: p for p in preguntas_del_nivel()}
            pregunta = next((banco[t] for t in textos if t in banco), None)
            self.assertIsNotNone(pregunta)
            clic(self.ventana, sufijo=pregunta["correcta"])
            clic(self.ventana, "Siguiente")
        self.assertTrue(hay_texto(self.ventana, "¡Trivia completada!"))
        clic(self.ventana, "Volver al menú")

        entrar_actividad(self.ventana, "Completar palabra")
        for _ in range(rondas_completar()):
            clic(self.ventana, letra_correcta_de_pantalla(self.ventana))
            clic(self.ventana, "Siguiente")
        self.assertTrue(hay_texto(self.ventana, "¡Completar palabra terminado!"))
        clic(self.ventana, "Volver al menú")

        entrar_actividad(self.ventana, "Ordenar palabra")
        for _ in range(rondas_ordenar()):
            etiquetas = []
            def rec2(w):
                for h in w.winfo_children():
                    if isinstance(h, tk.Label) and " " in h.cget("text"):
                        etiquetas.append(h.cget("text"))
                    rec2(h)
            rec2(self.ventana)
            letras = None
            for texto in etiquetas:
                partes = texto.split()
                if len(partes) > 1 and all(len(p) == 1 for p in partes):
                    letras = partes
                    break
            solucion = next(
                p["ingles"].upper() for p in palabras_jugables()
                if sorted(p["ingles"].upper()) == sorted(letras))
            buscar(self.ventana, tk.Entry).insert(0, solucion)
            clic(self.ventana, "Comprobar")
            clic(self.ventana, "Siguiente")
        self.assertTrue(hay_texto(self.ventana, "¡Ordenar palabra terminado!"))
        clic(self.ventana, "Volver al menú")

        entrar_actividad(self.ventana, "Juego de memoria")
        control = self.ventana._control_memoria
        tablero = control.tablero
        pares = max(t["par"] for t in tablero) + 1
        for par in range(pares):
            indices = [i for i, t in enumerate(tablero) if t["par"] == par]
            tarjetas(self.ventana)[indices[0]].invoke()
            self.ventana.update()
            tarjetas(self.ventana)[indices[1]].invoke()
            self.ventana.update()
            esperar(self.ventana, 0.7)
        esperar(self.ventana, 0.6)
        self.assertTrue(hay_texto(self.ventana, "¡Juego de memoria terminado!"))
        clic(self.ventana, "Modo oscuro")
        esperar(self.ventana, 0.5)
        self.assertEqual(str(self.ventana.cget("bg")).lower(), "#000000")
        clic(self.ventana, "Volver al menú")

        self.assertEqual(puntuacion.progreso_porcentaje(), 100)
        self.assertEqual(len(puntuacion.actividades_completadas), 5)
        self.assertGreater(puntuacion.puntos, 0)
