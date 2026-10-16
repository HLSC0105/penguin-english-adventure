/* Pantalla de resultado que se muestra al terminar una actividad.
   Espejo de interfaz/resultado.py: resume aciertos y puntos; el
   umbral 100% / ≥60% elige el mensaje de Pipo (perfecto,
   felicitaciones, animo). La bonificación **ya está sumada** antes de
   entrar: si se sumara aquí, alternar el tema la duplicaría — acá el
   tema no repinta, pero se mantiene el orden por paridad. El confeti
   reemplaza a LienzoCelebracion. */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.resultado = (function () {
  "use strict";

  function mostrarResultado(padre, argumentos) {
    const a = argumentos || [];
    const tituloPantalla = a[0] || "Actividad terminada";
    const puntosActividad = a[1] || 0;
    const totalPreguntas = a[2] || 0;
    const correctas = a[3] || 0;

    const irAlMenu = function () {
      PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
    };
    PEA.ui.encabezadoActivar(PEA.estado.leerNombre(), irAlMenu);

    padre.append(PEA.ui.titulo(tituloPantalla));

    /* El mensaje de Pipo según el porcentaje de aciertos. */
    const porcentaje = totalPreguntas > 0
      ? Math.round((correctas * 100) / totalPreguntas) : 100;
    const clave = porcentaje === 100 ? "perfecto"
      : (porcentaje >= 60 ? "felicitaciones" : "animo");
    PEA.ui.crearPipo(padre, PEA.ui.mensajePipo(clave));

    /* LienzoCelebracion → canvas de confeti (height fija en CSS). */
    const lienzo = PEA.ui.h("canvas", "", { id: "confeti", "aria-hidden": "true" });
    padre.append(lienzo);
    PEA.ui.confeti(lienzo, 2600);

    const tarjeta = PEA.ui.h("div", "pea-tarjeta seccion medida mx-auto py-1");
    const lineas = PEA.ui.h("div", "resultado-lineas d-flex flex-column text-center px-3 py-2");
    lineas.append(
      linea("Respuestas correctas: " + correctas + " de " +
        totalPreguntas + " (" + porcentaje + "%)", false),
      linea("Puntos en la actividad: " + puntosActividad, false),
      linea("Bonificación por terminar: +" +
        PEA.estado.C.puntosBonificacion + " puntos", true),
      linea("Tus puntos totales: " + PEA.estado.leerPuntos(), true)
    );
    tarjeta.append(lineas);
    padre.append(tarjeta);

    const pie = PEA.ui.h("div", "d-flex justify-content-center seccion");
    pie.append(PEA.ui.h("button", "btn btn-pea", {
      type: "button",
      html: "<i class=\"bi bi-arrow-left\" aria-hidden=\"true\"></i> Volver al menú",
      onclick: function () {
        PEA.sonidos.reproducir("clic");
        irAlMenu();
      },
    }));
    padre.append(pie);
  }

  function linea(textoLinea, conAcento) {
    return PEA.ui.texto(
      PEA.ui.h("span", "linea" + (conAcento ? " linea-acento" : "")),
      textoLinea);
  }

  return { mostrarResultado: mostrarResultado };
})();
