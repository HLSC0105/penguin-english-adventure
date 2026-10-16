"""Pruebas minuciosas de la lógica de los juegos (sin interfaz gráfica).

Cubren casos límite y la aleatoriedad de las preguntas: se repiten
muchas veces con semillas fijas para que los resultados sean
reproducibles y se verifica que los datos originales nunca se modifican.
"""

import random
import unittest
from collections import Counter
from pathlib import Path

from penguin_english.datos.niveles import parametros_nivel, parejas_del_nivel
from penguin_english.datos.preguntas import PAREJAS_MEMORIA, PREGUNTAS_TRIVIA
from penguin_english.datos.vocabulario import TODAS_LAS_PALABRAS
from penguin_english.utilidades import puntuacion
from penguin_english.juegos.completar import (crear_pregunta,
                                              mostrar_palabra_con_espacios)
from penguin_english.juegos.memoria import cantidad_parejas, crear_tablero, son_pareja
from penguin_english.juegos.ordenar import crear_palabra, validar_palabra
from penguin_english.juegos.trivia import (CANTIDAD_PREGUNTAS,
                                           obtener_preguntas,
                                           validar_respuesta)

RUTA_IMAGENES = Path(__file__).resolve().parents[1] / "recursos" / "imagenes"


class TestCrearPregunta(unittest.TestCase):
    """Pruebas de las preguntas de completar palabra."""

    def setUp(self):
        puntuacion.reiniciar_puntuacion()

    def test_muchas_preguntas_siempre_validas(self):
        for _ in range(200):
            pregunta = crear_pregunta()
            self.assertIn("palabra", pregunta)
            self.assertIn("posicion", pregunta)
            self.assertIn("opciones", pregunta)
            self.assertIn("correcta", pregunta)
            palabra = pregunta["palabra"]
            self.assertTrue(0 <= pregunta["posicion"] < len(palabra))
            self.assertEqual(len(pregunta["opciones"]), 3)
            self.assertEqual(len(set(pregunta["opciones"])), 3,
                             "Las opciones no deben repetirse")
            self.assertIn(pregunta["correcta"], pregunta["opciones"])
            self.assertEqual(pregunta["correcta"],
                             palabra[pregunta["posicion"]])

    def test_palabra_elegida_esta_en_el_vocabulario(self):
        palabras_vocabulario = {p["ingles"].upper() for p in TODAS_LAS_PALABRAS}
        for _ in range(100):
            palabra = crear_pregunta()["palabra"]
            self.assertIn(palabra, palabras_vocabulario)

    def test_aparecen_posiciones_primera_y_ultima(self):
        primeras = ultimas = 0
        for _ in range(400):
            pregunta = crear_pregunta()
            if pregunta["posicion"] == 0:
                primeras += 1
            if pregunta["posicion"] == len(pregunta["palabra"]) - 1:
                ultimas += 1
        self.assertGreater(primeras, 0, "Nunca faltó la primera letra")
        self.assertGreater(ultimas, 0, "Nunca faltó la última letra")

    def test_reproducible_con_semilla(self):
        random.seed(42)
        primera = crear_pregunta()
        random.seed(42)
        segunda = crear_pregunta()
        self.assertEqual(primera, segunda)

    def test_mostrar_palabra_con_espacios_en_posicion_inicial(self):
        self.assertEqual(mostrar_palabra_con_espacios("APPLE", 0), "_ P P L E")

    def test_mostrar_palabra_con_espacios_en_posicion_final(self):
        self.assertEqual(mostrar_palabra_con_espacios("APPLE", 4), "A P P L _")

    def test_mostrar_palabra_con_espacios_en_medio(self):
        self.assertEqual(mostrar_palabra_con_espacios("APPLE", 3), "A P P _ E")

    def test_mostrar_palabra_con_espacios_letra_repetida(self):
        self.assertEqual(mostrar_palabra_con_espacios("BANANA", 0), "_ A N A N A")

    def test_mostrar_palabra_con_espacios_no_deja_huecos_dobles(self):
        for posicion in range(6):
            self.assertNotIn("  ", mostrar_palabra_con_espacios("APPLE", posicion))


class TestCrearPalabra(unittest.TestCase):
    """Pruebas de las palabras desordenadas del juego de ordenar."""

    def setUp(self):
        puntuacion.reiniciar_puntuacion()

    def test_muchas_palabras_siempre_distintas_y_con_las_mismas_letras(self):
        for _ in range(200):
            palabra = crear_palabra()
            self.assertNotEqual(palabra["desordenada"], palabra["original"])
            self.assertEqual(sorted(palabra["desordenada"]),
                             sorted(palabra["original"]))

    def test_palabra_original_esta_en_el_vocabulario(self):
        palabras_vocabulario = {p["ingles"].upper() for p in TODAS_LAS_PALABRAS}
        for _ in range(100):
            original = crear_palabra()["original"]
            self.assertIn(original, palabras_vocabulario)

    def test_reproducible_con_semilla(self):
        random.seed(7)
        primera = crear_palabra()
        random.seed(7)
        segunda = crear_palabra()
        self.assertEqual(primera, segunda)

    def test_validar_palabra_ignora_espacios_y_mayusculas(self):
        self.assertTrue(validar_palabra("apple", "APPLE"))
        self.assertTrue(validar_palabra("  apple  ", "APPLE"))
        self.assertTrue(validar_palabra("ApPlE", "APPLE"))

    def test_validar_palabra_incorrecta(self):
        self.assertFalse(validar_palabra("aple", "APPLE"))
        self.assertFalse(validar_palabra("", "APPLE"))
        self.assertFalse(validar_palabra("   ", "APPLE"))


class TestTableroMemoria(unittest.TestCase):
    """Pruebas del tablero del juego de memoria."""

    def setUp(self):
        puntuacion.reiniciar_puntuacion()

    def test_a2_usa_seis_parejas(self):
        self.assertEqual(cantidad_parejas(), 6)
        self.assertGreaterEqual(len(PAREJAS_MEMORIA), 8)
        self.assertGreaterEqual(len(parejas_del_nivel("A2")), 6)

    def test_tablero_tiene_dos_tarjetas_por_pareja(self):
        tablero = crear_tablero()
        self.assertEqual(len(tablero), cantidad_parejas() * 2)
        pares = [tarjeta["par"] for tarjeta in tablero]
        self.assertEqual(Counter(pares),
                         Counter(list(range(cantidad_parejas())) * 2))

    def test_cada_pareja_tiene_una_palabra_y_una_imagen(self):
        tablero = crear_tablero()
        for numero_par in range(cantidad_parejas()):
            tarjetas = [t for t in tablero if t["par"] == numero_par]
            self.assertEqual(len(tarjetas), 2)
            palabras = [t for t in tarjetas if t["tipo"] == "palabra"]
            imagenes = [t for t in tarjetas if t["tipo"] == "imagen"]
            self.assertEqual(len(palabras), 1)
            self.assertEqual(len(imagenes), 1)
            self.assertIsNotNone(palabras[0]["texto"])
            self.assertIsNotNone(imagenes[0]["imagen"])

    def test_todas_las_tarjetas_empiezan_ocultas(self):
        tablero = crear_tablero()
        self.assertTrue(all(not t["visible"] for t in tablero))

    def test_son_pareja(self):
        tablero = crear_tablero()
        primera = tablero[0]
        for otra in tablero[1:]:
            self.assertEqual(son_pareja(primera, otra),
                             otra["par"] == primera["par"])

    def test_tablero_se_baraja(self):
        random.seed(1)
        primero = crear_tablero()
        random.seed(2)
        segundo = crear_tablero()
        orden_primero = [t["par"] for t in primero]
        orden_segundo = [t["par"] for t in segundo]
        self.assertNotEqual(orden_primero, orden_segundo,
                            "Dos tableros distintos quedaron en el mismo orden")

    def test_imagenes_de_memoria_existen(self):
        for pareja in PAREJAS_MEMORIA:
            self.assertTrue((RUTA_IMAGENES / pareja["imagen"]).exists(),
                            f"Falta la imagen {pareja['imagen']}")


class TestTrivia(unittest.TestCase):
    """Pruebas de la selección de preguntas de trivia."""

    def setUp(self):
        puntuacion.reiniciar_puntuacion()

    def test_hay_banco_extenso(self):
        self.assertGreaterEqual(len(PREGUNTAS_TRIVIA), 90)

    def test_opciones_unicas_en_cada_pregunta(self):
        for pregunta in PREGUNTAS_TRIVIA:
            self.assertEqual(len(set(pregunta["opciones"])), 4,
                             f"Opción repetida en: {pregunta['pregunta']}")

    def test_cantidad_por_defecto_es_diez(self):
        self.assertEqual(CANTIDAD_PREGUNTAS, 10)
        self.assertEqual(parametros_nivel("A2")["trivia"], 10)

    def test_obtener_preguntas_no_repite(self):
        from penguin_english.datos.niveles import preguntas_del_nivel
        banco = preguntas_del_nivel()
        preguntas = obtener_preguntas(len(banco))
        textos = [p["pregunta"] for p in preguntas]
        self.assertEqual(len(preguntas), len(banco))
        self.assertEqual(len(textos), len(set(textos)))

    def test_obtener_preguntas_no_modifica_las_originales(self):
        originales = [list(p["opciones"]) for p in PREGUNTAS_TRIVIA]
        obtener_preguntas(10)
        for pregunta, opciones_originales in zip(PREGUNTAS_TRIVIA, originales):
            self.assertEqual(pregunta["opciones"], opciones_originales)

    def test_cada_copia_mantiene_la_respuesta_correcta(self):
        for pregunta in obtener_preguntas(10):
            self.assertIn(pregunta["correcta"], pregunta["opciones"])
            self.assertEqual(pregunta["explicacion"], "" if False else
                             PREGUNTAS_TRIVIA[
                                 [p["pregunta"] for p in PREGUNTAS_TRIVIA]
                                 .index(pregunta["pregunta"])]["explicacion"])

    def test_reproducible_con_semilla(self):
        random.seed(3)
        primera = obtener_preguntas(10)
        random.seed(3)
        segunda = obtener_preguntas(10)
        self.assertEqual(primera, segunda)

    def test_validar_respuesta_inexistente(self):
        pregunta = PREGUNTAS_TRIVIA[0]
        self.assertFalse(validar_respuesta(pregunta, "Opción que no existe"))


if __name__ == "__main__":
    unittest.main()