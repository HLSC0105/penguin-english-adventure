"""Pruebas minuciosas de interfaz, usabilidad y funcionalidad.

Requieren un servidor gráfico (X11/Wayland/Xvfb). Cada prueba simula
los clics y el teclado de un jugador real sobre la ventana del juego.

Cómo ejecutarlas:
    uv run python -m unittest tests.test_ui_ux -v
"""

import os
import random
import time
import unittest

os.environ.setdefault("TK_SILENCE_DEPRECATION", "1")

from tests.soporte_display import asegurar_display

asegurar_display()

import tkinter as tk

tk._default_root = None

from penguin_english.datos.niveles import categorias_del_nivel, palabras_jugables
from penguin_english.datos.vocabulario import TODAS_LAS_PALABRAS
from penguin_english.interfaz.vocabulario import PALABRAS_POR_PAGINA
from penguin_english.interfaz import componentes as c
from penguin_english.interfaz.completar import mostrar_completar
from penguin_english.interfaz.inicio import mostrar_inicio
from penguin_english.interfaz.memoria import mostrar_memoria
from penguin_english.interfaz.menu import mostrar_menu
from penguin_english.interfaz.ordenar import mostrar_ordenar
from penguin_english.interfaz.resultado import mostrar_resultado
from penguin_english.interfaz.trivia import mostrar_trivia
from penguin_english.interfaz.vocabulario import mostrar_vocabulario
from penguin_english.juegos.memoria import crear_tablero
from penguin_english.juegos.trivia import obtener_preguntas
from penguin_english.utilidades import puntuacion

NOMBRE = "Ana"


def buscar(raiz, tipo, texto=None, prefijo=None, sufijo=None):
    """Busca un widget en el árbol de la ventana (búsqueda en profundidad)."""
    for hijo in raiz.winfo_children():
        if isinstance(hijo, tipo):
            if texto is None and prefijo is None and sufijo is None:
                return hijo
            texto_hijo = hijo.cget("text")
            if prefijo is not None and texto_hijo.startswith(prefijo):
                return hijo
            if sufijo is not None and texto_hijo.endswith(sufijo):
                return hijo
            if texto is not None and texto_hijo == texto:
                return hijo
    for hijo in raiz.winfo_children():
        resultado = buscar(hijo, tipo, texto, prefijo, sufijo)
        if resultado is not None:
            return resultado
    return None


def entrar_actividad(ventana, nombre):
    """Abre la actividad desde el menú, pasando por la ayuda previa."""
    clic(ventana, nombre)
    clic(ventana, "Empezar")


def clic(ventana, texto=None, prefijo=None, sufijo=None):
    """Hace clic (invoke) en un botón y deja que Tk repinte."""
    boton = buscar(ventana, tk.Button, texto=texto, prefijo=prefijo, sufijo=sufijo)
    if boton is None:
        textos = []
        def recorrer(raiz):
            for hijo in raiz.winfo_children():
                if isinstance(hijo, tk.Button):
                    textos.append(hijo.cget("text"))
                recorrer(hijo)
        recorrer(ventana)
        raise AssertionError(
            f"No se encontró el botón '{texto or prefijo or sufijo}'. "
            f"Botones visibles: {textos}")
    boton.invoke()
    try:
        ventana.update()
    except tk.TclError:
        pass


def esperar(ventana, segundos):
    """Mantiene viva la interfaz durante un tiempo (para los volteos)."""
    fin = time.time() + segundos
    while time.time() < fin:
        try:
            ventana.update()
        except tk.TclError:
            break
        time.sleep(0.03)


def hay_texto(ventana, texto):
    """Comprueba que alguna etiqueta tenga exactamente el texto indicado."""
    return buscar(ventana, tk.Label, texto=texto) is not None


def hay_texto_en_alguna_etiqueta(ventana, fragmento):
    """Comprueba que alguna etiqueta contenga el fragmento de texto."""
    def recorrer(raiz):
        for hijo in raiz.winfo_children():
            if isinstance(hijo, tk.Label) and fragmento in hijo.cget("text"):
                return True
            if recorrer(hijo):
                return True
        return False
    return recorrer(ventana)


def marco_tablero(ventana):
    """Devuelve el marco con más botones (el tablero de memoria)."""
    candidatos = []
    def recorrer(raiz):
        for hijo in raiz.winfo_children():
            if isinstance(hijo, tk.Frame):
                botones = [b for b in hijo.winfo_children()
                           if isinstance(b, tk.Button)]
                if len(botones) >= 6:
                    candidatos.append((len(botones), hijo))
            recorrer(hijo)
    recorrer(ventana)
    assert candidatos, "No se encontró el tablero de memoria"
    return max(candidatos, key=lambda x: x[0])[1]


def tarjetas(ventana):
    """Devuelve proxies invocables de cada carta del tablero de memoria."""
    control = getattr(ventana, "_control_memoria", None)
    if control is not None:
        return control.proxies()
    return marco_tablero(ventana).winfo_children()


def letra_correcta_de_pantalla(ventana):
    """Deduce la letra que falta en completar leyendo la palabra mostrada.

    La pantalla muestra la palabra con espacios y un guion bajo en la
    letra que falta (ejemplo: "A P P _ E"). Buscamos en el vocabulario
    la palabra que coincide en las posiciones visibles y devolvemos la
    letra de la posición del guion.

    Si hay ambigüedad (p. ej. "C A _" puede ser CAT o CAR), elegimos la
    letra que SÍ está entre los botones de letras visibles, porque el
    juego garantiza que la respuesta correcta siempre aparece como opción.
    """
    etiquetas = []

    def recorrer(raiz):
        for hijo in raiz.winfo_children():
            if isinstance(hijo, tk.Label) and "_" in hijo.cget("text"):
                etiquetas.append(hijo.cget("text"))
            recorrer(hijo)

    opciones_visibles = set()
    def recolectar_opciones(raiz):
        for hijo in raiz.winfo_children():
            if isinstance(hijo, tk.Button) and len(hijo.cget("text")) == 1:
                opciones_visibles.add(hijo.cget("text"))
            recolectar_opciones(hijo)
    recolectar_opciones(ventana)

    recorrer(ventana)
    for texto in etiquetas:
        # Quitamos espacios para soportar palabras con espacio interno
        # como "police officer" (su label es "_ O T H E R   O F F I C E R").
        texto_limpio = texto.replace(" ", "")
        if "_" not in texto_limpio or len(texto_limpio) < 2:
            continue
        posicion = texto_limpio.index("_")
        candidatos = []
        for info in TODAS_LAS_PALABRAS:
            palabra = info["ingles"].upper().replace(" ", "")
            if len(palabra) != len(texto_limpio):
                continue
            if all(c == "_" or palabra[i] == c
                   for i, c in enumerate(texto_limpio)):
                candidatos.append(palabra[posicion])
        if not candidatos:
            continue
        # Preferimos la letra que aparece entre los botones visibles.
        for letra in candidatos:
            if letra in opciones_visibles:
                return letra
        return candidatos[0]
    return None


class PruebasUIUX(unittest.TestCase):
    """Suite de pruebas de la interfaz gráfica del juego."""

    @classmethod
    def setUpClass(cls):
        cls.ventana = tk.Tk()
        cls.ventana.geometry("960x680")
        cls.ventana.withdraw()
        c.configurar_estilos()

    @classmethod
    def tearDownClass(cls):
        cls.ventana.destroy()

    def setUp(self):
        # Cada prueba empieza desde cero: sin puntos y tema claro.
        puntuacion.reiniciar_puntuacion()
        c.tema_actual = "claro"
        c.colores = c.TEMA_CLARO
        c.configurar_estilos()
        c.limpiar_pantalla(self.ventana)
        self.ventana.configure(bg=c.obtener_color("fondo"))

    # ------------------------------------------------------------------
    # PANTALLA DE INICIO
    # ------------------------------------------------------------------

    def test_inicio_nombre_vacio_muestra_error(self):
        mostrar_inicio(self.ventana)
        self.ventana.update()
        clic(self.ventana, "¡Comenzar!")
        self.assertTrue(
            hay_texto(self.ventana, "Escribe tu nombre para continuar."),
            "Debe avisarse cuando el nombre está vacío")

    def test_inicio_nombre_con_espacios_se_recorta(self):
        mostrar_inicio(self.ventana)
        self.ventana.update()
        buscar(self.ventana, tk.Entry).insert(0, "   Ana   ")
        clic(self.ventana, "¡Comenzar!")
        self.assertTrue(
            hay_texto(self.ventana, "Jugador: Ana"),
            "El nombre con espacios debe recortarse al pasar al menú")

    def test_inicio_tecla_enter_comienza(self):
        mostrar_inicio(self.ventana)
        self.ventana.update()
        buscar(self.ventana, tk.Entry).insert(0, "Ana")
        self.ventana.focus_set()
        self.ventana.event_generate("<Return>")
        self.ventana.update()
        self.assertTrue(hay_texto(self.ventana, "Penguin English Adventure"),
                        "La tecla Enter debe comenzar el juego")

    # ------------------------------------------------------------------
    # MENÚ PRINCIPAL
    # ------------------------------------------------------------------

    def test_menu_muestra_las_cinco_actividades_y_cero_progreso(self):
        mostrar_menu(self.ventana, NOMBRE)
        self.ventana.update()
        for actividad in ["Aprender vocabulario", "Trivia",
                          "Completar palabra", "Ordenar palabra",
                          "Juego de memoria"]:
            self.assertIsNotNone(buscar(self.ventana, tk.Button, texto=actividad),
                                 f"Falta el botón '{actividad}' en el menú")
        self.assertTrue(
            hay_texto(self.ventana, "0 de 5 actividades completadas (0%)"),
            "El progreso debe empezar en 0 de 5")

    def test_encabezado_muestra_nombre_puntos_y_aciertos(self):
        mostrar_menu(self.ventana, NOMBRE)
        self.ventana.update()
        self.assertTrue(hay_texto(self.ventana, f"Jugador: {NOMBRE}"))
        self.assertTrue(hay_texto(self.ventana, "Puntos: 0"))
        self.assertTrue(hay_texto(self.ventana, "Aciertos: 0%"))
        self.assertTrue(hay_texto(self.ventana, "Nivel: A2"))

    def test_menu_tema_oscuro_fondo_negro_profundo(self):
        mostrar_menu(self.ventana, NOMBRE)
        self.ventana.update()
        clic(self.ventana, "Modo oscuro")
        esperar(self.ventana, 0.5)  # animación de fundido
        self.assertEqual(str(self.ventana.cget("bg")).lower(), "#000000",
                         "El tema oscuro debe usar negro profundo")
        self.assertEqual(c.tema_actual, "oscuro")
        clic(self.ventana, "Modo claro")
        esperar(self.ventana, 0.5)  # animación de fundido
        self.assertEqual(c.tema_actual, "claro")
        self.assertTrue(hay_texto(self.ventana, "Penguin English Adventure"),
                        "Tras cambiar el tema debe seguir viéndose el menú")

    def test_intro_volver_no_inicia_la_actividad(self):
        mostrar_menu(self.ventana, NOMBRE)
        self.ventana.update()
        clic(self.ventana, "Trivia")
        self.assertTrue(hay_texto_en_alguna_etiqueta(
            self.ventana, "opción múltiple"))
        self.assertNotIn("trivia", puntuacion.actividades_completadas)
        clic(self.ventana, "Volver al menú")
        self.assertTrue(hay_texto(self.ventana, "Penguin English Adventure"))
        self.assertIsNotNone(buscar(self.ventana, tk.Button, texto="Trivia"))

    def test_ayuda_muestra_instrucciones_y_vuelve_al_menu(self):
        mostrar_menu(self.ventana, NOMBRE)
        self.ventana.update()
        clic(self.ventana, "¿Cómo jugar?")
        self.assertTrue(hay_texto(self.ventana, "¿Cómo jugar?"))
        self.assertTrue(
            hay_texto_en_alguna_etiqueta(self.ventana, "10 puntos"),
            "La ayuda debe explicar cuánto valen las respuestas")
        self.assertTrue(
            hay_texto_en_alguna_etiqueta(self.ventana, "bonificación"))
        clic(self.ventana, "Volver al menú")
        self.assertTrue(hay_texto(self.ventana, "Penguin English Adventure"))

    # ------------------------------------------------------------------
    # VOCABULARIO
    # ------------------------------------------------------------------

    def test_vocabulario_muestra_las_categorias_del_nivel(self):
        mostrar_vocabulario(self.ventana, NOMBRE, None, 0)
        self.ventana.update()
        self.assertTrue(hay_texto(self.ventana, "Aprender vocabulario"))
        botones = []
        def recolectar(raiz):
            for hijo in raiz.winfo_children():
                if isinstance(hijo, tk.Button):
                    botones.append(hijo.cget("text"))
                recolectar(hijo)
        recolectar(self.ventana)
        esperadas = categorias_del_nivel()
        categorias = [b for b in botones if "(" in b and ")" in b]
        self.assertGreaterEqual(len(categorias), 15)
        self.assertEqual(len(categorias), len(esperadas))

    def test_vocabulario_paginacion_con_flechas(self):
        palabras = categorias_del_nivel()["Animales"]
        total = max(1, (len(palabras) + PALABRAS_POR_PAGINA - 1) // PALABRAS_POR_PAGINA)
        mostrar_vocabulario(self.ventana, NOMBRE, "Animales", 0)
        self.ventana.update()
        self.assertTrue(hay_texto(self.ventana, f"Página 1 de {total}"))
        self.assertIsNone(buscar(self.ventana, tk.Button, texto="◀ Anterior"),
                          "En la primera página no debe verse 'Anterior'")
        if total == 1:
            self.assertIsNotNone(buscar(self.ventana, tk.Button,
                                        texto="Volver al listado"))
        else:
            self.assertIsNone(buscar(self.ventana, tk.Button,
                                     texto="Volver al listado"),
                              "Volver al listado solo en la última página")
            self.assertIsNotNone(buscar(self.ventana, tk.Button,
                                        texto="Siguiente ▶"))
            clic(self.ventana, "Siguiente ▶")
            self.assertTrue(hay_texto(self.ventana, f"Página 2 de {total}"))
            self.assertIsNone(buscar(self.ventana, tk.Button,
                                     texto="Volver al listado"),
                              "En páginas intermedias no debe aparecer Volver")
            clic(self.ventana, "◀ Anterior")
            self.assertTrue(hay_texto(self.ventana, f"Página 1 de {total}"))
            c.repintar_pantalla(self.ventana, mostrar_vocabulario,
                                NOMBRE, "Animales", total - 1)
            self.ventana.update()
            self.assertIsNone(
                buscar(self.ventana, tk.Button, texto="Siguiente ▶"),
                "En la última página no debe verse 'Siguiente'")
            self.assertIsNotNone(buscar(self.ventana, tk.Button,
                                        texto="◀ Anterior"))
            self.assertIsNotNone(buscar(self.ventana, tk.Button,
                                        texto="Volver al listado"),
                                 "Al terminar las páginas aparece Volver al listado")

    def test_vocabulario_tarjetas_muestran_ingles_espanol_y_ejemplo(self):
        mostrar_vocabulario(self.ventana, NOMBRE, "Animales", 0)
        self.ventana.update()
        from penguin_english.datos.vocabulario import CATEGORIAS
        primera = CATEGORIAS["Animales"][0]
        self.assertTrue(hay_texto(self.ventana, primera["ingles"].upper()),
                        "La tarjeta debe mostrar la palabra en inglés")
        self.assertTrue(hay_texto(self.ventana, primera["espanol"]),
                        "La tarjeta debe mostrar la traducción")
        self.assertTrue(
            hay_texto_en_alguna_etiqueta(self.ventana, primera["ejemplo"]),
            "La tarjeta debe mostrar un ejemplo de uso")

    def test_vocabulario_desde_menu_marca_la_actividad(self):
        mostrar_menu(self.ventana, NOMBRE)
        self.ventana.update()
        clic(self.ventana, "Aprender vocabulario")
        self.assertNotIn("vocabulario", puntuacion.actividades_completadas)
        self.assertTrue(hay_texto_en_alguna_etiqueta(
            self.ventana, "tarjetas con una imagen"))
        clic(self.ventana, "Empezar")
        self.assertIn("vocabulario", puntuacion.actividades_completadas)
        self.assertEqual(puntuacion.progreso_porcentaje(), 20)

    def test_vocabulario_tema_oscuro_conserva_la_pantalla(self):
        mostrar_vocabulario(self.ventana, NOMBRE, "Frutas", 0)
        self.ventana.update()
        palabras = categorias_del_nivel()["Frutas"]
        total = max(1, (len(palabras) + PALABRAS_POR_PAGINA - 1) // PALABRAS_POR_PAGINA)
        clic(self.ventana, "Modo oscuro")
        esperar(self.ventana, 0.5)
        self.assertEqual(str(self.ventana.cget("bg")).lower(), "#000000")
        self.assertTrue(hay_texto(self.ventana, f"Página 1 de {total}"),
                        "El tema debe redibujar el vocabulario, no otra pantalla")

    # ------------------------------------------------------------------
    # TRIVIA
    # ------------------------------------------------------------------

    PREGUNTA_APPLE = {"pregunta": "¿Qué significa \"APPLE\"?",
                      "opciones": ["Perro", "Manzana", "Casa", "Libro"],
                      "correcta": "Manzana",
                      "explicacion": "Apple significa manzana."}

    def test_trivia_respuesta_correcta_suma_diez(self):
        mostrar_trivia(self.ventana, NOMBRE, [self.PREGUNTA_APPLE],
                       0, 0, 0, False, None)
        self.ventana.update()
        clic(self.ventana, sufijo="Manzana")
        self.assertTrue(hay_texto(self.ventana, "¡Correcto! +10 puntos"))
        self.assertEqual(puntuacion.puntos, 10)
        self.assertEqual(puntuacion.preguntas_respondidas, 1)
        self.assertEqual(puntuacion.respuestas_correctas, 1)

    def test_trivia_respuesta_incorrecta_muestra_explicacion(self):
        mostrar_trivia(self.ventana, NOMBRE, [self.PREGUNTA_APPLE],
                       0, 0, 0, False, None)
        self.ventana.update()
        clic(self.ventana, sufijo="Perro")
        esperar(self.ventana, 0.25)
        self.assertTrue(
            hay_texto(self.ventana, "¡Incorrecto! La respuesta era: Manzana"))
        self.assertEqual(puntuacion.puntos, 0)
        self.assertTrue(
            hay_texto_en_alguna_etiqueta(self.ventana, "Apple significa manzana."),
            "Pipo debe explicar la respuesta correcta")
        boton_correcta = buscar(self.ventana, tk.Button, sufijo="Manzana")
        self.assertEqual(boton_correcta.cget("bg"), c.obtener_color("correcto"),
                         "La opción correcta debe verse en verde")
        boton_elegida = buscar(self.ventana, tk.Button, sufijo="Perro")
        self.assertEqual(boton_elegida.cget("bg"), c.obtener_color("incorrecto"),
                         "La opción elegida (mala) debe verse en rojo")

    def test_trivia_completa_diez_preguntas_con_bonificacion(self):
        preguntas = obtener_preguntas(10)
        mostrar_trivia(self.ventana, NOMBRE, preguntas, 0, 0, 0, False, None)
        self.ventana.update()
        for numero, pregunta in enumerate(preguntas):
            clic(self.ventana, sufijo=pregunta["correcta"])
            self.assertTrue(hay_texto(self.ventana, "¡Correcto! +10 puntos"),
                            f"Debe aparecer el aviso de acierto en la pregunta {numero}")
            clic(self.ventana, "Siguiente")
        self.assertTrue(hay_texto(self.ventana, "¡Trivia completada!"))
        self.assertTrue(
            hay_texto_en_alguna_etiqueta(
                self.ventana, "Respuestas correctas: 10 de 10 (100%)"),
            "El resultado debe resumir los aciertos")
        self.assertEqual(puntuacion.puntos, 10 * 10 + 20,
                         "10 aciertos (10 c/u) + 20 de bonificación")
        self.assertIn("trivia", puntuacion.actividades_completadas)

    def test_trivia_tema_oscuro_durante_el_feedback(self):
        pregunta = {"pregunta": "¿Qué significa \"SUN\"?",
                    "opciones": ["Luna", "Sol", "Estrella", "Nube"],
                    "correcta": "Sol",
                    "explicacion": "Sun significa sol."}
        mostrar_trivia(self.ventana, NOMBRE, [pregunta], 0, 0, 0, False, None)
        self.ventana.update()
        clic(self.ventana, sufijo="Sol")
        clic(self.ventana, "Modo oscuro")
        esperar(self.ventana, 0.5)
        self.assertEqual(str(self.ventana.cget("bg")).lower(), "#000000")
        self.assertTrue(hay_texto(self.ventana, "¡Correcto! +10 puntos"),
                        "El cambio de tema no debe perder el feedback")

    def test_trivia_boton_menu_desde_una_pregunta(self):
        preguntas = obtener_preguntas(10)
        mostrar_trivia(self.ventana, NOMBRE, preguntas, 3, 0, 0, False, None)
        self.ventana.update()
        clic(self.ventana, "Menú")
        self.assertTrue(hay_texto(self.ventana, "Penguin English Adventure"),
                        "Debe volverse al menú sin terminar la trivia")

    # ------------------------------------------------------------------
    # COMPLETAR PALABRA
    # ------------------------------------------------------------------

    PREGUNTA_APPLE_L = {"palabra": "APPLE", "posicion": 3, "correcta": "L",
                        "opciones": ["L", "X", "Z"]}

    def test_completar_letra_correcta_suma_diez(self):
        mostrar_completar(self.ventana, NOMBRE, 0, 8, 0, 0, False,
                          self.PREGUNTA_APPLE_L, None)
        self.ventana.update()
        clic(self.ventana, "L")
        self.assertTrue(hay_texto(self.ventana, "¡Correcto! +10 puntos"))
        self.assertTrue(hay_texto(self.ventana, "La palabra completa es: APPLE"))
        self.assertEqual(puntuacion.puntos, 10)

    def test_completar_letra_incorrecta_no_suma(self):
        mostrar_completar(self.ventana, NOMBRE, 0, 8, 0, 0, False,
                          self.PREGUNTA_APPLE_L, None)
        self.ventana.update()
        clic(self.ventana, "X")
        esperar(self.ventana, 0.25)
        self.assertTrue(hay_texto(self.ventana, "¡Incorrecto! La letra era: L"))
        self.assertEqual(puntuacion.puntos, 0)
        boton_correcta = buscar(self.ventana, tk.Button, texto="L")
        self.assertEqual(boton_correcta.cget("bg"), c.obtener_color("correcto"))

    def test_completar_completo_ocho_rondas(self):
        mostrar_menu(self.ventana, NOMBRE)
        self.ventana.update()
        entrar_actividad(self.ventana, "Completar palabra")
        self.assertTrue(hay_texto(self.ventana, "Ronda 1 de 8"))
        for ronda in range(8):
            if ronda > 0:
                self.assertTrue(
                    hay_texto(self.ventana, f"Ronda {ronda + 1} de 8"),
                    f"Falta la ronda {ronda + 1}")
            opciones = []
            def recolectar(raiz):
                for hijo in raiz.winfo_children():
                    if isinstance(hijo, tk.Button) and len(hijo.cget("text")) == 1:
                        opciones.append(hijo.cget("text"))
                    recolectar(hijo)
            recolectar(self.ventana)
            self.assertEqual(len(opciones), 3, "Deben verse 3 letras para elegir")
            correcta = letra_correcta_de_pantalla(self.ventana)
            self.assertIsNotNone(correcta, "Debe poder deducirse la letra correcta")
            self.assertIn(correcta, opciones)
            clic(self.ventana, correcta)
            clic(self.ventana, "Siguiente")
        self.assertTrue(hay_texto(self.ventana, "¡Completar palabra terminado!"))
        self.assertIn("completar", puntuacion.actividades_completadas)
        self.assertEqual(puntuacion.puntos, 8 * 10 + 20)

    # ------------------------------------------------------------------
    # ORDENAR PALABRA
    # ------------------------------------------------------------------

    PALABRA_APPLE = {"original": "APPLE", "desordenada": "LEPPA"}

    def test_ordenar_campo_vacio_muestra_aviso(self):
        mostrar_ordenar(self.ventana, NOMBRE, 0, 8, 0, 0, False,
                        self.PALABRA_APPLE, None)
        self.ventana.update()
        clic(self.ventana, "Comprobar")
        self.assertTrue(
            hay_texto(self.ventana, "Escribe una palabra antes de comprobar."),
            "Debe avisarse si se comprueba sin escribir nada")
        self.assertEqual(puntuacion.preguntas_respondidas, 0,
                         "Comprobar vacío no debe contar como respuesta")

    def test_ordenar_correcta_ignora_mayusculas_y_espacios(self):
        mostrar_ordenar(self.ventana, NOMBRE, 0, 8, 0, 0, False,
                        self.PALABRA_APPLE, None)
        self.ventana.update()
        buscar(self.ventana, tk.Entry).insert(0, " apple  ")
        clic(self.ventana, "Comprobar")
        self.assertTrue(hay_texto(self.ventana, "¡Correcto! +10 puntos"))
        self.assertEqual(puntuacion.puntos, 10)

    def test_ordenar_incorrecta_muestra_la_palabra_correcta(self):
        mostrar_ordenar(self.ventana, NOMBRE, 0, 8, 0, 0, False,
                        self.PALABRA_APPLE, None)
        self.ventana.update()
        buscar(self.ventana, tk.Entry).insert(0, "ORANGE")
        clic(self.ventana, "Comprobar")
        self.assertTrue(hay_texto(self.ventana, "¡Incorrecto!"))
        self.assertTrue(hay_texto(self.ventana, "La palabra correcta era: APPLE"))
        self.assertEqual(puntuacion.puntos, 0)

    def test_ordenar_completo_ocho_rondas(self):
        mostrar_menu(self.ventana, NOMBRE)
        self.ventana.update()
        entrar_actividad(self.ventana, "Ordenar palabra")
        self.assertTrue(hay_texto(self.ventana, "Ronda 1 de 8"))
        for ronda in range(8):
            if ronda > 0:
                self.assertTrue(
                    hay_texto(self.ventana, f"Ronda {ronda + 1} de 8"),
                    f"Falta la ronda {ronda + 1}")
            etiquetas = []
            def recolectar(raiz):
                for hijo in raiz.winfo_children():
                    if isinstance(hijo, tk.Label) and " " in hijo.cget("text"):
                        etiquetas.append(hijo.cget("text"))
                    recolectar(hijo)
            recolectar(self.ventana)
            letras_visibles = None
            for texto in etiquetas:
                partes = texto.split()
                if len(partes) > 1 and all(len(p) == 1 for p in partes):
                    letras_visibles = partes
                    break
            self.assertIsNotNone(letras_visibles,
                                 "Deben verse las letras desordenadas")
            solucion = next(
                p["ingles"].upper() for p in palabras_jugables()
                if sorted(p["ingles"].upper()) == sorted(letras_visibles))
            buscar(self.ventana, tk.Entry).insert(0, solucion)
            clic(self.ventana, "Comprobar")
            clic(self.ventana, "Siguiente")
        self.assertTrue(hay_texto(self.ventana, "¡Ordenar palabra terminado!"))
        self.assertIn("ordenar", puntuacion.actividades_completadas)
        self.assertEqual(puntuacion.puntos, 8 * 10 + 20)

    # ------------------------------------------------------------------
    # JUEGO DE MEMORIA
    # ------------------------------------------------------------------

    def test_memoria_volteo_deja_angulo_en_transito(self):
        import math
        previo = os.environ.pop("PEA_SIN_ANIM", None)
        try:
            tablero = crear_tablero()
            mostrar_memoria(self.ventana, NOMBRE, tablero, 0, [], 0, False)
            control = self.ventana._control_memoria
            self.assertAlmostEqual(control._angulos[0], math.pi, delta=0.05)
            tarjetas(self.ventana)[0].invoke()
            self.assertAlmostEqual(control._objetivos[0], 0.0, delta=0.05)
            self.assertGreater(abs(control._angulos[0] - control._objetivos[0]),
                               0.4, "El giro debe estar en curso, no instantáneo")
        finally:
            if previo is not None:
                os.environ["PEA_SIN_ANIM"] = previo

    def test_memoria_primer_clic_no_recrea_el_lienzo(self):
        tablero = crear_tablero()
        mostrar_memoria(self.ventana, NOMBRE, tablero, 0, [], 0, False)
        self.ventana.update()
        control = self.ventana._control_memoria
        tarjetas(self.ventana)[0].invoke()
        self.ventana.update()
        self.assertIs(self.ventana._control_memoria, control,
                      "El volteo no debe destruir LienzoMemoria")

    def test_memoria_carta_imagen_usa_png(self):
        from penguin_english.interfaz.lienzo_pygame import (
            etiqueta_frente, usa_imagen_frente)
        tablero = crear_tablero()
        indice = next(i for i, t in enumerate(tablero) if t["tipo"] == "imagen")
        mostrar_memoria(self.ventana, NOMBRE, tablero, 0, [], 0, False)
        self.ventana.update()
        tarjetas(self.ventana)[indice].invoke()
        self.ventana.update()
        carta = tablero[indice]
        self.assertTrue(carta["visible"])
        self.assertTrue(usa_imagen_frente(carta))
        self.assertIsNone(etiqueta_frente(carta))
        self.assertTrue(carta["imagen"].endswith(".png"))
        control = self.ventana._control_memoria
        png = control._surface_png(carta["imagen"], 48, 48)
        self.assertIsNotNone(
            png, f"Debe cargarse {carta['imagen']} (no el círculo de respaldo)")
        foto = control._foto_tk(carta["imagen"], 48)
        self.assertIsNotNone(
            foto, f"Tk también debe mostrar {carta['imagen']}")

    def test_memoria_pareja_incorrecta_se_da_vuelta_sola(self):
        tablero = crear_tablero()
        mostrar_memoria(self.ventana, NOMBRE, tablero, 0, [], 0, False)
        self.ventana.update()
        botones = tarjetas(self.ventana)
        self.assertEqual(len(botones), 12, "El tablero debe tener 12 tarjetas")
        a = 0
        b = next(i for i in range(1, 12) if tablero[i]["par"] != tablero[a]["par"])
        tarjetas(self.ventana)[a].invoke()
        self.ventana.update()
        tarjetas(self.ventana)[b].invoke()
        self.ventana.update()
        self.assertTrue(
            hay_texto_en_alguna_etiqueta(
                self.ventana, "no eran pareja"),
            "Pipo debe avisar que no eran pareja")
        esperar(self.ventana, 1.2)
        self.assertTrue(hay_texto(self.ventana, "Parejas encontradas: 0 de 6"))
        self.assertEqual(puntuacion.preguntas_respondidas, 1,
                         "El intento fallido cuenta como respuesta")
        self.assertEqual(puntuacion.puntos, 0)

    def test_memoria_no_permite_voltear_tercera_tarjeta(self):
        tablero = crear_tablero()
        mostrar_memoria(self.ventana, NOMBRE, tablero, 0, [], 0, False)
        self.ventana.update()
        botones = tarjetas(self.ventana)
        a = 0
        b = next(i for i in range(1, 12) if tablero[i]["par"] != tablero[a]["par"])
        tarjetas(self.ventana)[a].invoke()
        self.ventana.update()
        tarjetas(self.ventana)[b].invoke()
        self.ventana.update()
        self.assertEqual(sum(1 for t in tablero if t["visible"]), 2)
        c_ = next(i for i in range(12) if i not in (a, b))
        tarjetas(self.ventana)[c_].invoke()
        self.ventana.update()
        self.assertEqual(sum(1 for t in tablero if t["visible"]), 2,
                         "No debe poder voltearse una tercera tarjeta")
        esperar(self.ventana, 1.4)

    def test_memoria_completa_con_seis_parejas(self):
        tablero = crear_tablero()
        mostrar_memoria(self.ventana, NOMBRE, tablero, 0, [], 0, False)
        self.ventana.update()
        for par in range(6):
            indices = [i for i in range(12) if tablero[i]["par"] == par]
            tarjetas(self.ventana)[indices[0]].invoke()
            self.ventana.update()
            tarjetas(self.ventana)[indices[1]].invoke()
            self.ventana.update()
            esperar(self.ventana, 0.7)  # animación de pareja + repintado
        esperar(self.ventana, 0.6)
        self.assertTrue(hay_texto(self.ventana, "¡Juego de memoria terminado!"))
        self.assertIn("memoria", puntuacion.actividades_completadas)
        self.assertEqual(puntuacion.puntos, 6 * 10 + 20,
                         "6 parejas (10 c/u) + 20 de bonificación")

    def test_memoria_desde_menu_y_vuelta_al_menu(self):
        mostrar_menu(self.ventana, NOMBRE)
        self.ventana.update()
        entrar_actividad(self.ventana, "Juego de memoria")
        self.assertTrue(hay_texto(self.ventana, "Juego de memoria"))
        self.assertTrue(hay_texto(self.ventana, "Parejas encontradas: 0 de 6"))
        clic(self.ventana, "Menú")
        self.assertTrue(hay_texto(self.ventana, "Penguin English Adventure"),
                        "Debe volverse al menú desde la memoria")

    # ------------------------------------------------------------------
    # RESULTADO Y SALIDA
    # ------------------------------------------------------------------

    def test_resultado_muestra_puntos_y_bonificacion(self):
        puntuacion.puntos = 120
        mostrar_resultado(self.ventana, NOMBRE, "¡Trivia completada!",
                          100, 10, 10)
        self.ventana.update()
        self.assertTrue(hay_texto(self.ventana, "¡Trivia completada!"))
        self.assertTrue(
            hay_texto_en_alguna_etiqueta(
                self.ventana, "Respuestas correctas: 10 de 10 (100%)"))
        self.assertTrue(
            hay_texto_en_alguna_etiqueta(
                self.ventana, "Bonificación por terminar: +20 puntos"))
        self.assertTrue(
            hay_texto_en_alguna_etiqueta(self.ventana, "Tus puntos totales: 120"))
        clic(self.ventana, "Volver al menú")
        self.assertTrue(hay_texto(self.ventana, "Penguin English Adventure"))

    def test_boton_salir_cierra_la_ventana(self):
        ventana_aux = tk.Toplevel(self.ventana)
        mostrar_menu(ventana_aux, NOMBRE)
        ventana_aux.update()
        clic(ventana_aux, "Salir")
        self.assertEqual(ventana_aux.winfo_exists(), 0,
                         "El botón Salir debe cerrar la ventana")

    def test_juego_completo_sin_errores(self):
        """Recorrido completo: inicio → 5 actividades → resultado final."""
        mostrar_inicio(self.ventana)
        self.ventana.update()
        buscar(self.ventana, tk.Entry).insert(0, NOMBRE)
        clic(self.ventana, "¡Comenzar!")

        entrar_actividad(self.ventana, "Aprender vocabulario")
        clic(self.ventana, prefijo="Animales")
        paginas_animales = max(
            1,
            (len(categorias_del_nivel()["Animales"]) + PALABRAS_POR_PAGINA - 1)
            // PALABRAS_POR_PAGINA)
        for _ in range(paginas_animales - 1):
            clic(self.ventana, "Siguiente ▶")
        clic(self.ventana, "Volver al listado")
        clic(self.ventana, "Menú")

        random.seed(11)
        entrar_actividad(self.ventana, "Trivia")
        total_trivia = 10
        for _ in range(total_trivia):
            # Leemos la pregunta visible y pulsamos la opción correcta.
            from penguin_english.datos.niveles import preguntas_del_nivel
            textos = []
            def recolectar_p(raiz):
                for hijo in raiz.winfo_children():
                    if isinstance(hijo, tk.Label):
                        textos.append(hijo.cget("text"))
                    recolectar_p(hijo)
            recolectar_p(self.ventana)
            banco = {p["pregunta"]: p for p in preguntas_del_nivel()}
            pregunta = None
            for texto in textos:
                if texto in banco:
                    pregunta = banco[texto]
                    break
            self.assertIsNotNone(pregunta, "Debe verse el texto de la trivia")
            clic(self.ventana, sufijo=pregunta["correcta"])
            clic(self.ventana, "Siguiente")
        clic(self.ventana, "Volver al menú")

        entrar_actividad(self.ventana, "Completar palabra")
        for _ in range(8):
            opciones = []
            def recolectar(raiz):
                for hijo in raiz.winfo_children():
                    if isinstance(hijo, tk.Button) and len(hijo.cget("text")) == 1:
                        opciones.append(hijo.cget("text"))
                    recolectar(hijo)
            recolectar(self.ventana)
            clic(self.ventana, letra_correcta_de_pantalla(self.ventana))
            clic(self.ventana, "Siguiente")
        clic(self.ventana, "Volver al menú")

        entrar_actividad(self.ventana, "Ordenar palabra")
        for _ in range(8):
            etiquetas = []
            def recolectar2(raiz):
                for hijo in raiz.winfo_children():
                    if isinstance(hijo, tk.Label) and " " in hijo.cget("text"):
                        etiquetas.append(hijo.cget("text"))
                    recolectar2(hijo)
            recolectar2(self.ventana)
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
        clic(self.ventana, "Volver al menú")

        entrar_actividad(self.ventana, "Juego de memoria")
        from penguin_english.juegos.memoria import cantidad_parejas
        # El tablero ya está en pantalla_actual; leemos las tarjetas del control.
        control = self.ventana._control_memoria
        tablero = control.tablero
        total_pares = cantidad_parejas()
        for par in range(total_pares):
            indices = [i for i in range(len(tablero)) if tablero[i]["par"] == par]
            tarjetas(self.ventana)[indices[0]].invoke()
            self.ventana.update()
            tarjetas(self.ventana)[indices[1]].invoke()
            self.ventana.update()
            esperar(self.ventana, 0.7)
        esperar(self.ventana, 0.6)
        self.assertTrue(hay_texto(self.ventana, "¡Juego de memoria terminado!"))
        clic(self.ventana, "Volver al menú")

        self.assertEqual(puntuacion.progreso_porcentaje(), 100,
                         "Al terminar todo, el progreso debe ser 100%")
        self.assertEqual(len(puntuacion.actividades_completadas), 5)
        self.assertGreater(puntuacion.puntos, 0)


if __name__ == "__main__":
    unittest.main()