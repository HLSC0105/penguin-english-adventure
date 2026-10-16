"""Animaciones 2D de Tkinter: interpolación, easing y after().

Explicación académica
---------------------
Tkinter no tiene un motor de tween. Encadenamos ``widget.after(ms, fn)``
para no bloquear ``mainloop`` (un ``time.sleep`` congelaría clics).

La interpolación lineal mezcla dos valores con t ∈ [0, 1].
``ease_out_cubic`` hace que el movimiento arranque rápido y frene
al final (como un objeto que llega a su sitio).

``ANIMACIONES_ACTIVAS`` es el equivalente académico de
prefers-reduced-motion: los tests pueden apagar el motion y saltar
al estado final.
"""

import os
import tkinter as tk
import tkinter.font as tkfont

ANIMACIONES_ACTIVAS = True


def _debe_animar():
    """False en tests (PEA_SIN_ANIM) o si se apagó el motion."""
    if os.environ.get("PEA_SIN_ANIM") == "1":
        return False
    return ANIMACIONES_ACTIVAS


def ease_out_cubic(t):
    """Easing cúbico de salida: t=0 → 0, t=1 → 1, curva 1-(1-t)^3."""
    t = 0 if t < 0 else 1 if t > 1 else t
    return 1 - (1 - t) ** 3


def _a_hex(color):
    """Convierte '#RRGGBB' (o el de 12 dígitos de Tk) en (r, g, b)."""
    color = str(color).lstrip("#")
    if len(color) == 12:
        color = color[0:2] + color[4:6] + color[8:10]
    return (int(color[0:2], 16), int(color[2:4], 16), int(color[4:6], 16))


def _es_hex(color):
    """True si el color es '#RRGGBB', 'RRGGBB' o el de 12 dígitos de Tk."""
    texto = str(color).lstrip("#")
    if len(texto) == 12:
        texto = texto[0:2] + texto[4:6] + texto[8:10]
    return len(texto) == 6 and all(
        caracter in "0123456789abcdefABCDEF" for caracter in texto)


def interpolar_color(color_a, color_b, t):
    """Mezcla dos colores hexadecimales. t=0 → color_a, t=1 → color_b."""
    a = _a_hex(color_a)
    b = _a_hex(color_b)
    mezcla = (
        round(a[0] + (b[0] - a[0]) * t),
        round(a[1] + (b[1] - a[1]) * t),
        round(a[2] + (b[2] - a[2]) * t),
    )
    return "#{:02X}{:02X}{:02X}".format(*mezcla)


def bombear_after(ventana, tope_ms=800, paso_ms=16):
    """Drena ``after()`` sin mainloop hasta que no quede ninguno.

    El sleep debe ser del orden de los ``after`` del juego (~16 ms).
    Un bucle más apretado impide que Tcl marque los timers como vencidos.

    Un ``TclError`` de un ``after`` huérfano no aborta el bombeo.
    """
    import time
    fin = time.time() + tope_ms / 1000.0
    while time.time() < fin:
        try:
            if not ventana.winfo_exists():
                return
        except tk.TclError:
            return
        try:
            ventana.update()
        except tk.TclError:
            pass
        try:
            pendientes = ventana.tk.call("after", "info")
        except tk.TclError:
            return
        if not pendientes:
            return
        time.sleep(paso_ms / 1000.0)


def fundir_fondo(ventana, color_final, duracion_ms=120, pasos=5,
                 callback=None):
    """Interpola el fondo entre el color actual y ``color_final``.

    Precondición: no hay que haber pintado ya ``color_final`` en la
    ventana; si origen == destino el fundido es invisible (ese era el bug).
    """
    try:
        if not ventana.winfo_exists():
            return
    except tk.TclError:
        return
    try:
        bg_actual = str(ventana.cget("bg"))
    except (tk.TclError, KeyError):
        bg_actual = color_final

    if (not _debe_animar()
            or not _es_hex(bg_actual)
            or not _es_hex(color_final)
            or bg_actual.lower() == color_final.lower()):
        try:
            ventana.configure(bg=color_final)
        except tk.TclError:
            pass
        if callback:
            try:
                callback()
            except tk.TclError:
                pass
        return

    intervalo = max(10, duracion_ms // max(1, pasos))

    def paso(i):
        try:
            if not ventana.winfo_exists():
                return
        except tk.TclError:
            return
        t = ease_out_cubic(i / max(1, pasos - 1) if pasos > 1 else 1)
        try:
            ventana.configure(bg=interpolar_color(bg_actual, color_final, t))
        except tk.TclError:
            return
        if i < pasos - 1:
            ventana.after(intervalo, paso, i + 1)
        elif callback:
            try:
                callback()
            except tk.TclError:
                pass

    paso(0)


def animar_aparicion_titulo(label, tam_final=26, tam_inicial=18,
                            duracion_ms=80, pasos=3):
    """Hace que un título aparezca creciendo de menor a mayor tamaño."""
    try:
        if not label.winfo_exists():
            return
    except tk.TclError:
        return
    if not _debe_animar():
        try:
            label.config(font=("DejaVu Sans", tam_final, "bold"))
        except tk.TclError:
            pass
        return

    try:
        parsed = tkfont.Font(font=label.cget("font"), root=label)
        familia = parsed.actual("family")
    except (tk.TclError, tkfont.TclError, TypeError, ValueError):
        familia = "DejaVu Sans"

    intervalo = max(15, duracion_ms // max(1, pasos))

    def paso(i):
        try:
            if not label.winfo_exists():
                return
        except tk.TclError:
            return
        t = ease_out_cubic((i + 1) / pasos)
        tam = round(tam_inicial + (tam_final - tam_inicial) * t)
        try:
            label.config(font=(familia, tam, "bold"))
        except tk.TclError:
            return
        if i < pasos - 1:
            label.after(intervalo, paso, i + 1)

    try:
        label.config(font=(familia, tam_inicial, "bold"))
    except tk.TclError:
        return
    paso(0)


def pulsar_widget(widget, color_a, color_b, veces=2, duracion_ms=80):
    """Alterna el color de fondo de un widget entre dos colores."""
    try:
        if not widget.winfo_exists():
            return
    except tk.TclError:
        return
    if "bg" not in widget.keys():
        return
    if not _debe_animar():
        try:
            widget.config(bg=color_a)
        except tk.TclError:
            pass
        return
    total_pasos = veces * 2
    intervalo = max(20, duracion_ms // max(1, total_pasos))

    def paso(i):
        try:
            if not widget.winfo_exists():
                return
        except tk.TclError:
            return
        try:
            color = color_a if i % 2 == 0 else color_b
            widget.config(bg=color)
            if "activebackground" in widget.keys():
                widget.config(activebackground=color)
        except tk.TclError:
            return
        if i < total_pasos - 1:
            widget.after(intervalo, paso, i + 1)
        else:
            try:
                widget.config(bg=color_a)
                if "activebackground" in widget.keys():
                    widget.config(activebackground=color_a)
            except tk.TclError:
                pass

    paso(0)


def animar_barra(barra, valor_final, duracion_ms=120, pasos=4):
    """Sube el valor de una Progressbar de forma gradual hacia el nuevo %."""
    try:
        if not barra.winfo_exists():
            return
    except tk.TclError:
        return
    try:
        valor_inicial = float(barra.cget("value"))
    except (tk.TclError, ValueError):
        return
    if not _debe_animar() or abs(valor_inicial - valor_final) < 0.5:
        try:
            barra.config(value=valor_final)
        except tk.TclError:
            pass
        return
    intervalo = max(20, duracion_ms // max(1, pasos))

    def paso(i):
        try:
            if not barra.winfo_exists():
                return
        except tk.TclError:
            return
        t = ease_out_cubic((i + 1) / pasos)
        valor = valor_inicial + (valor_final - valor_inicial) * t
        try:
            barra.config(value=valor)
        except tk.TclError:
            return
        if i < pasos - 1:
            barra.after(intervalo, paso, i + 1)

    paso(0)


def resal_burbuja_pipo(burbuja, veces=1, duracion_ms=80):
    """Hace que la burbuja de Pipo “respire” cambiando su borde."""
    try:
        if not burbuja.winfo_exists():
            return
    except tk.TclError:
        return
    if "highlightbackground" not in burbuja.keys():
        return
    try:
        color_normal = str(burbuja.cget("highlightbackground"))
    except tk.TclError:
        return
    try:
        from .componentes import obtener_color
        color_acento = obtener_color("acento")
    except Exception:
        color_acento = color_normal
    if not _debe_animar():
        return
    total_pasos = veces * 2
    intervalo = max(20, duracion_ms // max(1, total_pasos))

    def paso(i):
        try:
            if not burbuja.winfo_exists():
                return
        except tk.TclError:
            return
        try:
            color = color_acento if i % 2 == 0 else color_normal
            burbuja.config(highlightbackground=color)
        except tk.TclError:
            return
        if i < total_pasos - 1:
            burbuja.after(intervalo, paso, i + 1)

    paso(0)


def desplazar_widget_hacia_arriba(widget, distancia=6, duracion_ms=180,
                                  pasos=6):
    """Simula un brinco subiendo y bajando pady de un widget empaquetado."""
    try:
        if not widget.winfo_exists():
            return
    except tk.TclError:
        return
    try:
        info_pack = widget.pack_info()
    except tk.TclError:
        return
    pady_original = info_pack.get("pady", 0)
    if isinstance(pady_original, (tuple, list)):
        extra = pady_original
    else:
        try:
            valor = int(str(pady_original).split()[0])
        except (TypeError, ValueError):
            valor = 0
        extra = (valor, valor)
    if not _debe_animar():
        return
    intervalo = max(15, duracion_ms // max(1, pasos * 2))

    def medio():
        try:
            if not widget.winfo_exists():
                return
            widget.pack(pady=(max(0, extra[0] - distancia),
                              max(0, extra[1] + distancia)))
        except (tk.TclError, TypeError, IndexError):
            return
        widget.after(intervalo, fin)

    def fin():
        try:
            if not widget.winfo_exists():
                return
            widget.pack(pady=pady_original)
        except tk.TclError:
            return

    medio()
