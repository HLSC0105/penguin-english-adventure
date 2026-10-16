"""Pantalla del juego de memoria: parejas palabra-imagen con volteo 2.5D.

Explicación académica
---------------------
Las reglas (tablero, ``son_pareja``, espera del flip) están en
``juegos.memoria``. Esta pantalla orquesta Tk + ``LienzoMemoria``:
el clic llega como índice, se marca ``visible`` y, con dos cartas,
o se celebra la pareja o se programa ``dar_vuelta_tarjetas``.

El estado vive en ``ventana._memoria_estado`` para que el closure del
clic no se quede con ``volteadas=[]``. El lienzo **no se destruye**
en cada volteo: se llama ``sincronizar(..., animar_indices=)`` y el
giro recorre el canto. Recrear la pantalla solo al entrar, al cambiar
de tema o al ir al resultado.

Librerías: ``tkinter`` (marco) y pygame (PNG + proyección ``cos θ``).
"""

import tkinter as tk

from ..juegos.memoria import cantidad_parejas, espera_flip_ms, son_pareja
from ..utilidades import puntuacion
from ..utilidades.sonidos import sonido_correcto, sonido_error, sonido_ganar
from .componentes import (crear_encabezado, crear_pipo, crear_titulo, fuente,
                          guardar_pantalla, lienzo, obtener_color,
                          repintar_pantalla)
from .lienzo_pygame import LienzoMemoria
from .resultado import mostrar_resultado


def _lienzo_vivo(ventana):
    control = getattr(ventana, "_control_memoria", None)
    if control is None:
        return False
    try:
        return bool(control.winfo_exists())
    except tk.TclError:
        return False


def _mensaje_pipo(esperando, volteadas):
    if esperando:
        return "¡Casi! Esas dos tarjetas no eran pareja. Sigue intentando."
    if len(volteadas) == 1:
        return "Ahora encuentra la tarjeta que hace pareja con esa."
    return "Voltea dos tarjetas: una palabra y su imagen forman una pareja."


def _guardar_estado(ventana, nombre_jugador, tablero, parejas_encontradas,
                    volteadas, intentos, esperando):
    ventana._memoria_estado = {
        "nombre": nombre_jugador,
        "tablero": tablero,
        "parejas_encontradas": parejas_encontradas,
        "volteadas": list(volteadas),
        "intentos": intentos,
        "esperando": esperando,
    }
    guardar_pantalla(
        mostrar_memoria, nombre_jugador, tablero, parejas_encontradas,
        list(volteadas), intentos, esperando)


def _refrescar_textos(ventana):
    ui = getattr(ventana, "_memoria_ui", None)
    estado = getattr(ventana, "_memoria_estado", None)
    if not ui or not estado:
        return
    total = cantidad_parejas()
    try:
        ui["parejas"].config(
            text=(f"Parejas encontradas: {estado['parejas_encontradas']}"
                  f" de {total}"))
        ui["pipo"].config(text=_mensaje_pipo(
            estado["esperando"], estado["volteadas"]))
    except tk.TclError:
        pass


def _al_voltear_estado(ventana, indice):
    estado = ventana._memoria_estado
    voltear_tarjeta(
        ventana, estado["nombre"], estado["tablero"], indice,
        estado["parejas_encontradas"], estado["volteadas"],
        estado["intentos"], estado["esperando"])


def mostrar_memoria(ventana, nombre_jugador, tablero, parejas_encontradas,
                    volteadas, intentos, esperando):
    """Dibuja la pantalla de memoria (o refresca el lienzo ya creado)."""
    from .menu import mostrar_menu

    ir_al_menu = lambda: repintar_pantalla(ventana, mostrar_menu, nombre_jugador)
    crear_encabezado(ventana, nombre_jugador, ir_al_menu)
    _guardar_estado(ventana, nombre_jugador, tablero, parejas_encontradas,
                    volteadas, intentos, esperando)

    if _lienzo_vivo(ventana) and getattr(ventana, "_memoria_ui", None):
        ventana._control_memoria.al_voltear = (
            lambda i: _al_voltear_estado(ventana, i))
        _refrescar_textos(ventana)
        if esperando:
            pendientes = list(volteadas)
            ventana.after(espera_flip_ms(), lambda: dar_vuelta_tarjetas(
                ventana, nombre_jugador, tablero, parejas_encontradas,
                pendientes, intentos))
        return

    padre = lienzo(ventana)
    total = cantidad_parejas()
    crear_titulo(padre, "Juego de memoria").pack(pady=(16, 2))
    etiqueta_numero = tk.Label(
        padre,
        text=f"Parejas encontradas: {parejas_encontradas} de {total}",
        font=fuente(13), bg=obtener_color("fondo"),
        fg=obtener_color("texto_secundario"))
    etiqueta_numero.pack(pady=(0, 10))

    burbuja = crear_pipo(padre, _mensaje_pipo(esperando, volteadas),
                         ancho_burbuja=600)

    tablero_memoria = LienzoMemoria(
        padre, tablero, lambda i: _al_voltear_estado(ventana, i))
    tablero_memoria.pack(pady=8)
    ventana._control_memoria = tablero_memoria
    ventana._memoria_ui = {"parejas": etiqueta_numero, "pipo": burbuja}
    tablero_memoria.sincronizar(tablero)

    if esperando:
        pendientes = list(volteadas)
        ventana.after(espera_flip_ms(), lambda: dar_vuelta_tarjetas(
            ventana, nombre_jugador, tablero, parejas_encontradas,
            pendientes, intentos))


def voltear_tarjeta(ventana, nombre_jugador, tablero, indice,
                    parejas_encontradas, volteadas, intentos, esperando):
    """Voltea una tarjeta y revisa si se formó una pareja (sin recrear el lienzo)."""
    if esperando or len(volteadas) >= 2:
        return
    tarjeta = tablero[indice]
    if tarjeta["visible"]:
        return

    tarjeta["visible"] = True
    nuevas_volteadas = list(volteadas) + [indice]
    control = getattr(ventana, "_control_memoria", None)
    if control is not None:
        control.sincronizar(tablero, animar_indices=[indice])

    if len(nuevas_volteadas) == 2:
        intentos += 1
        primera = tablero[nuevas_volteadas[0]]
        segunda = tablero[nuevas_volteadas[1]]
        if son_pareja(primera, segunda):
            puntuacion.sumar_respuesta(True)
            sonido_correcto()
            parejas_encontradas += 1
            if control is not None:
                control.destellar(nuevas_volteadas)
            _guardar_estado(ventana, nombre_jugador, tablero,
                            parejas_encontradas, [], intentos, False)
            _refrescar_textos(ventana)
            if parejas_encontradas == cantidad_parejas():
                ventana.after(420, lambda: terminar_memoria(
                    ventana, nombre_jugador, intentos))
        else:
            puntuacion.sumar_respuesta(False)
            sonido_error()
            _guardar_estado(ventana, nombre_jugador, tablero,
                            parejas_encontradas, nuevas_volteadas,
                            intentos, True)
            _refrescar_textos(ventana)
            pendientes = list(nuevas_volteadas)
            ventana.after(espera_flip_ms(), lambda: dar_vuelta_tarjetas(
                ventana, nombre_jugador, tablero, parejas_encontradas,
                pendientes, intentos))
    else:
        _guardar_estado(ventana, nombre_jugador, tablero,
                        parejas_encontradas, nuevas_volteadas,
                        intentos, False)
        _refrescar_textos(ventana)


def dar_vuelta_tarjetas(ventana, nombre_jugador, tablero, parejas_encontradas,
                        volteadas, intentos):
    """Da vuelta las dos tarjetas que no formaron pareja, con animación."""
    if not _lienzo_vivo(ventana):
        return
    for indice in volteadas:
        tablero[indice]["visible"] = False
    control = ventana._control_memoria
    control.sincronizar(tablero, animar_indices=list(volteadas))
    _guardar_estado(ventana, nombre_jugador, tablero, parejas_encontradas,
                    [], intentos, False)
    _refrescar_textos(ventana)


def terminar_memoria(ventana, nombre_jugador, intentos):
    """Marca la actividad como completada y muestra el resultado."""
    ventana._memoria_ui = None
    puntuacion.completar_actividad("memoria")
    puntuacion.sumar_bonificacion()
    sonido_ganar()
    total = cantidad_parejas()
    repintar_pantalla(ventana, mostrar_resultado, nombre_jugador,
                      "¡Juego de memoria terminado!", intentos, intentos,
                      total)
