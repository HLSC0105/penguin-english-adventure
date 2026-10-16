"""Pruebas de las preguntas y de la lógica de los juegos."""

import unittest

from penguin_english.datos.niveles import NIVELES
from penguin_english.datos.preguntas import (MENSAJES_PIPO, PAREJAS_MEMORIA,
                                             PREGUNTAS_TRIVIA, mensaje_pipo)
from penguin_english.utilidades import puntuacion
from penguin_english.juegos.completar import (crear_pregunta,
                                              mostrar_palabra_con_espacios)
from penguin_english.juegos.memoria import cantidad_parejas, crear_tablero, son_pareja
from penguin_english.juegos.ordenar import crear_palabra, validar_palabra
from penguin_english.juegos.trivia import obtener_preguntas, validar_respuesta


class TestTrivia(unittest.TestCase):

    def test_preguntas_tienen_cuatro_opciones(self):
        for pregunta in PREGUNTAS_TRIVIA:
            self.assertEqual(len(pregunta["opciones"]), 4)
            self.assertIn(pregunta["correcta"], pregunta["opciones"])
            self.assertNotEqual(pregunta["explicacion"], "")
            self.assertIn(pregunta["nivel"], NIVELES)

    def test_obtener_preguntas_devuelve_cantidad_pedida(self):
        preguntas = obtener_preguntas(10)
        self.assertEqual(len(preguntas), 10)

    def test_obtener_preguntas_no_repite(self):
        preguntas = obtener_preguntas(10)
        textos = [pregunta["pregunta"] for pregunta in preguntas]
        self.assertEqual(len(textos), len(set(textos)))

    def test_validar_respuesta(self):
        pregunta = PREGUNTAS_TRIVIA[0]
        self.assertTrue(validar_respuesta(pregunta, pregunta["correcta"]))
        self.assertFalse(validar_respuesta(pregunta, "Opción falsa"))


class TestCompletar(unittest.TestCase):

    def setUp(self):
        puntuacion.reiniciar_puntuacion()

    def test_pregunta_tiene_tres_opciones_y_la_correcta(self):
        pregunta = crear_pregunta()
        self.assertEqual(len(pregunta["opciones"]), 3)
        self.assertIn(pregunta["correcta"], pregunta["opciones"])

    def test_letra_correcta_coincide_con_la_palabra(self):
        pregunta = crear_pregunta()
        self.assertEqual(pregunta["correcta"], pregunta["palabra"][pregunta["posicion"]])

    def test_mostrar_palabra_con_espacios(self):
        texto = mostrar_palabra_con_espacios("APPLE", 3)
        self.assertEqual(texto, "A P P _ E")


class TestOrdenar(unittest.TestCase):

    def setUp(self):
        puntuacion.reiniciar_puntuacion()

    def test_palabra_desordenada_es_diferente(self):
        palabra = crear_palabra()
        self.assertNotEqual(palabra["desordenada"], palabra["original"])

    def test_palabra_desordenada_tiene_las_mismas_letras(self):
        palabra = crear_palabra()
        letras_original = sorted(palabra["original"])
        letras_desordenadas = sorted(palabra["desordenada"])
        self.assertEqual(letras_original, letras_desordenadas)

    def test_validar_palabra(self):
        self.assertTrue(validar_palabra("  apple ", "APPLE"))
        self.assertFalse(validar_palabra("orange", "APPLE"))


class TestMemoria(unittest.TestCase):

    def setUp(self):
        puntuacion.reiniciar_puntuacion()

    def test_tablero_tiene_dos_tarjetas_por_pareja(self):
        tablero = crear_tablero()
        self.assertEqual(len(tablero), cantidad_parejas() * 2)

    def test_son_pareja(self):
        tablero = crear_tablero()
        primera = tablero[0]
        for tarjeta in tablero[1:]:
            if tarjeta["par"] == primera["par"]:
                self.assertTrue(son_pareja(primera, tarjeta))
                return
        self.fail("No se encontró la pareja de la primera tarjeta")


class TestMensajesPipo(unittest.TestCase):

    def test_mensaje_existe_en_la_lista(self):
        for clave in MENSAJES_PIPO.keys():
            mensaje = mensaje_pipo(clave)
            self.assertIn(mensaje, MENSAJES_PIPO[clave])

    def test_parejas_memoria_tienen_palabra_e_imagen(self):
        for pareja in PAREJAS_MEMORIA:
            self.assertNotEqual(pareja["ingles"], "")
            self.assertNotEqual(pareja["imagen"], "")
            self.assertIn(pareja["nivel"], NIVELES)


if __name__ == "__main__":
    unittest.main()