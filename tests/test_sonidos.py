"""Pruebas del mixer: no se salta audio, se comprueba qué WAV se pidió."""

import os
import unittest
from unittest.mock import MagicMock, patch

from penguin_english.utilidades import sonidos


class TestSonidos(unittest.TestCase):

    def setUp(self):
        self._silencio = os.environ.pop("PEA_SILENCIO", None)
        sonidos._reiniciar_para_pruebas()

    def tearDown(self):
        sonidos._reiniciar_para_pruebas()
        if self._silencio is not None:
            os.environ["PEA_SILENCIO"] = self._silencio

    def test_inicializar_pygame_en_hilo_principal(self):
        mixer = MagicMock()
        fake_pygame = MagicMock(mixer=mixer)
        with patch.dict("sys.modules", {"pygame": fake_pygame}):
            motor = sonidos.inicializar_motor()
        mixer.init.assert_called_once()
        self.assertEqual(motor, "pygame")
        self.assertTrue(sonidos.audio_disponible())

    def test_init_fallido_deja_audio_indisponible(self):
        mixer = MagicMock()
        mixer.init.side_effect = RuntimeError("sin tarjeta")
        fake_pygame = MagicMock(mixer=mixer)
        with patch.dict("sys.modules", {"pygame": fake_pygame}):
            motor = sonidos.inicializar_motor()
        self.assertIsNone(motor)
        self.assertFalse(sonidos.audio_disponible())

    def test_reproducir_pide_el_wav_correcto(self):
        mixer = MagicMock()
        instancia = MagicMock()
        mixer.Sound.return_value = instancia
        fake_pygame = MagicMock(mixer=mixer)

        class HiloInmediato:
            def __init__(self, target=None, daemon=None):
                self._target = target
            def start(self):
                self._target()

        with patch.dict("sys.modules", {"pygame": fake_pygame}):
            with patch("penguin_english.utilidades.sonidos.threading.Thread",
                       HiloInmediato):
                sonidos.inicializar_motor()
                llamadas_tras_init = mixer.Sound.call_count
                sonidos.sonido_ganar()
                sonidos.sonido_ganar()
        self.assertTrue(mixer.Sound.called)
        rutas = [str(c[0][0]) for c in mixer.Sound.call_args_list]
        self.assertTrue(any(r.endswith("ganar.wav") for r in rutas), rutas)
        instancia.play.assert_called()
        self.assertEqual(
            mixer.Sound.call_count, llamadas_tras_init,
            "El WAV no debe releerse: Sound queda cacheado")

    def test_volumen_por_defecto_es_mitad(self):
        self.assertEqual(sonidos.volumen(), 0.5)

    def test_establecer_volumen_recorta_el_rango(self):
        self.assertEqual(sonidos.establecer_volumen(-2), 0.0)
        self.assertEqual(sonidos.establecer_volumen(3), 1.0)
        self.assertEqual(sonidos.establecer_volumen(0.25), 0.25)

    def test_cargar_wav_aplica_volumen(self):
        mixer = MagicMock()
        instancia = MagicMock()
        mixer.Sound.return_value = instancia
        fake_pygame = MagicMock(mixer=mixer)
        with patch.dict("sys.modules", {"pygame": fake_pygame}):
            sonidos.inicializar_motor()
        instancia.set_volume.assert_called_with(0.5)

    def test_cuatro_efectos_no_explotan_sin_pygame(self):
        mixer = MagicMock()
        mixer.init.side_effect = ImportError("no")
        with patch.dict("sys.modules", {"pygame": MagicMock(mixer=mixer)}):
            sonidos.inicializar_motor()
            sonidos.sonido_clic()
            sonidos.sonido_correcto()
            sonidos.sonido_error()
            sonidos.sonido_ganar()
