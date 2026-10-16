"""Pruebas del sistema de puntuación y progreso."""

import unittest

from penguin_english.utilidades import puntuacion


class TestPuntuacion(unittest.TestCase):

    def setUp(self):
        # Cada prueba empieza con la puntuación en cero.
        puntuacion.reiniciar_puntuacion()

    def test_respuesta_correcta_suma_10(self):
        puntos_ganados = puntuacion.sumar_respuesta(True)
        self.assertEqual(puntos_ganados, 10)
        self.assertEqual(puntuacion.puntos, 10)

    def test_respuesta_incorrecta_suma_0(self):
        puntos_ganados = puntuacion.sumar_respuesta(False)
        self.assertEqual(puntos_ganados, 0)
        self.assertEqual(puntuacion.puntos, 0)

    def test_contadores_de_respuestas(self):
        puntuacion.sumar_respuesta(True)
        puntuacion.sumar_respuesta(True)
        puntuacion.sumar_respuesta(False)
        self.assertEqual(puntuacion.preguntas_respondidas, 3)
        self.assertEqual(puntuacion.respuestas_correctas, 2)

    def test_porcentaje_de_aciertos(self):
        puntuacion.sumar_respuesta(True)
        puntuacion.sumar_respuesta(True)
        puntuacion.sumar_respuesta(True)
        puntuacion.sumar_respuesta(False)
        self.assertEqual(puntuacion.porcentaje_aciertos(), 75)

    def test_porcentaje_sin_respuestas_es_cero(self):
        self.assertEqual(puntuacion.porcentaje_aciertos(), 0)

    def test_bonificacion(self):
        puntuacion.sumar_bonificacion()
        self.assertEqual(puntuacion.puntos, 20)

    def test_completar_actividad_no_se_repite(self):
        puntuacion.completar_actividad("trivia")
        puntuacion.completar_actividad("trivia")
        self.assertEqual(len(puntuacion.actividades_completadas), 1)

    def test_progreso_cien_por_ciento(self):
        for actividad in ["vocabulario", "trivia", "completar",
                          "ordenar", "memoria"]:
            puntuacion.completar_actividad(actividad)
        self.assertEqual(puntuacion.progreso_porcentaje(), 100)

    def test_progreso_cero(self):
        self.assertEqual(puntuacion.progreso_porcentaje(), 0)

    def test_nivel_por_defecto_es_a2(self):
        self.assertEqual(puntuacion.nivel_actual, "A2")

    def test_establecer_nivel_valido(self):
        self.assertEqual(puntuacion.establecer_nivel("B1"), "B1")
        self.assertEqual(puntuacion.nivel_actual, "B1")
        puntuacion.establecer_nivel("nope")
        self.assertEqual(puntuacion.nivel_actual, "B1")
        puntuacion.reiniciar_puntuacion()
        self.assertEqual(puntuacion.nivel_actual, "A2")


if __name__ == "__main__":
    unittest.main()