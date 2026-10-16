/* Pantalla de carga: la primera impresión del juego (como en un
   videojuego). Pipo flota desde abajo con su bob eterno, el título
   crece, la barra polar se llena con un barrido de luz y a los 2.2 s
   el velo disuelve la carga — debajo ya está viva la pantalla real,
   así que la transición no salta. Un toque la salta ("Toca para
   saltar" aparece a los 500 ms). Con movimiento reducido: versión
   estática breve (700 ms), sin flotar ni barrer. */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.carga = (function () {
  "use strict";

  const DURACION = 2200;
  const DURACION_REDUCIDO = 700;

  function terminar(velo, idTope) {
    if (idTope) window.clearTimeout(idTope);
    if (!velo.isConnected) return;
    velo.classList.add("carga-muriendo");
    window.setTimeout(function () {
      velo.remove();
      /* El foco cae donde la pantalla real ya lo dejó (título). */
      const titulo = document.querySelector(".titulo-pantalla");
      if (titulo) titulo.focus({ preventScroll: true });
    }, 340);
  }

  function mostrar(terminarProgramado) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const velo = PEA.ui.h("div", "pea-carga");
    velo.setAttribute("role", "status");
    velo.setAttribute("aria-label", "Cargando Penguin English Adventure");
    let idTope = null;

    function terminar() {
      if (idTope) window.clearTimeout(idTope);
      idTope = null;
      if (!velo.isConnected) return;
      velo.classList.add("carga-muriendo");
      window.setTimeout(function () {
        velo.remove();
        /* El foco cae donde la pantalla real ya lo dejó (título). */
        const titulo = document.querySelector(".titulo-pantalla");
        if (titulo) titulo.focus({ preventScroll: true });
      }, 340);
    }

    /* Pipo flotando (la imagen va por la caché de media). */
    const pipo = PEA.ui.h("div", "carga-pipo");
    pipo.append(PEA.media.crearImg("assets/img/pinguino_128.png", {
      alt: "Pipo, el pingüino",
    }));
    velo.append(pipo);

    velo.append(PEA.ui.texto(PEA.ui.h("h1", "carga-titulo"),
      "Penguin English Adventure"));
    velo.append(PEA.ui.texto(PEA.ui.h("p", "carga-subtitulo"),
      "Aprende inglés con un pingüino · CEFR A1–B1"));

    /* Barra de carga polar: hueco hundido + relleno con barrido. */
    const barra = PEA.ui.h("div", "progress carga-barra");
    barra.setAttribute("aria-hidden", "true");
    barra.append(PEA.ui.h("div", "progress-bar carga-relleno"));
    velo.append(barra);

    const pista = PEA.ui.h("p", "carga-pista");
    pista.textContent = "Toca para saltar";
    velo.append(pista);

    document.body.append(velo);

    /* Tocar en cualquier parte salta (desde 500 ms, para no saltarla
       con el clic de un intento previo). */
    let saltable = false;
    velo.addEventListener("pointerdown", function () {
      if (saltable) terminar();
    });
    velo.addEventListener("keydown", function () {
      if (saltable) terminar();
    });
    window.setTimeout(function () { saltable = true; }, 500);

    idTope = window.setTimeout(terminar,
      reduce ? DURACION_REDUCIDO : DURACION);
    return velo;
  }

  return { mostrar: mostrar };
})();
