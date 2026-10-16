/* Caché viva de imágenes: ¿por qué existe?
   En sesiones largas se vio a Pipo y los OpenMoji degradarse o caer al
   círculo de respaldo: cada pantalla creaba <img> nuevos y el navegador
   se quedaba con decodes parciales sin dueño (más visibles por file://).
   Aquí cada src tiene UNA imagen decodificada a la que la app siempre
   agarra por su mapa: el bitmap nunca queda "sin dueño" — y si el
   archivo no carga, el error se decide una vez y no por navegar. */
window.PEA = window.PEA || {};

PEA.media = (function () {
  "use strict";

  const decodificadas = new Map();   /* src → Promise<HTMLImageElement> */

  /* Carga/decodificación única por src._traits(): la promesa queda en el
     mapa aunque falle (no reintentar en cada navegación por sonido de
     red inexistente — falló una vez, falla igual); se limpia solo con
     limpiar() bajo tu responsabilidad. */
  function obtener(src) {
    if (decodificadas.has(src)) return decodificadas.get(src);
    const imagen = new Image();
    imagen.decoding = "sync";
    const promesa = new Promise(function (resolver, rechazar) {
      imagen.onload = function () { resolver(imagen); };
      imagen.onerror = function () { rechazar(new Error("media: " + src)); };
    });
    imagen.src = src;
    if (typeof imagen.decode === "function") {
      imagen.decode().catch(function () { /* onload ya queda en uso */ });
    }
    decodificadas.set(src, promesa);
    return promesa;
  }

  /* Servicio: <img> listo para pantallas. El src NO se pone hasta el
     decode: la pantalla no parpadea con medio rotas, y en error de
     verdad (archivo faltante) llama alError(nodo) para pintar el
     círculo con la letra, como en el escritorio. */
  function crearImg(src, atributos, alError) {
    const nodo = document.createElement("img");
    nodo.decoding = "sync";
    if (atributos) {
      Object.keys(atributos).forEach(function (nombre) {
        if (nombre === "clase") nodo.className = atributos[nombre];
        else nodo.setAttribute(nombre, atributos[nombre]);
      });
    }
    if (!src) {
      if (typeof alError === "function") alError(nodo);
      return nodo;
    }
    obtener(src).then(function () {
      nodo.src = src;   /* resource ya warm: aparece sin razonar */
    }, function () {
      if (typeof alError === "function") alError(nodo);
    });
    return nodo;
  }

  /* Para HUD/pantallas que solo quieren asegurar la carga (Pipo de UI,
     muestras del menú) sin crear nodo extra. */
  function precargar(src) {
    if (src) obtener(src).catch(function () { /* indicador maneja UI */ });
  }

  function limpiar() { decodificadas.clear(); }

  return {
    obtener: obtener,
    crearImg: crearImg,
    precargar: precargar,
    limpiar: limpiar,
  };
})();
