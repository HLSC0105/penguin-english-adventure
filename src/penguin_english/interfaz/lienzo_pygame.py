"""Lienzo 2.5D: pygame pinta off-screen y Tkinter muestra la foto.

Explicación académica
---------------------
Tkinter y pygame tienen **bucles de eventos distintos**. No metemos
``pygame.event.pump`` bloqueante: pygame solo dibuja en una Surface
en RAM y convertimos el buffer RGB a PPM (formato que PhotoImage
entiende sin Pillow). Tk muestra esa foto en un Canvas y recibe los
clics.

El volteo 3D de una carta es una proyección ortogonal:

    ancho_visible = |cos θ| · ancho
    cara = frente si cos θ ≥ 0, si no dorso

Cuando θ = 90° la carta se ve de canto (un trazo estrecho y más oscuro).
Eso es el momento autorial del juego de memoria.

La cara ``tipo=="imagen"`` hace blit del PNG (OpenMoji), no el texto.
No se llama a ``convert()``/``convert_alpha()``: esos métodos exigen
un display SDL (``set_mode``) y, sin él, cachéaban ``None`` y el
juego pintaba un círculo azul. El PNG se escala y se blitea sobre
un recuadro claro (el trazo OpenMoji es oscuro). El giro interpola
θ a velocidad constante (π/12 por fotograma) sin destruir el widget.
Si pygame no puede crear la Surface, el Canvas de Tk pinta el mismo
contrato. Los tests cubren la carga del PNG y la matemática del giro.
"""

from __future__ import annotations

import math
import os
import random
import tkinter as tk

from ..utilidades.rutas import archivo_imagen
from .animaciones import _debe_animar
from .componentes import obtener_color

# ~12 fotogramas a 33 ms ≈ 400 ms para un medio giro (π radianes).
_PASO_GIRO = math.pi / 12
_TICK_MS = 33


def ancho_carta_volteo(angulo_rad, ancho):
    """Proyección del ancho de una carta al rotar en Y."""
    return max(2.0, abs(math.cos(angulo_rad)) * ancho)


def cara_visible(angulo_rad):
    """'frente' (palabra/imagen) o 'dorso' según el ángulo."""
    return "frente" if math.cos(angulo_rad) >= 0 else "dorso"


def sombra_canto(angulo_rad):
    """0 en cara plena, 1 de canto: oscurece el color al filo."""
    return 1.0 - abs(math.cos(angulo_rad))


def usa_imagen_frente(tarjeta):
    """True si la cara visible debe ser el PNG, no la palabra."""
    return tarjeta.get("tipo") == "imagen" and bool(tarjeta.get("imagen"))


def etiqueta_frente(tarjeta):
    """Texto de la cara palabra; None si el frente es imagen."""
    if usa_imagen_frente(tarjeta):
        return None
    texto = tarjeta.get("texto")
    if texto:
        return str(texto)[:12]
    return "?"


def cargar_png_pygame(nombre, ancho, alto, cache=None):
    """Carga un OpenMoji sin ``convert()`` (falla si no hay display SDL).

    Precondición: el PNG existe en ``recursos/imagenes``.
    Postcondición: Surface lista para blit, o None si el archivo no está.
    """
    if not nombre or ancho < 8 or alto < 8:
        return None
    clave = (nombre, int(ancho), int(alto))
    if cache is not None and clave in cache:
        return cache[clave]
    ruta = archivo_imagen(nombre)
    if ruta is None:
        if cache is not None:
            cache[clave] = None
        return None
    try:
        import pygame
        cruda = pygame.image.load(str(ruta))
        destino = (max(8, int(ancho)), max(8, int(alto)))
        try:
            escala = pygame.transform.smoothscale(cruda, destino)
        except Exception:
            escala = pygame.transform.scale(cruda, destino)
    except Exception:
        escala = None
    if cache is not None:
        cache[clave] = escala
    return escala


def superficie_a_ppm(superficie):
    """Serializa una Surface RGB a bytes PPM (P6) para PhotoImage."""
    ancho, alto = superficie.get_size()
    datos = superficie.get_buffer().raw
    # pygame 2: tostring es más portable que get_buffer en algunos builds
    try:
        import pygame
        tobytes = getattr(pygame.image, "tobytes", None) or pygame.image.tostring
        datos = tobytes(superficie, "RGB")
    except Exception:
        pass
    header = f"P6 {ancho} {alto} 255 ".encode("ascii")
    return header + datos


def _pygame_superficie(ancho, alto):
    """Crea una Surface RGB sin ventana, o None si pygame no pinta."""
    try:
        import pygame
        if not pygame.get_init():
            pygame.init()
        return pygame.Surface((int(ancho), int(alto)))
    except Exception:
        return None


class _ProxyTarjeta:
    """Imita un Button.invoke() para que los tests de UI no cambien de idea."""

    def __init__(self, lienzo, indice):
        self._lienzo = lienzo
        self._indice = indice

    def invoke(self):
        self._lienzo.voltear(self._indice)

    def cget(self, clave):
        if clave == "text":
            return "?"
        return ""


class LienzoMemoria(tk.Frame):
    """Tablero de memoria dibujado con pygame (o Canvas Tk de respaldo)."""

    def __init__(self, maestro, tablero, al_voltear, ancho=720, alto=400):
        super().__init__(maestro, bg=obtener_color("fondo"))
        self.tablero = tablero
        self.al_voltear = al_voltear
        self.ancho = ancho
        self.alto = alto
        self._angulos = [math.pi if not t["visible"] else 0.0 for t in tablero]
        self._objetivos = list(self._angulos)
        self._particulas = []
        self._foto = None
        self._png_pygame = {}
        self._png_tk = {}
        self.canvas = tk.Canvas(self, width=ancho, height=alto,
                                bg=obtener_color("fondo"),
                                highlightthickness=0, cursor="hand2")
        self.canvas.pack()
        self.canvas.bind("<Button-1>", self._clic)
        self.bind("<Destroy>", self._al_destruir)
        self._vivo = True
        self._tick_activo = False
        self._tick_frames = 0
        columnas = 4
        self.filas = max(1, math.ceil(len(tablero) / columnas))
        self.columnas = columnas
        self._tick()

    def _al_destruir(self, _evento=None):
        self._vivo = False

    def cantidad(self):
        return len(self.tablero)

    def proxy(self, indice):
        return _ProxyTarjeta(self, indice)

    def proxies(self):
        return [self.proxy(i) for i in range(len(self.tablero))]

    def voltear(self, indice):
        self.al_voltear(indice)

    def sincronizar(self, tablero, animar_indices=None):
        """Actualiza ángulos objetivo según ``visible`` del tablero."""
        self.tablero = tablero
        if len(self._angulos) != len(tablero):
            self._angulos = [math.pi if not t["visible"] else 0.0 for t in tablero]
            self._objetivos = list(self._angulos)
        hay_anim = False
        for i, tarjeta in enumerate(tablero):
            destino = 0.0 if tarjeta["visible"] else math.pi
            if animar_indices and i in animar_indices and _debe_animar():
                self._objetivos[i] = destino
                hay_anim = True
            else:
                self._objetivos[i] = destino
                self._angulos[i] = destino
        self._dibujar()
        if hay_anim and not self._tick_activo:
            self._tick_frames = 0
            self._tick()

    def destellar(self, indices):
        for _ in range(18):
            self._particulas.append({
                "x": random.uniform(40, self.ancho - 40),
                "y": random.uniform(40, self.alto - 40),
                "vx": random.uniform(-3, 3),
                "vy": random.uniform(-4, -1),
                "vida": random.randint(12, 22),
                "color": random.choice(["#FBBF24", "#22C55E", "#38BDF8"]),
            })
        if not _debe_animar():
            self._particulas.clear()
        self.sincronizar(self.tablero, animar_indices=indices)

    def _celda(self, indice):
        col = indice % self.columnas
        fila = indice // self.columnas
        margen = 12
        cw = (self.ancho - margen * (self.columnas + 1)) / self.columnas
        ch = (self.alto - margen * (self.filas + 1)) / self.filas
        x = margen + col * (cw + margen) + cw / 2
        y = margen + fila * (ch + margen) + ch / 2
        return x, y, cw * 0.9, ch * 0.85

    def _indice_en(self, x, y):
        for i in range(len(self.tablero)):
            cx, cy, cw, ch = self._celda(i)
            if abs(x - cx) <= cw / 2 and abs(y - cy) <= ch / 2:
                return i
        return None

    def _clic(self, evento):
        indice = self._indice_en(evento.x, evento.y)
        if indice is not None:
            self.voltear(indice)

    def _tick(self):
        if not self._vivo:
            self._tick_activo = False
            return
        self._tick_frames += 1
        if self._tick_frames > 48:
            self._angulos = list(self._objetivos)
            self._particulas = []
            self._tick_activo = False
            self._dibujar()
            return
        vivo = False
        for i, objetivo in enumerate(self._objetivos):
            actual = self._angulos[i]
            delta = objetivo - actual
            if abs(delta) > 0.03:
                paso = _PASO_GIRO if delta > 0 else -_PASO_GIRO
                siguiente = actual + paso
                if (delta > 0 and siguiente >= objetivo) or (
                        delta < 0 and siguiente <= objetivo):
                    self._angulos[i] = objetivo
                else:
                    self._angulos[i] = siguiente
                    vivo = True
            else:
                self._angulos[i] = objetivo
        vivos = []
        for p in self._particulas:
            p["x"] += p["vx"]
            p["y"] += p["vy"]
            p["vy"] += 0.15
            p["vida"] -= 1
            if p["vida"] > 0:
                vivos.append(p)
        self._particulas = vivos
        if vivo or self._particulas:
            self._dibujar()
            self._tick_activo = True
            if self._vivo and self.winfo_exists():
                self.after(_TICK_MS, self._tick)
            else:
                self._tick_activo = False
        else:
            self._tick_activo = False
            self._dibujar()

    def _dibujar(self):
        if os.environ.get("SDL_VIDEODRIVER") == "dummy":
            self._dibujar_tk()
            return
        superficie = _pygame_superficie(self.ancho, self.alto)
        if superficie is not None:
            self._dibujar_pygame(superficie)
            try:
                ppm = superficie_a_ppm(superficie)
                self._foto = tk.PhotoImage(data=ppm, format="PPM", master=self)
                self.canvas.delete("all")
                self.canvas.create_image(0, 0, image=self._foto, anchor="nw")
                return
            except tk.TclError:
                pass
        self._dibujar_tk()

    def _surface_png(self, nombre, ancho, alto):
        """PNG escalado para blit en pygame, o None."""
        return cargar_png_pygame(nombre, ancho, alto, self._png_pygame)

    def _foto_tk(self, nombre, ancho):
        """PhotoImage del PNG para el Canvas Tk (fallback)."""
        if not nombre:
            return None
        clave = (nombre, int(ancho))
        if clave in self._png_tk:
            return self._png_tk[clave]
        ruta = archivo_imagen(nombre)
        if ruta is None:
            self._png_tk[clave] = None
            return None
        try:
            foto = tk.PhotoImage(master=self, file=str(ruta))
            if foto.width() > ancho and ancho > 8:
                factor = max(1, foto.width() // int(ancho))
                if factor > 1:
                    foto = foto.subsample(factor, factor)
        except tk.TclError:
            self._png_tk[clave] = None
            return None
        self._png_tk[clave] = foto
        return foto

    def _dibujar_pygame(self, superficie):
        import pygame
        if not pygame.font.get_init():
            pygame.font.init()
        fondo = obtener_color("fondo")
        superficie.fill(_hex_rgb(fondo))
        fuente = pygame.font.Font(None, 26)
        for i, tarjeta in enumerate(self.tablero):
            cx, cy, cw, ch = self._celda(i)
            ang = self._angulos[i]
            w = ancho_carta_volteo(ang, cw)
            osc = sombra_canto(ang)
            cara = cara_visible(ang)
            if cara == "dorso":
                color = _mezcla(_hex_rgb(obtener_color("boton")), (0, 0, 0), osc * 0.5)
            elif usa_imagen_frente(tarjeta):
                color = _mezcla(_hex_rgb(obtener_color("tarjeta")), (0, 0, 0), osc * 0.5)
            else:
                color = _mezcla(_hex_rgb(obtener_color("acento")), (0, 0, 0), osc * 0.5)
            rect = pygame.Rect(int(cx - w / 2), int(cy - ch / 2), int(w), int(ch))
            pygame.draw.rect(superficie, color, rect, border_radius=10)
            pygame.draw.rect(superficie, _hex_rgb(obtener_color("borde")),
                             rect, 2, border_radius=10)
            if w <= 24:
                continue
            if cara == "dorso":
                img = fuente.render("?", True, (255, 255, 255))
                superficie.blit(img, img.get_rect(center=(int(cx), int(cy))))
            elif usa_imagen_frente(tarjeta):
                # Fondo claro: OpenMoji es trazo oscuro; en tarjeta negra no se ve.
                margen = max(4, int(min(w, ch) * 0.08))
                interior = pygame.Rect(
                    int(cx - w / 2) + margen, int(cy - ch / 2) + margen,
                    max(8, int(w) - margen * 2), max(8, int(ch) - margen * 2))
                pygame.draw.rect(superficie, (248, 250, 252), interior,
                                 border_radius=8)
                png = self._surface_png(
                    tarjeta["imagen"], interior.w * 0.82, interior.h * 0.82)
                if png is not None:
                    superficie.blit(png, png.get_rect(center=(int(cx), int(cy))))
                else:
                    pygame.draw.circle(
                        superficie, _hex_rgb(obtener_color("boton")),
                        (int(cx), int(cy)), int(min(w, ch) * 0.22))
            else:
                tinta = (20, 20, 20)
                img = fuente.render(etiqueta_frente(tarjeta), True, tinta)
                superficie.blit(img, img.get_rect(center=(int(cx), int(cy))))
        for p in self._particulas:
            pygame.draw.circle(superficie, _hex_rgb(p["color"]),
                               (int(p["x"]), int(p["y"])), 3)

    def _dibujar_tk(self):
        self.canvas.delete("all")
        self.canvas.configure(bg=obtener_color("fondo"))
        for i, tarjeta in enumerate(self.tablero):
            cx, cy, cw, ch = self._celda(i)
            ang = self._angulos[i]
            w = ancho_carta_volteo(ang, cw)
            cara = cara_visible(ang)
            if cara == "dorso":
                fill = obtener_color("boton")
            elif usa_imagen_frente(tarjeta):
                fill = obtener_color("tarjeta")
            else:
                fill = obtener_color("acento")
            self.canvas.create_rectangle(
                cx - w / 2, cy - ch / 2, cx + w / 2, cy + ch / 2,
                fill=fill, outline=obtener_color("borde"), width=2)
            if w <= 24:
                continue
            if cara == "dorso":
                self.canvas.create_text(
                    cx, cy, text="?", fill=obtener_color("boton_texto"))
            elif usa_imagen_frente(tarjeta):
                margen = max(4, min(w, ch) * 0.08)
                self.canvas.create_rectangle(
                    cx - w / 2 + margen, cy - ch / 2 + margen,
                    cx + w / 2 - margen, cy + ch / 2 - margen,
                    fill="#F8FAFC", outline="")
                foto = self._foto_tk(tarjeta["imagen"], max(24, w * 0.62))
                if foto is not None:
                    self.canvas.create_image(cx, cy, image=foto)
                else:
                    r = min(w, ch) * 0.22
                    self.canvas.create_oval(
                        cx - r, cy - r, cx + r, cy + r,
                        fill=obtener_color("boton"), outline="")
            else:
                self.canvas.create_text(
                    cx, cy, text=etiqueta_frente(tarjeta),
                    fill=obtener_color("sobre_acento"))
        for p in self._particulas:
            self.canvas.create_oval(p["x"] - 3, p["y"] - 3, p["x"] + 3, p["y"] + 3,
                                    fill=p["color"], outline="")


class LienzoCelebracion(tk.Frame):
    """Confeti + rebote de Pipo en la pantalla de resultado."""

    def __init__(self, maestro, ancho=420, alto=120):
        super().__init__(maestro, bg=obtener_color("fondo"))
        self.ancho = ancho
        self.alto = alto
        self._foto = None
        self._t = 0
        self._bits = [
            {"x": random.uniform(0, ancho), "y": random.uniform(-40, 0),
             "vy": random.uniform(1.5, 3.5), "color": c}
            for c in ["#FBBF24", "#38BDF8", "#F472B6", "#22C55E"] * 8
        ]
        self.canvas = tk.Canvas(self, width=ancho, height=alto,
                                bg=obtener_color("fondo"), highlightthickness=0)
        self.canvas.pack()
        self._vivo = True
        self.bind("<Destroy>", lambda e: setattr(self, "_vivo", False))
        if _debe_animar():
            self._tick()
        else:
            self._dibujar()

    def _tick(self):
        if not self._vivo:
            return
        self._t += 1
        for b in self._bits:
            b["y"] += b["vy"]
            if b["y"] > self.alto:
                b["y"] = -8
                b["x"] = random.uniform(0, self.ancho)
        self._dibujar()
        if self._vivo and self.winfo_exists() and self._t < 90:
            self.after(33, self._tick)

    def _dibujar(self):
        self.canvas.delete("all")
        self.canvas.configure(bg=obtener_color("fondo"))
        rebote = abs(math.sin(self._t / 6.0)) * 10
        self.canvas.create_oval(self.ancho / 2 - 22, 70 - rebote - 22,
                                self.ancho / 2 + 22, 70 - rebote + 22,
                                fill=obtener_color("boton"), outline="")
        self.canvas.create_text(self.ancho / 2, 70 - rebote, text="P",
                                fill="white", font=("DejaVu Sans", 16, "bold"))
        for b in self._bits:
            self.canvas.create_rectangle(b["x"], b["y"], b["x"] + 6, b["y"] + 8,
                                         fill=b["color"], outline="")


def _hex_rgb(color):
    color = color.lstrip("#")
    return (int(color[0:2], 16), int(color[2:4], 16), int(color[4:6], 16))


def _mezcla(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
