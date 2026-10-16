/* Pantalla del juego de memoria: parejas palabra-imagen con volteo 3D.
   Espejo de interfaz/memoria.py pero con CSS en vez del lienzo pygame:
   el tablero se renderiza **una vez** y los clics mutan clases
   (.volteada/.resuelta + destello) sin destruir el DOM — igual que
   "el lienzo no se recrea en cada volteo". Las reglas (tablero,
   son_pareja, espera del flip) viven en PEA.juegos.memoria.
  prefer-reduced-motion: el CSS congela la animación, el juego sigue. */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.memoria = (function () {
  "use strict";

  function mostrarMemoria(padre, argumentos) {
    const a = argumentos || [];
    const irAlMenu = function () {
      PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
    };
    PEA.ui.encabezadoActivar(PEA.estado.leerNombre(), irAlMenu);

    const nivel = PEA.estado.leerNivel();
    /* El estado viaja en un objeto vivo al estilo de
       ventana._memoria_estado: los closures del clic no se quedan con
       copias viejas de volteadas/intentos. */
    const estado = {
      nivel: nivel,
      tablero: a[0] || [],
      parejas: a[1] || 0,
      volteadas: (a[2] || []).slice(),
      intentos: a[3] || 0,
      esperando: !!a[4],
    };
    const total = PEA.juegos.memoria.cantidadParejas(nivel);

    /* Etiqueta + burbuja refrescables, como _memoria_ui de Tk. */
    const etiqueta = PEA.ui.texto(
      PEA.ui.h("p", "texto-secundario fuente-num text-center mb-1"), "");

    padre.append(PEA.ui.titulo("Juego de memoria"));
    padre.append(etiqueta);
    const burbuja = PEA.ui.crearPipo(padre, mensajeActivo(), { ancho: "600px" });

    const tableroEl = PEA.ui.h("div", "memo-tablero seccion");
    const cartas = [];
    estado.tablero.forEach(function (info, indice) {
      const carta = crearCarta(info, indice);
      if (info.visible) {
        carta.classList.add("volteada");
        carta.disabled = true;
        carta.querySelector(".cara-frente").removeAttribute("aria-hidden");
        etiquetaCarta(carta, info);
      }
      cartas.push(carta);
      tableroEl.append(carta);
    });
    padre.append(tableroEl);
    refrescarTextos();

    /* ---------- interacción: los guardias de voltear_tarjeta ---------- */

    function voltea(indice) {
      if (estado.esperando || estado.volteadas.length >= 2) return;
      const tarjeta = estado.tablero[indice];
      if (tarjeta.visible) return;

      tarjeta.visible = true;
      estado.volteadas.push(indice);
      const carta = cartas[indice];
      carta.classList.add("volteada");
      carta.disabled = true;
      etiquetaCarta(carta, tarjeta);
      /* El frente deja de ser decorativo: lo que se ve es el texto. */
      carta.querySelector(".cara-frente")
        .removeAttribute("aria-hidden");

      if (estado.volteadas.length === 2) {
        evaluarParejas();
      } else {
        refrescarTextos();
      }
    }

    /* Para un lector de pantalla la carta voltea a "la imagen" o a la
       palabra en inglés — nunca adelanta el contenido de las tapadas. */
    function etiquetaCarta(carta, tarjeta) {
      if (tarjeta.tipo === "imagen") {
        carta.setAttribute("aria-label", "Carta con una imagen de la pareja");
      } else {
        carta.setAttribute("aria-label", "Carta con la palabra: " +
          (tarjeta.texto || ""));
      }
    }

    function evaluarParejas() {
      estado.intentos += 1;
      const primera = estado.tablero[estado.volteadas[0]];
      const segunda = estado.tablero[estado.volteadas[1]];
      const esPareja = PEA.juegos.memoria.sonPareja(primera, segunda);

      if (esPareja) {
        PEA.estado.sumarRespuesta(true);
        PEA.sonidos.reproducir("correcto");
        estado.parejas += 1;
        [primera, segunda].forEach(function (tarjeta) {
          const carta = cartas[estado.tablero.indexOf(tarjeta)];
          carta.classList.add("resuelta", "destello-pareja");
          carta.setAttribute("aria-label", "Pareja encontrada");
        });
        estado.volteadas = [];
        refrescarTextos();
        PEA.ui.refrescarEncabezado();
        if (estado.parejas === total) {
          /* Como terminar_memoria: 420 ms de respiro y a resultado. */
          window.setTimeout(terminar, 420);
        }
        return;
      }

      PEA.estado.sumarRespuesta(false);
      PEA.sonidos.reproducir("error");
      PEA.ui.refrescarEncabezado();   /* también los intentos fallidos cuentan */
      estado.esperando = true;
      refrescarTextos();
      const pendientes = estado.volteadas.slice();
      estado.volteadas = [];
      window.setTimeout(function () { reponer(pendientes); },
        PEA.juegos.memoria.esperaFlipMs(nivel));
    }

    function reponer(pendientes) {
      pendientes.forEach(function (indice) {
        estado.tablero[indice].visible = false;
        const carta = cartas[indice];
        if (carta.classList.contains("resuelta")) return;   /* por si acaso */
        carta.classList.remove("volteada");
        carta.disabled = false;
        carta.querySelector(".cara-frente").setAttribute("aria-hidden", "true");
        carta.setAttribute("aria-label", "Carta " + (indice + 1) + ", sin voltear");
      });
      estado.esperando = false;
      refrescarTextos();
    }

    function terminar() {
      PEA.estado.completarActividad("memoria");
      PEA.estado.sumarBonificacion();
      PEA.sonidos.reproducir("ganar");
      PEA.ui.refrescarEncabezado();
      /* Paridad de Tk: el "respuestas" del resultado son los intentos. */
      PEA.ui.navegar(PEA.pantallas.resultado.mostrarResultado,
        "¡Juego de memoria terminado!", estado.intentos,
        estado.intentos, estado.parejas);
    }

    /* ---------- textos del refresco (_mensaje_pipo) ---------- */

    function mensajeActivo() {
      if (estado.esperando) {
        return "¡Casi! Esas dos tarjetas no eran pareja. Sigue intentando.";
      }
      if (estado.volteadas.length === 1) {
        return "Ahora encuentra la tarjeta que hace pareja con esa.";
      }
      return "Voltea dos tarjetas: una palabra y su imagen forman una pareja.";
    }

    function refrescarTextos() {
      etiqueta.textContent = "Parejas encontradas: " + estado.parejas +
        " de " + total;
      burbuja.textContent = mensajeActivo();
    }

    function crearCarta(info, indice) {
      const carta = PEA.ui.h("button", "memoria-carta", {
        type: "button",
        "aria-label": "Carta " + (indice + 1) + ", sin voltear",
      });
      const envuelta = PEA.ui.h("div", "cara-envuelta");

      const trasera = PEA.ui.h("div", "cara cara-trasera", {
        aria: { hidden: "true" },
      });
      trasera.append(PEA.ui.texto(PEA.ui.h("span", "marca-trasera"), "?"));

      const frente = PEA.ui.h("div", "cara cara-frente", {
        aria: { hidden: "true" },
      });
      if (info.tipo === "imagen" && info.imagen) {
        /* alt vacío: revelar el texto del alt delataría la pareja. La
           cara frontal entra por media: llega ya decodificada y el
           volteo no espera red. */
        frente.append(PEA.media.crearImg("assets/img/" + info.imagen, {
          clase: "imagen-memo",
          alt: "",
        }));
      } else {
        frente.append(PEA.ui.texto(PEA.ui.h("span", "palabra-memo"),
          info.texto || ""));
      }

      envuelta.append(trasera, frente);
      carta.append(envuelta);
      carta.addEventListener("click", function () { voltea(indice); });
      return carta;
    }
  }

  return { mostrarMemoria: mostrarMemoria };
})();
