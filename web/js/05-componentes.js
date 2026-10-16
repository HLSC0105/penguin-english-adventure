/* Caja de herramientas de la interfaz: tema, cascarón persistente
   (encabezado + lienzo de pantallas), botones comunes, Pipo y la
   celebración. Espejo de interfaz/componentes.py: ninguna pantalla
   crea nodos crudos que dependan del tema sin pasar por aquí. */
window.PEA = window.PEA || {};

PEA.ui = (function () {
  "use strict";

  const PANTALLA = document.getElementById("pantalla");
  const HUD = document.getElementById("hud");

  let pantallaActual = null;      /* [función, argumentos], como guardar_pantalla */
  let hudEstado = null;           /* datos del encabezado para reconstruirlo */
  let notificador = null;         /* callback al cambiar el tema */

  /* ---------- constructor mínimo (document.createElement fino) ---------- */

  function h(tag, clase, attrs) {
    const nodo = document.createElement(tag);
    if (clase) nodo.className = clase;
    if (attrs) {
      Object.keys(attrs).forEach(function (nombre) {
        if (nombre === "html") nodo.innerHTML = attrs[nombre];
        else if (nombre === "aria") {
          Object.keys(attrs.aria).forEach(function (clave) {
            nodo.setAttribute("aria-" + clave, attrs.aria[clave]);
          });
        } else if (nombre.slice(0, 2) === "on") {
          nodo.addEventListener(nombre.slice(2), attrs[nombre]);
        } else if (nombre === "style") {
          nodo.setAttribute("style", attrs[nombre]);
        } else {
          nodo.setAttribute(nombre, attrs[nombre]);
        }
      });
    }
    return nodo;
  }

  function texto(nodo, contenido) {
    nodo.textContent = contenido;
    return nodo;
  }

  /* ---------- pantalla: limpiar + dibujar + guardar (repintar_pantalla) ---------- */

  let navegaEnVuelo = null;       /* temporizador de la fase de salida */

  function navegar(funcion) {
    const argumentos = Array.prototype.slice.call(arguments, 1);
    pantallaActual = [funcion, argumentos];

    /* Transición de juego en dos fases: la pantalla en escena sale
       (95 ms) y la nueva entra en cascada. Con movimiento reducido o
       primer dibujo, directo — como el repintado del escritorio. */
    const enEscena = PANTALLA.querySelector(".pantalla-contenido");
    const theMotionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!enEscena || theMotionReduced) {
      dibujarPantalla(funcion, argumentos);
      return;
    }
    if (navegaEnVuelo) window.clearTimeout(navegaEnVuelo);
    enEscena.classList.add("saliendo");
    navegaEnVuelo = window.setTimeout(function () {
      navegaEnVuelo = null;
      dibujarPantalla(funcion, argumentos);
    }, 95);
  }

  function repintarPantalla() {
    if (!pantallaActual) return;
    dibujarPantalla(pantallaActual[0], pantallaActual[1]);
  }

  function dibujarPantalla(funcion, argumentos) {
    PANTALLA.replaceChildren();
    const contenido = h("div", "pantalla-contenido marco");
    const seccion = h("section");
    seccion.append(contenido);
    PANTALLA.append(seccion);
    PANTALLA.classList.remove("pantalla-contenido");
    funcion(contenido, argumentos);
    window.scrollTo({ top: 0, behavior: "auto" });
    /* foco al título para teclado y lectores, sin salto de scroll */
    const titulo = contenido.querySelector(".titulo-pantalla");
    if (titulo) {
      titulo.setAttribute("tabindex", "-1");
      titulo.focus({ preventScroll: true });
    }
  }

  /* ---------- tema ---------- */

  function aplicarTema(tema) {
    document.documentElement.setAttribute(
      "data-bs-theme",
      tema === "claro" ? "light" : "dark"
    );
  }

  function alternarTema() {
    const tema = PEA.estado.leerTema() === "claro" ? "oscuro" : "claro";
    PEA.estado.escribirTema(tema);
    aplicarTema(tema);
    /* Velo de hielo durante el cambio (espejo de fundir_fondo). */
    document.documentElement.classList.add("tema-flip");
    window.setTimeout(function () {
      document.documentElement.classList.remove("tema-flip");
    }, 360);
    if (hudEstado) refrescarEncabezado();     /* etiqueta del botón */
    if (typeof notificador === "function") notificador(tema);
  }

  /* ---------- encabezado persistente (crear_encabezado) ---------- */

  function encabezadoActivar(nombreJugador, irAlMenu, mostrarBotonMenu) {
    hudEstado = {
      nombre: nombreJugador,
      irAlMenu: irAlMenu,
      conMenu: mostrarBotonMenu !== false,
    };
    refrescarEncabezado();
    HUD.hidden = false;
  }

  function encabezadoOcultar() {
    hudEstado = null;
    HUD.replaceChildren();
    HUD.hidden = true;
  }

  let puntoAnterior = null;       /* para el chip de puntos del HUD */

  function refrescarEncabezado() {
    if (!hudEstado) return;
    HUD.replaceChildren();
    const interior = h("div", "hud-interior");

    const estadisticas = h("div", "hud-estadisticas");
    const datos = [
      ["Jugador:", hudEstado.nombre, "bi-person", false],
      ["Puntos:", PEA.estado.leerPuntos(), "bi-star", true],
      ["Aciertos:", PEA.estado.porcentajeAciertos() + "%", "bi-check2-circle", false],
      ["Nivel:", PEA.estado.leerNivel(), "bi-lightning-charge", true],
    ];
    datos.forEach(function (renglon) {
      const dato = h("span", "hud-dato");
      const rotulo = texto(h("span", "hud-rotulo"), renglon[0]);
      const valor = texto(h("span", "hud-valor fuente-num" + (renglon[3] ? " hud-valor-acento" : "")), renglon[1]);
      dato.append(
        h("i", "bi " + renglon[2], { "aria-hidden": "true", style: "font-size:.8rem; color:var(--texto-secundario); align-self:center;" }),
        rotulo, valor
      );
      estadisticas.append(dato);
      if (renglon[0] === "Puntos:") tareaPuntos(valor);
    });
    interior.append(estadisticas);

    const controles = h("div", "hud-controles");

    if (!PEA.sonidos.audioDisponible()) {
      const aviso = h("span", "aviso-sin-sonido");
      aviso.append(
        h("i", "bi bi-volume-mute", { "aria-hidden": "true" }),
        texto(h("span"), "Sin sonido")
      );
      controles.append(aviso);
    } else {
      const volumen = h("div", "hud-volumen");
      volumen.append(
        h("i", "bi bi-volume-up", { "aria-hidden": "true", style: "color:var(--texto-secundario); font-size: .85rem;" }),
        h("input", "form-range", { type: "range", min: "0", max: "100", value: String(PEA.sonidos.leerVolumen() * 100), "aria-label": "Volumen del sonido", oninput: function (evento) {
          PEA.sonidos.establecerVolumen(evento.target.value / 100);
        } })
      );
      controles.append(volumen);
    }

    const oscuridad = PEA.estado.leerTema() === "oscuro";
    const botonTema = h("button", "btn btn-pea-ghost", {
      type: "button",
      html: "<i class=\"bi " + (oscuridad ? "bi-brightness-high" : "bi-moon-stars") + "\" aria-hidden=\"true\"></i> " +
            (oscuridad ? "Modo claro" : "Modo oscuro"),
      onclick: function () {
        PEA.sonidos.reproducir("clic");
        alternarTema();
      },
    });
    controles.append(botonTema);

    if (hudEstado.conMenu) {
      const botonMenu = h("button", "btn btn-pea-ghost", {
        type: "button",
        html: "<i class=\"bi bi-list\" aria-hidden=\"true\"></i> Menú",
        onclick: function () {
          PEA.sonidos.reproducir("clic");
          hudEstado.irAlMenu();
        },
      });
      controles.append(botonMenu);
    }

    interior.append(controles);
    HUD.append(interior);
  }

  /* Feedback de pantalla completa del juego: si el puntaje creció desde
     el último HUD, el NÚMERO late y un chip "+N" despega hacia arriba. */
  function tareaPuntos(nodoValor) {
    const puntos = PEA.estado.leerPuntos();
    if (puntoAnterior !== null && puntos > puntoAnterior) {
      const salto = puntos - puntoAnterior;
      nodoValor.classList.add("puntos-subieron");
      const chip = h("span", "chip-puntos", {
        "aria-hidden": "true",
      });
      chip.textContent = "+" + salto;
      nodoValor.append(chip);
      window.setTimeout(function () { chip.remove(); }, 950);
      window.setTimeout(function () {
        nodoValor.classList.remove("puntos-subieron");
      }, 300);
    }
    puntoAnterior = puntos;
  }

  /* ---------- piezas comunes ---------- */

  function titulo(textoCortado, claseExtra) {
    const h1 = texto(h("h1", "titulo-pantalla" + (claseExtra ? " " + claseExtra : "")), textoCortado);
    h1.setAttribute("tabindex", "-1");
    return h1;
  }

  function subtitulo(textoCortado) {
    return texto(h("p", "subtitulo"), textoCortado);
  }

  /* crear_pipo: imagen + burbuja; devuelve la burbuja editable.
     La foto va por la caché de media (02b): nunca se degrada entre
     navegaciones, y su carga manda el avatar de Pipo decodificado. */
  function crearPipo(padre, mensaje, opciones) {
    const configuracion = opciones || {};
    const caja = h("div", "pipo seccion");
    const imagen = PEA.media.crearImg("assets/img/pinguino_128.png", {
      clase: "pipo-foto",
      alt: "Pipo, el pingüino",
      width: "128",
    });
    caja.append(imagen);
    const burbujaNodo = texto(h("div", "burbuja"), mensaje);
    if (configuracion.ancho) {
      burbujaNodo.style.maxWidth = configuracion.ancho;
    }
    caja.append(burbujaNodo);
    padre.append(caja);
    return burbujaNodo;
  }

  /* mensaje_pipo: random.choice sobre la lista de MENSAJES_PIPO */
  function mensajePipo(clave) {
    const lista = PEA_DATOS.pipo[clave];
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function barraProgreso(porcentaje) {
    const marco = h("div", "progress");
    marco.setAttribute("role", "progressbar");
    marco.setAttribute("aria-valuenow", String(Math.round(porcentaje)));
    marco.setAttribute("aria-valuemin", "0");
    marco.setAttribute("aria-valuemax", "100");
    const llenado = h("div", "progress-bar", {
      style: "--lleno:" + Math.max(0, Math.min(100, porcentaje)) / 100,
    });
    marco.append(llenado);
    return marco;
  }

  /* Imagen OpenMoji de una palabra; si falta, círculo con la inicial
     (igual que circulo_letra en Tk). Si el <img> falla en caliente,
     lo sustituimos por el círculo. */
  /* Imagen OpenMoji de una palabra; si falta, círculo con la inicial
     (igual que circulo_letra en Tk). Por la caché de media el decode
     sucede una vez: el nodo entra ya cargado o directo al círculo. */
  function imagenPalabra(clase, atributos) {
    const envoltura = h("div", clase || "");
    const attrs = Object.assign({}, atributos);
    const inicial = (attrs["data-inicial"] || "P").toUpperCase();

    function pintarCirculo() {
      envoltura.replaceChildren();
      const circulo = h("span", "marca-trasera", { style: "width:72px;height:72px;font-size:2rem;border-radius:50%;" });
      texto(circulo, inicial);
      envoltura.append(circulo);
    }

    if (!attrs.src) {
      pintarCirculo();
      return envoltura;
    }
    const src = attrs.src;
    delete attrs.src;
    envoltura.append(PEA.media.crearImg(src, attrs, pintarCirculo));
    return envoltura;
  }

  /* ---------- confeti (LienzoCelebracion) ----------
     Modo continuo (P6): el cañón no se apaga — recarga partículas
     indefinidamente mientras la pantalla de resultado viva, y muere
     exactamente cuando el jugador pulsa "Volver al menú": navegar
     desenlaza el canvas y el requestAnimationFrame se cancela solo.
     Pestaña oculta == frames congelados (cero CPU). */
  function confeti(canvas, _duracionIgnorada) {
    const contexto2d = canvas.getContext("2d");
    if (!contexto2d) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const estilos = getComputedStyle(document.documentElement);
    function colorVar(nombre, respaldo) {
      const valor = estilos.getPropertyValue(nombre).trim();
      return valor || respaldo;
    }
    const colores = [
      colorVar("--acento", "#FBBF24"),
      colorVar("--correcto", "#22C55E"),
      colorVar("--boton", "#1E3A8A"),
      "#FFFFFF",
    ];

    const ancho = canvas.width = canvas.offsetWidth || 600;
    const alto = canvas.height = canvas.offsetHeight || 120;
    const TOTAL = 130;
    const particulas = [];

    function nuevaParticula() {
      return {
        x: Math.random() * ancho,
        y: -20 - Math.random() * alto,
        w: 6 + Math.random() * 5,
        h: 9 + Math.random() * 7,
        vy: 2.4 + Math.random() * 2.6,
        vx: -1.1 + Math.random() * 2.2,
        angulo: Math.random() * Math.PI * 2,
        va: (-0.16 + Math.random() * 0.32),
        color: colores[Math.floor(Math.random() * colores.length)],
      };
    }
    for (let i = 0; i < TOTAL; i += 1) particulas.push(nuevaParticula());

    function marco() {
      /* Muerte natural: la pantalla cambió (el jugador ya navegó). */
      if (!canvas.isConnected) return;
      /* Pestaña oculta: congelar para no gastar CPU ni batería. */
      if (document.hidden) {
        requestAnimationFrame(marco);
        return;
      }
      contexto2d.clearRect(0, 0, ancho, alto);
      particulas.forEach(function (particula) {
        particula.x += particula.vx;
        particula.y += particula.vy;
        particula.angulo += particula.va;
        /* Reciclaje: la que aterriza vuelve a caer de arriba. */
        if (particula.y > alto + 20) {
          Object.assign(particula, nuevaParticula(), { y: -15 });
        }
        contexto2d.save();
        contexto2d.translate(particula.x, particula.y);
        contexto2d.rotate(particula.angulo);
        contexto2d.fillStyle = particula.color;
        contexto2d.fillRect(-particula.w / 2, -particula.h / 2, particula.w, particula.h);
        contexto2d.restore();
      });
      requestAnimationFrame(marco);
    }
    requestAnimationFrame(marco);
  }

  /* ---------- arranque ---------- */

  function iniciar() {
    aplicarTema(PEA.estado.leerTema());
    PEA.sonidos.precargar();
    PEA.sonidos.alCambiarSinSonido(function () {
      if (hudEstado) refrescarEncabezado();   /* slider → aviso "Sin sonido" */
    });
  }

  return {
    h: h,
    texto: texto,
    navegar: navegar,
    repintarPantalla: repintarPantalla,
    alternarTema: alternarTema,
    encabezadoActivar: encabezadoActivar,
    encabezadoOcultar: encabezadoOcultar,
    refrescarEncabezado: refrescarEncabezado,
    titulo: titulo,
    subtitulo: subtitulo,
    crearPipo: crearPipo,
    mensajePipo: mensajePipo,
    barraProgreso: barraProgreso,
    imagenPalabra: imagenPalabra,
    confeti: confeti,
    iniciar: iniciar,
    pantallaActualRef: function () {
      return pantallaActual;
    },
  };
})();
