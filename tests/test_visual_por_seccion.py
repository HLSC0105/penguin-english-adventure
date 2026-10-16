"""Tests visuales por sección.

Crea cada pantalla, hace `update()` y comprueba que aparecen los
elementos clave (encabezado, título, Pipo, barras, botones). Esto sirve
como red de seguridad para detectar regresiones en la interfaz.
"""

import tkinter as tk
import unittest

from tests.soporte_display import asegurar_display

asegurar_display()

from penguin_english.interfaz import componentes as c
from penguin_english.interfaz.ayuda import mostrar_ayuda
from penguin_english.interfaz.intro import mostrar_intro
from penguin_english.interfaz.completar import mostrar_completar
from penguin_english.interfaz.inicio import mostrar_inicio
from penguin_english.interfaz.menu import mostrar_menu
from penguin_english.interfaz.memoria import mostrar_memoria
from penguin_english.interfaz.ordenar import mostrar_ordenar
from penguin_english.interfaz.resultado import mostrar_resultado
from penguin_english.interfaz.trivia import mostrar_trivia
from penguin_english.interfaz.vocabulario import mostrar_vocabulario
from penguin_english.juegos.completar import crear_pregunta
from penguin_english.juegos.memoria import crear_tablero
from penguin_english.juegos.ordenar import crear_palabra
from penguin_english.juegos.trivia import obtener_preguntas
from penguin_english.utilidades import puntuacion

NOMBRE = "Test"


def _dump(v):
    """Devuelve un listado jerárquico de los widgets con su texto."""
    lineas = []

    def rec(w, nivel=0):
        tipo = type(w).__name__
        try:
            text = repr(w.cget("text")) if "text" in w.keys() else ""
        except (tk.TclError, KeyError):
            text = ""
        lineas.append("  " * nivel + f"{tipo} {text}")
        for hijo in w.winfo_children():
            rec(hijo, nivel + 1)

    rec(v)
    return "\n".join(lineas)


def _todos_los_textos(v):
    """Devuelve todos los textos visibles en la ventana."""
    textos = []

    def rec(w):
        try:
            if "text" in w.keys():
                texto = str(w.cget("text"))
                if texto:
                    textos.append(texto)
        except (tk.TclError, KeyError):
            pass
        for hijo in w.winfo_children():
            rec(hijo)

    rec(v)
    return textos


def _contar_botones(v):
    """Cuenta todos los botones visibles en la ventana."""
    n = [0]

    def rec(w):
        if isinstance(w, tk.Button):
            n[0] += 1
        for hijo in w.winfo_children():
            rec(hijo)
    rec(v)
    return n[0]


def _hay_label_con(v, fragmento):
    for t in _todos_los_textos(v):
        if fragmento in t:
            return True
    return False


class PruebasVisualesPorSeccion(unittest.TestCase):
    """Verifica que cada pantalla muestre sus elementos esenciales."""

    @classmethod
    def setUpClass(cls):
        cls.ventana = tk.Tk()
        cls.ventana.geometry("960x680")
        cls.ventana.withdraw()
        c.limpiar_cache_imagenes()
        c.configurar_estilos()

    @classmethod
    def tearDownClass(cls):
        cls.ventana.destroy()

    def setUp(self):
        puntuacion.reiniciar_puntuacion()
        c.tema_actual = "oscuro"
        c.colores = c.TEMA_OSCURO
        c.configurar_estilos()
        c.limpiar_pantalla(self.ventana)
        c.limpiar_cache_imagenes()

    # ------------------------------------------------------------------
    # INICIO
    # ------------------------------------------------------------------

    def test_visual_inicio(self):
        mostrar_inicio(self.ventana)
        self.ventana.update()
        textos = _todos_los_textos(self.ventana)
        self.assertTrue(any("Penguin English Adventure" in t for t in textos))
        self.assertTrue(any("Soy Pipo" in t for t in textos),
                        "Pipo debe presentarse")
        self.assertTrue(any("¿Cómo te llamas?" in t for t in textos))
        self.assertGreaterEqual(_contar_botones(self.ventana), 1,
                                "Debe haber al menos un botón (Comenzar)")

    # ------------------------------------------------------------------
    # MENÚ
    # ------------------------------------------------------------------

    def test_visual_menu(self):
        mostrar_menu(self.ventana, NOMBRE)
        self.ventana.update()
        textos = _todos_los_textos(self.ventana)
        self.assertTrue(any("Aprende inglés con Pipo" in t for t in textos))
        # Las 5 actividades aparecen como botones.
        for actividad in ("Aprender vocabulario", "Trivia", "Completar palabra",
                          "Ordenar palabra", "Juego de memoria"):
            self.assertIn(actividad, textos,
                          f"Falta el botón de '{actividad}' en el menú")
        self.assertIn("¿Cómo jugar?", textos)
        self.assertIn("Salir", textos)
        # La barra de progreso y su etiqueta.
        self.assertTrue(_hay_label_con(self.ventana, "actividades completadas"))

    def test_cascaron_reutiliza_encabezado(self):
        """repintar_pantalla no destruye el Frame del encabezado."""
        mostrar_menu(self.ventana, NOMBRE)
        self.ventana.update()
        header = self.ventana._header
        contenido = self.ventana._contenido
        self.assertEqual(len(self.ventana.winfo_children()), 2)
        c.repintar_pantalla(self.ventana, mostrar_intro, NOMBRE, "trivia")
        self.ventana.update()
        self.assertTrue(header.winfo_exists())
        self.assertIs(header, self.ventana._header)
        self.assertIs(contenido, self.ventana._contenido)
        self.assertTrue(_hay_label_con(self.ventana, "opción múltiple"))

    def test_contenido_desbordado_tiene_canvas_de_scroll(self):
        mostrar_vocabulario(self.ventana, NOMBRE, None, 0)
        self.ventana.update()
        self.assertTrue(hasattr(self.ventana, "_canvas"))
        self.assertTrue(self.ventana._canvas.winfo_exists())
        region = self.ventana._canvas.cget("scrollregion")
        self.assertTrue(region, "Debe haber región de scroll en el listado")

    # ------------------------------------------------------------------
    # AYUDA
    # ------------------------------------------------------------------

    def test_visual_ayuda(self):
        mostrar_ayuda(self.ventana, NOMBRE)
        self.ventana.update()
        textos = _todos_los_textos(self.ventana)
        self.assertIn("¿Cómo jugar?", textos)
        self.assertTrue(any("Aprender vocabulario" in t for t in textos))
        self.assertTrue(_hay_label_con(self.ventana, "10 puntos"),
                        "La ayuda debe mencionar el puntaje")
        self.assertIn("Volver al menú", textos)

    # ------------------------------------------------------------------
    # VOCABULARIO
    # ------------------------------------------------------------------

    def test_visual_vocabulario_categorias(self):
        mostrar_vocabulario(self.ventana, NOMBRE, None, 0)
        self.ventana.update()
        textos = _todos_los_textos(self.ventana)
        # Aparecen las categorías con su conteo entre paréntesis.
        self.assertTrue(any("Animales" in t for t in textos))
        self.assertTrue(any("Colores" in t for t in textos))
        self.assertTrue(any("Frutas" in t for t in textos))

    def test_visual_vocabulario_palabras(self):
        mostrar_vocabulario(self.ventana, NOMBRE, "Animales", 0)
        self.ventana.update()
        textos = _todos_los_textos(self.ventana)
        self.assertTrue(any("DOG" in t or "CAT" in t or "FISH" in t
                            for t in textos),
                        "La página 1 de Animales debe mostrar al menos un animal")

    # ------------------------------------------------------------------
    # TRIVIA
    # ------------------------------------------------------------------

    def test_visual_trivia(self):
        preguntas = obtener_preguntas(3)
        mostrar_trivia(self.ventana, NOMBRE, preguntas, 0, 0, 0, False, None)
        self.ventana.update()
        textos = _todos_los_textos(self.ventana)
        self.assertTrue(_hay_label_con(self.ventana, "Pregunta 1 de 3"))
        # Las 4 opciones etiquetadas con letra.
        self.assertTrue(any(t.startswith("A. ") for t in textos))
        self.assertTrue(any(t.startswith("B. ") for t in textos))
        self.assertTrue(any(t.startswith("C. ") for t in textos))
        self.assertTrue(any(t.startswith("D. ") for t in textos))

    # ------------------------------------------------------------------
    # COMPLETAR
    # ------------------------------------------------------------------

    def test_visual_completar(self):
        pregunta = {"palabra": "HOUSE", "posicion": 2,
                    "opciones": ["S", "U", "X"], "correcta": "U"}
        mostrar_completar(self.ventana, NOMBRE, 0, 8, 0, 0, False,
                          pregunta, None)
        self.ventana.update()
        textos = _todos_los_textos(self.ventana)
        self.assertTrue(_hay_label_con(self.ventana, "H O _ S E"))
        self.assertTrue(_hay_label_con(self.ventana, "Ronda 1 de 8"))
        # Las 3 letras como botones.
        self.assertIn("S", textos)
        self.assertIn("U", textos)
        self.assertIn("X", textos)

    # ------------------------------------------------------------------
    # ORDENAR
    # ------------------------------------------------------------------

    def test_visual_ordenar(self):
        palabra = {"original": "APPLE", "desordenada": ["L", "E", "P", "P", "A"]}
        mostrar_ordenar(self.ventana, NOMBRE, 0, 8, 0, 0, False, palabra, None)
        self.ventana.update()
        textos = _todos_los_textos(self.ventana)
        self.assertIn("L E P P A", textos)
        self.assertIn("Comprobar", textos)
        self.assertTrue(_hay_label_con(self.ventana, "Ronda 1 de 8"))
        self.assertTrue(_hay_label_con(self.ventana, "letras"))

    # ------------------------------------------------------------------
    # MEMORIA
    # ------------------------------------------------------------------

    def test_visual_memoria(self):
        tablero = crear_tablero()
        mostrar_memoria(self.ventana, NOMBRE, tablero, 0, [], 0, False)
        self.ventana.update()
        textos = _todos_los_textos(self.ventana)
        self.assertTrue(_hay_label_con(self.ventana, "Parejas encontradas: 0 de 6"))
        control = self.ventana._control_memoria
        self.assertEqual(control.cantidad(), 12,
                         "El tablero A2 debe tener 12 tarjetas")
        # Pipo da la instrucción.
        self.assertTrue(any("Voltea dos tarjetas" in t for t in textos),
                        "Pipo debe invitar a voltear tarjetas")

    # ------------------------------------------------------------------
    # RESULTADO
    # ------------------------------------------------------------------

    def test_visual_resultado(self):
        puntuacion.puntos = 50
        mostrar_resultado(self.ventana, NOMBRE, "¡Trivia completada!",
                          30, 10, 7)
        self.ventana.update()
        textos = _todos_los_textos(self.ventana)
        self.assertIn("¡Trivia completada!", textos)
        self.assertTrue(_hay_label_con(self.ventana, "Respuestas correctas: 7 de 10"))
        self.assertTrue(_hay_label_con(self.ventana, "Bonificación por terminar: +20 puntos"))
        self.assertTrue(_hay_label_con(self.ventana, "Tus puntos totales:"))
        self.assertIn("Volver al menú", textos)

    # ------------------------------------------------------------------
    # IMÁGENES (smoke)
    # ------------------------------------------------------------------

    def test_visual_pipo_se_carga(self):
        """El pingüino Pipo debe tener una imagen real (no solo fallback)."""
        mostrar_inicio(self.ventana)
        self.ventana.update()
        total = sum(len(d) for d in c.imagenes_guardadas.values())
        self.assertGreater(total, 0,
                           "Debe haberse cargado al menos una imagen (Pipo)")

    def test_visual_vocabulario_imagenes_cargadas(self):
        mostrar_vocabulario(self.ventana, NOMBRE, "Animales", 0)
        self.ventana.update()
        # Sumamos todas las imágenes en cualquier ventana cacheada.
        total = sum(len(d) for d in c.imagenes_guardadas.values())
        self.assertGreater(total, 0,
                           "Al menos una imagen PNG debe estar en caché")


class PruebasImagenes(unittest.TestCase):
    """Pruebas específicas del manejo de imágenes."""

    @classmethod
    def setUpClass(cls):
        cls.ventana1 = tk.Tk()
        cls.ventana1.geometry("960x680")
        cls.ventana1.withdraw()
        cls.ventana2 = tk.Toplevel(cls.ventana1)
        cls.ventana2.geometry("800x600")
        cls.ventana2.withdraw()

    @classmethod
    def tearDownClass(cls):
        cls.ventana1.destroy()

    def setUp(self):
        c.limpiar_cache_imagenes()

    def test_imagenes_multi_maestra_no_reutiliza(self):
        """Cargar la misma imagen en dos ventanas distintas no debe fallar."""
        img1 = c.cargar_imagen(self.ventana1, "pinguino_618.png")
        img2 = c.cargar_imagen(self.ventana2, "pinguino_618.png")
        self.assertIsNotNone(img1, "La imagen debe cargarse en la ventana1")
        self.assertIsNotNone(img2, "La imagen debe cargarse en la ventana2")
        # Los objetos deberían ser distintos (cada uno tiene su propio master).
        self.assertIsNot(img1, img2,
                         "Las dos cargas deben ser objetos distintos")

    def test_cache_comparte_imagen_entre_marco_y_raiz(self):
        """Un Frame no debe forzar otro decode: el master es el Tk raíz."""
        marco = tk.Frame(self.ventana1)
        img_raiz = c.cargar_imagen(self.ventana1, "pinguino_128.png")
        img_marco = c.cargar_imagen(marco, "pinguino_128.png")
        self.assertIsNotNone(img_raiz)
        self.assertIs(img_raiz, img_marco)

    def test_imagen_inexistente_devuelve_none(self):
        img = c.cargar_imagen(self.ventana1, "no_existe_xyz.png")
        self.assertIsNone(img)


class PruebasSonidos(unittest.TestCase):
    """Pruebas para sonidos en múltiples plataformas."""

    def test_sonidos_no_explotan_en_ninguna_plataforma(self):
        from penguin_english.utilidades.sonidos import (
            sonido_clic, sonido_correcto, sonido_error, sonido_ganar)
        # Estas funciones se ejecutan en hilo daemon para no bloquear.
        try:
            sonido_clic()
            sonido_correcto()
            sonido_error()
            sonido_ganar()
        except Exception as ex:
            self.fail(f"Los sonidos no deben lanzar excepciones: {ex}")


class PruebasAnimaciones(unittest.TestCase):
    """Verifica que las funciones de animación no exploten."""

    def setUp(self):
        self.ventana = tk.Tk()
        self.ventana.geometry("800x600")
        self.ventana.withdraw()

    def tearDown(self):
        try:
            self.ventana.destroy()
        except Exception:
            pass

    def test_interpolar_color(self):
        from penguin_english.interfaz.animaciones import interpolar_color
        # Mitad de negro a blanco = gris.
        gris = interpolar_color("#000000", "#FFFFFF", 0.5)
        self.assertEqual(gris, "#808080")
        # Totalmente blanco.
        self.assertEqual(interpolar_color("#000000", "#FFFFFF", 1), "#FFFFFF")
        # Totalmente negro.
        self.assertEqual(interpolar_color("#000000", "#FFFFFF", 0), "#000000")

    def test_fundir_fondo_no_explota(self):
        from penguin_english.interfaz.animaciones import bombear_after, fundir_fondo
        c.tema_actual = "oscuro"
        c.colores = c.TEMA_OSCURO
        self.ventana.configure(bg="#112233")
        llamado = []
        fundir_fondo(self.ventana, "#000000", duracion_ms=80, pasos=3,
                     callback=lambda: llamado.append(True))
        bombear_after(self.ventana, tope_ms=1200)
        self.assertTrue(llamado, "El fundido debe ejecutar el callback")
        self.assertEqual(str(self.ventana.cget("bg")).lower(), "#000000")

    def test_pulsar_widget_callbacks_simple(self):
        from penguin_english.interfaz.animaciones import pulsar_widget
        etiqueta = tk.Label(self.ventana, text="X", bg="#FFFFFF")
        etiqueta.pack()
        pulsar_widget(etiqueta, "#FF0000", "#00FF00", veces=2, duracion_ms=60)


if __name__ == "__main__":
    unittest.main()
