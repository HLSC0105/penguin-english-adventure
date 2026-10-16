"""Componentes visuales reutilizables de la interfaz.

Explicación académica
---------------------
Caja de herramientas de Tk: temas (tokens de color), cascarón
persistente, cache de ``PhotoImage``, botones con sombra offset y
Pipo. Las pantallas no deberían crear un ``Button`` crudo: pasan por
aquí para que el tema y el hover sean únicos.

Algoritmo del cascarón: un ``_header`` que no se destruye al cambiar
de pantalla y un ``Canvas`` + frame ``_contenido`` (scroll solo si el
interior es más alto). ``lienzo()`` es el padre de cada ``mostrar_*``.

Librerías: ``tkinter`` / ``ttk`` (GUI estándar), ``sys`` (fuente Segoe
en Windows). pygame no pinta aquí; las imágenes son PNG vía
``PhotoImage``. Pipo de UI: ``pinguino_128.png`` para no decodificar
618 px en cada pintura.
"""

import sys
import tkinter as tk
import tkinter.ttk as ttk

from ..utilidades import puntuacion
from ..utilidades.rutas import archivo_imagen, carpeta_imagenes
from ..utilidades.sonidos import audio_disponible, establecer_volumen, volumen

RUTA_IMAGENES = carpeta_imagenes()

# Tema claro: hielo diurno.
TEMA_CLARO = {
    "fondo": "#E8F1FA",
    "panel": "#FFFFFF",
    "tarjeta": "#FFFFFF",
    "texto": "#0F2744",
    "texto_secundario": "#4A6580",
    "boton": "#1E5AB8",
    "boton_hover": "#2A6FD6",
    "boton_texto": "#FFFFFF",
    "acento": "#D97706",
    "correcto": "#15803D",
    "incorrecto": "#B91C1C",
    "barra_fondo": "#C9DCF3",
    "barra_relleno": "#D97706",
    "borde": "#B7CCE4",
    "burbuja": "#FFFFFF",
    "foco": "#1E5AB8",
    "sombra": "#C9CDD6",
    "sobre_acento": "#111111",
}

# Tema oscuro: negro profundo; paneles un peldaño arriba para las tarjetas.
TEMA_OSCURO = {
    "fondo": "#000000",
    "panel": "#0D0D0D",
    "tarjeta": "#171717",
    "texto": "#F1F5F9",
    "texto_secundario": "#94A3B8",
    "boton": "#1E3A8A",
    "boton_hover": "#1D4ED8",
    "boton_texto": "#FFFFFF",
    "acento": "#FBBF24",
    "correcto": "#22C55E",
    "incorrecto": "#F87171",
    "barra_fondo": "#1A1A1A",
    "barra_relleno": "#FBBF24",
    "borde": "#2A2A2A",
    "burbuja": "#171717",
    "foco": "#FBBF24",
    "sombra": "#2A2A2A",
    "sobre_acento": "#111111",
}

tema_actual = "oscuro"
colores = TEMA_OSCURO
pantalla_actual = None
imagenes_guardadas = {}


def obtener_color(nombre):
    """Devuelve un color según el tema activo."""
    return colores[nombre]


def fuente(tamano, negrita=False):
    """Elige una letra según el sistema operativo."""
    if sys.platform == "win32":
        familia = "Segoe UI"
    else:
        familia = "DejaVu Sans"
    estilo = "bold" if negrita else "normal"
    return (familia, tamano, estilo)


def configurar_estilos():
    """Configura el estilo de las barras de progreso según el tema."""
    estilo = ttk.Style()
    estilo.theme_use("clam")
    estilo.configure("Barra.Horizontal.TProgressbar",
                     background=obtener_color("barra_relleno"),
                     troughcolor=obtener_color("barra_fondo"),
                     bordercolor=obtener_color("borde"),
                     lightcolor=obtener_color("barra_relleno"),
                     darkcolor=obtener_color("barra_relleno"))
    estilo.configure(
        "Volumen.Horizontal.TScale",
        background=obtener_color("panel"),
        troughcolor=obtener_color("barra_fondo"),
        sliderthickness=12,
        borderwidth=0,
    )
    try:
        estilo.master.tk.createcommand("bgerror",
                                        lambda *a, **kw: None)
    except Exception:
        pass


IMAGEN_PIPO_UI = "pinguino_128.png"
IMAGEN_PIPO_GRANDE = "pinguino_618.png"


def _raiz_tk(widget):
    """La ventana Tk dueña del widget (para PhotoImage y el cache)."""
    if widget is None:
        return None
    try:
        return widget.winfo_toplevel()
    except tk.TclError:
        return widget


def instalar_cascaron(ventana):
    """Crea encabezado y contenido persistentes (el contenido es desplazable)."""
    fondo = obtener_color("fondo")
    if getattr(ventana, "_cascaron", False):
        try:
            if (ventana._header.winfo_exists() and ventana._contenido.winfo_exists()
                    and ventana._canvas.winfo_exists()):
                ventana._header.configure(bg=fondo)
                ventana._cuerpo.configure(bg=fondo)
                ventana._canvas.configure(bg=fondo)
                ventana._contenido.configure(bg=fondo)
                return
        except tk.TclError:
            pass
        for attr in ("_header", "_cuerpo"):
            viejo = getattr(ventana, attr, None)
            if viejo is not None:
                try:
                    viejo.destroy()
                except tk.TclError:
                    pass
    ventana._header = tk.Frame(ventana, bg=fondo)
    ventana._cuerpo = tk.Frame(ventana, bg=fondo)
    ventana._header.pack(fill="x")
    ventana._cuerpo.pack(fill="both", expand=True)

    ventana._canvas = tk.Canvas(
        ventana._cuerpo, bg=fondo, highlightthickness=0, bd=0)
    ventana._scroll = tk.Scrollbar(
        ventana._cuerpo, orient="vertical", command=ventana._canvas.yview,
        bg=obtener_color("panel"), troughcolor=fondo,
        activebackground=obtener_color("boton"))
    ventana._canvas.configure(yscrollcommand=ventana._scroll.set)
    ventana._contenido = tk.Frame(ventana._canvas, bg=fondo)
    ventana._contenido_id = ventana._canvas.create_window(
        (0, 0), window=ventana._contenido, anchor="nw")
    ventana._canvas.pack(side="left", fill="both", expand=True)

    def _al_cambiar_lienzo(evento):
        try:
            ventana._canvas.itemconfigure(ventana._contenido_id, width=evento.width)
            _actualizar_scroll(ventana)
        except tk.TclError:
            pass

    def _al_cambiar_contenido(_evento):
        _actualizar_scroll(ventana)

    ventana._canvas.bind("<Configure>", _al_cambiar_lienzo)
    ventana._contenido.bind("<Configure>", _al_cambiar_contenido)
    _enlazar_rueda(ventana._canvas)
    ventana._cascaron = True
    ventana._header_state = None


def _actualizar_scroll(ventana):
    """Ajusta la región de scroll y muestra la barra solo si hace falta."""
    try:
        canvas = ventana._canvas
        inner = ventana._contenido
        barra = ventana._scroll
        canvas.configure(scrollregion=canvas.bbox("all") or (0, 0, 0, 0))
        alto_canvas = canvas.winfo_height()
        alto_inner = inner.winfo_reqheight()
        if alto_canvas > 1 and alto_inner > alto_canvas + 2:
            if not barra.winfo_ismapped():
                barra.pack(side="right", fill="y", before=canvas)
        else:
            if barra.winfo_ismapped():
                barra.pack_forget()
            canvas.yview_moveto(0)
    except (tk.TclError, AttributeError):
        pass


def _enlazar_rueda(canvas):
    """Rueda del ratón en el contenido (también encima de botones)."""

    def _desplazar(evento):
        try:
            if not canvas.winfo_exists():
                return
            if getattr(evento, "num", None) == 5 or getattr(evento, "delta", 0) < 0:
                canvas.yview_scroll(1, "units")
            else:
                canvas.yview_scroll(-1, "units")
        except tk.TclError:
            return
        return "break"

    canvas.bind_all("<MouseWheel>", _desplazar)
    canvas.bind_all("<Button-4>", _desplazar)
    canvas.bind_all("<Button-5>", _desplazar)


def lienzo(ventana):
    """Marco donde se dibuja cada pantalla (debajo del encabezado)."""
    instalar_cascaron(ventana)
    return ventana._contenido


def _vaciar(marco):
    for hijo in list(marco.winfo_children()):
        try:
            hijo.destroy()
        except tk.TclError:
            pass


def _resetear_scroll(ventana):
    try:
        ventana._canvas.yview_moveto(0)
        ventana.after_idle(lambda v=ventana: _actualizar_scroll(v))
    except (tk.TclError, AttributeError):
        pass


def limpiar_pantalla(ventana, incluir_encabezado=True):
    """Borra el contenido; en tests también el encabezado para partir de cero."""
    instalar_cascaron(ventana)
    _vaciar(ventana._contenido)
    _resetear_scroll(ventana)
    if incluir_encabezado:
        _vaciar(ventana._header)
        ventana._header_state = None


def guardar_pantalla(funcion, *argumentos):
    """Guarda la pantalla actual para poder dibujarla otra vez."""
    global pantalla_actual
    pantalla_actual = (funcion, argumentos)


def repintar_pantalla(ventana, funcion, *argumentos):
    """Limpia solo el contenido y dibuja la pantalla; el encabezado se reutiliza."""
    instalar_cascaron(ventana)
    _vaciar(ventana._contenido)
    _resetear_scroll(ventana)
    funcion(ventana, *argumentos)
    _resetear_scroll(ventana)


def repintar_si_activa(ventana, funcion, *argumentos):
    """Redibuja una pantalla solo si sigue siendo la pantalla activa."""
    if pantalla_actual is None or pantalla_actual[0] is not funcion:
        return
    instalar_cascaron(ventana)
    _vaciar(ventana._contenido)
    _resetear_scroll(ventana)
    funcion(ventana, *argumentos)
    _resetear_scroll(ventana)


def alternar_tema(ventana):
    """Cambia el tema y redibuja al instante (sin esperar un fundido)."""
    global tema_actual, colores
    if tema_actual == "claro":
        tema_actual = "oscuro"
        colores = TEMA_OSCURO
    else:
        tema_actual = "claro"
        colores = TEMA_CLARO
    color_destino = obtener_color("fondo")
    configurar_estilos()
    ventana.configure(bg=color_destino)
    if pantalla_actual is None:
        return
    funcion, argumentos = pantalla_actual
    limpiar_pantalla(ventana, incluir_encabezado=True)
    funcion(ventana, *argumentos)
    _resetear_scroll(ventana)


def cargar_imagen(ventana, nombre_archivo, tamano_max=None):
    """Carga una imagen PNG y la devuelve lista para usarse."""
    if ventana is None or not nombre_archivo:
        return None
    ruta = archivo_imagen(nombre_archivo)
    if ruta is None:
        return None
    raiz = _raiz_tk(ventana)
    cache_ventana = imagenes_guardadas.setdefault(id(raiz), {})
    clave = (nombre_archivo, tamano_max)
    if clave in cache_ventana:
        return cache_ventana[clave]
    clave_original = (nombre_archivo, None)
    original = cache_ventana.get(clave_original)
    if original is None:
        try:
            original = tk.PhotoImage(master=raiz, file=str(ruta))
        except (tk.TclError, Exception):
            return None
        cache_ventana[clave_original] = original
    imagen = original
    if tamano_max and imagen.width() > tamano_max:
        factor = max(1, imagen.width() // tamano_max)
        if factor > 1:
            imagen = imagen.subsample(factor, factor)
    cache_ventana[clave] = imagen
    return imagen


def limpiar_cache_imagenes():
    """Vacía el cache (útil entre pruebas que crean/destruyen ventanas)."""
    imagenes_guardadas.clear()


def precargar_imagenes(ventana):
    """Decodifica el Pipo de UI (128 px) una sola vez."""
    if cargar_imagen(ventana, IMAGEN_PIPO_UI) is None:
        cargar_imagen(ventana, IMAGEN_PIPO_GRANDE, tamano_max=110)


def _redirigir_geometria(interior, envoltorio):
    """Hace que pack/grid/place del interior muevan el envoltorio.

    No redirigimos ``destroy``: el Button es hijo del Frame, y Tk ya
    destruye a los hijos al borrar el Frame. Aliasar destroy ciclaba.
    """
    interior.pack = envoltorio.pack
    interior.grid = envoltorio.grid
    interior.place = envoltorio.place
    interior.pack_forget = envoltorio.pack_forget
    interior.grid_forget = envoltorio.grid_forget
    interior.place_forget = envoltorio.place_forget


def primer_boton(widget):
    """El Button en sí o el primero anidado (sombra → botón)."""
    if isinstance(widget, tk.Button):
        return widget
    for hijo in widget.winfo_children():
        hallado = primer_boton(hijo)
        if hallado is not None:
            return hallado
    return None


def crear_tarjeta(padre, ancho=None, alto=None, offset=5, color="tarjeta"):
    """Tarjeta con sombra simulada: Frame offset + panel interior."""
    sombra = tk.Frame(padre, bg=obtener_color("sombra"))
    tarjeta = tk.Frame(
        sombra,
        bg=obtener_color(color),
        highlightthickness=1,
        highlightbackground=obtener_color("borde"),
    )
    tarjeta.pack(fill="both", expand=True, padx=(0, offset), pady=(0, offset))
    if ancho is not None:
        tarjeta.config(width=ancho, height=alto or ancho)
        tarjeta.pack_propagate(False)
    return sombra, tarjeta


def crear_boton(ventana, texto, comando, ancho=22, alto=2, sombra=True):
    """Botón del tema con hover, foco y, por defecto, sombra de tarjeta."""
    offset_x = 4
    offset_y = 5
    if ancho <= 8:
        offset_x, offset_y = 2, 3
    padre = ventana
    if sombra:
        padre = tk.Frame(ventana, bg=obtener_color("sombra"))
    boton = tk.Button(
        padre,
        text=texto,
        command=comando,
        font=fuente(14, True),
        bg=obtener_color("boton"),
        fg=obtener_color("boton_texto"),
        activebackground=obtener_color("boton_hover"),
        activeforeground=obtener_color("boton_texto"),
        relief="flat",
        cursor="hand2",
        width=ancho,
        height=alto,
        takefocus=1,
        highlightthickness=3,
        highlightbackground=obtener_color("fondo"),
        highlightcolor=obtener_color("foco"),
        padx=8,
        pady=8,
    )

    def entrar(_evento):
        if str(boton.cget("state")) != "disabled":
            boton.config(bg=obtener_color("boton_hover"))

    def salir(_evento):
        if str(boton.cget("state")) != "disabled":
            boton.config(bg=obtener_color("boton"))

    boton.bind("<Enter>", entrar)
    boton.bind("<Leave>", salir)
    if sombra:
        boton.pack(fill="both", expand=True, padx=(0, offset_x), pady=(0, offset_y))
        _redirigir_geometria(boton, padre)
    return boton


def crear_etiqueta(ventana, texto, tamano=14, negrita=False, color=None):
    """Crea una etiqueta de texto con los colores del tema."""
    if color is None:
        color = obtener_color("texto")
    return tk.Label(
        ventana,
        text=texto,
        font=fuente(tamano, negrita),
        bg=obtener_color("panel"),
        fg=color,
    )


def crear_titulo(ventana, texto, tamano=26, animar=False):
    """Crea el título grande de una pantalla (sin grow: se siente como carga)."""
    etiqueta = tk.Label(
        ventana,
        text=texto,
        font=fuente(tamano, True),
        bg=obtener_color("fondo"),
        fg=obtener_color("texto"),
    )
    if animar:
        try:
            from .animaciones import animar_aparicion_titulo
            ventana.after(1, lambda e=etiqueta, t=tamano:
                          animar_aparicion_titulo(e, tam_final=t, tam_inicial=18))
        except Exception:
            pass
    return etiqueta


def crear_barra_progreso(ventana, porcentaje, ancho=340):
    """Crea una barra que muestra el porcentaje de avance."""
    return ttk.Progressbar(
        ventana,
        style="Barra.Horizontal.TProgressbar",
        length=ancho,
        maximum=100,
        value=porcentaje,
    )


def crear_encabezado(ventana, nombre_jugador, ir_al_menu, mostrar_boton_menu=True):
    """Barra superior persistente: si ya existe, solo actualiza textos."""
    instalar_cascaron(ventana)
    estado = getattr(ventana, "_header_state", None)
    if (estado is not None
            and estado.get("con_menu") == mostrar_boton_menu
            and estado["marco"].winfo_exists()):
        _refrescar_encabezado(estado, nombre_jugador, ir_al_menu)
        return estado["puntos"], estado["aciertos"]
    _vaciar(ventana._header)
    sombra, marco = crear_tarjeta(ventana._header, offset=4, color="panel")
    sombra.pack(fill="x", padx=16, pady=(12, 8))

    etiqueta_nombre = crear_etiqueta(marco, f"Jugador: {nombre_jugador}", 12, True)
    etiqueta_puntos = crear_etiqueta(marco, f"Puntos: {puntuacion.puntos}", 12, True,
                                     color=obtener_color("acento"))
    etiqueta_aciertos = crear_etiqueta(
        marco, f"Aciertos: {puntuacion.porcentaje_aciertos()}%", 12, True)
    etiqueta_nivel = crear_etiqueta(
        marco, f"Nivel: {puntuacion.nivel_actual}", 12, True,
        color=obtener_color("acento"))

    etiqueta_nombre.grid(row=0, column=0, padx=(12, 16), pady=8)
    etiqueta_puntos.grid(row=0, column=1, padx=(0, 16), pady=8)
    etiqueta_aciertos.grid(row=0, column=2, padx=(0, 16), pady=8)
    etiqueta_nivel.grid(row=0, column=3, padx=(0, 16), pady=8)
    marco.grid_columnconfigure(4, weight=1)

    columna = 5
    if not audio_disponible():
        aviso = crear_etiqueta(marco, "Sin sonido", 11, False,
                               color=obtener_color("texto_secundario"))
        aviso.grid(row=0, column=columna, padx=8)
        columna += 1
        control_volumen = None
    else:
        marco_vol = tk.Frame(marco, bg=obtener_color("panel"))
        etiqueta_vol = tk.Label(
            marco_vol, text="Vol.", font=fuente(10),
            bg=obtener_color("panel"),
            fg=obtener_color("texto_secundario"))
        etiqueta_vol.pack(side="left", padx=(0, 4))
        control_volumen = ttk.Scale(
            marco_vol, from_=0, to=100, orient="horizontal",
            length=88, style="Volumen.Horizontal.TScale",
            command=lambda v: establecer_volumen(float(v) / 100.0))
        control_volumen.set(volumen() * 100)
        control_volumen.pack(side="left")
        marco_vol.grid(row=0, column=columna, padx=8, pady=6, sticky="e")
        columna += 1

    if tema_actual == "claro":
        texto_tema = "Modo oscuro"
    else:
        texto_tema = "Modo claro"
    boton_tema = tk.Button(
        marco, text=texto_tema, command=lambda: alternar_tema(ventana),
        font=fuente(11, True), bg=obtener_color("tarjeta"),
        fg=obtener_color("texto"), activebackground=obtener_color("barra_fondo"),
        relief="flat", cursor="hand2", padx=12, pady=8, takefocus=1,
        highlightthickness=2, highlightbackground=obtener_color("panel"),
        highlightcolor=obtener_color("foco"))
    boton_tema.grid(row=0, column=columna, padx=8, pady=6)
    columna += 1

    if mostrar_boton_menu:
        boton_menu = tk.Button(
            marco, text="Menú", command=ir_al_menu,
            font=fuente(11, True), bg=obtener_color("tarjeta"),
            fg=obtener_color("texto"), activebackground=obtener_color("barra_fondo"),
            relief="flat", cursor="hand2", padx=12, pady=8, takefocus=1,
            highlightthickness=2, highlightbackground=obtener_color("panel"),
            highlightcolor=obtener_color("foco"))
        boton_menu.grid(row=0, column=columna, padx=(8, 12), pady=6)
    else:
        boton_menu = None

    ventana._header_state = {
        "marco": marco,
        "nombre": etiqueta_nombre,
        "puntos": etiqueta_puntos,
        "aciertos": etiqueta_aciertos,
        "nivel": etiqueta_nivel,
        "tema": boton_tema,
        "menu": boton_menu,
        "con_menu": mostrar_boton_menu,
        "ir_al_menu": ir_al_menu,
        "volumen": control_volumen,
    }
    return etiqueta_puntos, etiqueta_aciertos


def _refrescar_encabezado(estado, nombre_jugador, ir_al_menu):
    """Actualiza textos y comandos del encabezado ya construido."""
    estado["nombre"].config(text=f"Jugador: {nombre_jugador}")
    estado["puntos"].config(text=f"Puntos: {puntuacion.puntos}")
    estado["aciertos"].config(text=f"Aciertos: {puntuacion.porcentaje_aciertos()}%")
    estado["nivel"].config(text=f"Nivel: {puntuacion.nivel_actual}")
    estado["ir_al_menu"] = ir_al_menu
    if tema_actual == "claro":
        estado["tema"].config(text="Modo oscuro")
    else:
        estado["tema"].config(text="Modo claro")
    if estado["menu"] is not None:
        estado["menu"].config(command=ir_al_menu)


def actualizar_encabezado(etiqueta_puntos, etiqueta_aciertos):
    """Pone los puntos y aciertos actuales en las etiquetas del encabezado."""
    etiqueta_puntos.config(text=f"Puntos: {puntuacion.puntos}")
    etiqueta_aciertos.config(text=f"Aciertos: {puntuacion.porcentaje_aciertos()}%")


def crear_pipo(ventana, mensaje, tamano_imagen=110, ancho_burbuja=430,
              animar=False):
    """Crea el panel de Pipo: su imagen y un globo de diálogo."""
    sombra, marco = crear_tarjeta(ventana, offset=5, color="panel")
    sombra.pack(pady=8)

    imagen = cargar_imagen(ventana, IMAGEN_PIPO_UI)
    if imagen is None:
        imagen = cargar_imagen(ventana, IMAGEN_PIPO_GRANDE, tamano_max=tamano_imagen)
    if imagen is not None:
        etiqueta_pinguino = tk.Label(marco, image=imagen, bg=obtener_color("panel"))
        etiqueta_pinguino.image = imagen
    else:
        lienzo = tk.Canvas(marco, width=tamano_imagen, height=tamano_imagen,
                           bg=obtener_color("panel"), highlightthickness=0)
        lienzo.create_oval(4, 4, tamano_imagen - 4, tamano_imagen - 4,
                           fill=obtener_color("boton"), outline="")
        lienzo.create_text(tamano_imagen / 2, tamano_imagen / 2, text="P",
                           fill="white", font=fuente(tamano_imagen // 2, True))
        etiqueta_pinguino = lienzo

    etiqueta_pinguino.pack(side="left", padx=(12, 16), pady=10)

    burbuja = tk.Label(
        marco,
        text=mensaje,
        font=fuente(13),
        bg=obtener_color("burbuja"),
        fg=obtener_color("texto"),
        wraplength=ancho_burbuja,
        justify="left",
        padx=20,
        pady=14,
        highlightthickness=2,
        highlightbackground=obtener_color("borde"),
    )
    burbuja.pack(side="left", fill="both", expand=True, padx=(0, 12), pady=10)
    if animar:
        try:
            from .animaciones import resal_burbuja_pipo
            ventana.after(1, lambda b=burbuja: resal_burbuja_pipo(b))
        except Exception:
            pass
    return burbuja


def circulo_letra(ventana, letra, tamano=80):
    """Dibuja un círculo de color con una letra adentro (imagen alternativa)."""
    lienzo = tk.Canvas(ventana, width=tamano, height=tamano,
                       bg=obtener_color("tarjeta"), highlightthickness=0)
    lienzo.create_oval(4, 4, tamano - 4, tamano - 4,
                       fill=obtener_color("boton"), outline="")
    lienzo.create_text(tamano / 2, tamano / 2, text=letra,
                       fill="white", font=fuente(tamano // 3, True))
    return lienzo
