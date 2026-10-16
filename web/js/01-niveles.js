/* Niveles CEFR (A1, A2, B1) y filtro acumulativo.
   Espejo de datos/niveles.py: B1 ya sabe A1 y A2; el filtro compara
   índices en la tupla ordenada. Cada nivel también cambia constantes
   de juego (rondas, parejas, espera del volteo, hueco inicial). */
window.PEA = window.PEA || {};

PEA.niveles = (function () {
  "use strict";

  const NIVELES = PEA_DATOS.niveles;
  const NIVEL_POR_DEFECTO = PEA_DATOS.nivelPorDefecto;

  function nivelValido(nivel) {
    return NIVELES.indexOf(nivel) !== -1;
  }

  function normalizarNivel(nivel) {
    if (nivelValido(nivel)) return nivel;
    const actual = PEA.estado ? PEA.estado.leerNivel() : null;
    return nivelValido(actual) ? actual : NIVEL_POR_DEFECTO;
  }

  function indice(nivel) {
    return NIVELES.indexOf(normalizarNivel(nivel));
  }

  function cumpleNivel(etiqueta, nivel) {
    if (!nivelValido(etiqueta)) return false;
    return NIVELES.indexOf(etiqueta) <= indice(nivel);
  }

  function filtrarPorNivel(items, nivel) {
    const elegido = normalizarNivel(nivel);
    return items.filter(function (item) {
      return cumpleNivel(item.nivel, elegido);
    });
  }

  function parametrosNivel(nivel) {
    const clave = normalizarNivel(nivel);
    return Object.assign({}, PEA_DATOS.parametros[clave]);
  }

  function palabrasDelNivel(nivel) {
    const todas = [];
    Object.keys(PEA_DATOS.categorias).forEach(function (nombre) {
      todas.push.apply(todas, PEA_DATOS.categorias[nombre]);
    });
    return filtrarPorNivel(todas, nivel);
  }

  function categoriasDelNivel(nivel) {
    const resultado = {};
    Object.keys(PEA_DATOS.categorias).forEach(function (nombre) {
      const filtradas = filtrarPorNivel(PEA_DATOS.categorias[nombre], nivel);
      if (filtradas.length > 0) resultado[nombre] = filtradas;
    });
    return resultado;
  }

  function preguntasDelNivel(nivel) {
    return filtrarPorNivel(PEA_DATOS.trivia, nivel);
  }

  function parejasDelNivel(nivel) {
    return filtrarPorNivel(PEA_DATOS.parejas, nivel);
  }

  /* Sin espacios ni guiones y de 3 letras o más: desordenar "police
     officer" confunde al jugador. Filtramos aquí, como en Python. */
  function palabrasJugables(nivel) {
    const aptas = [];
    palabrasDelNivel(nivel).forEach(function (palabra) {
      const ingles = palabra.ingles;
      if (ingles.indexOf(" ") !== -1 || ingles.indexOf("-") !== -1) return;
      if (ingles.length < 3) return;
      aptas.push(palabra);
    });
    return aptas;
  }

  return {
    NIVELES: NIVELES,
    NIVEL_POR_DEFECTO: NIVEL_POR_DEFECTO,
    nivelValido: nivelValido,
    normalizarNivel: normalizarNivel,
    cumpleNivel: cumpleNivel,
    filtrarPorNivel: filtrarPorNivel,
    parametrosNivel: parametrosNivel,
    palabrasDelNivel: palabrasDelNivel,
    categoriasDelNivel: categoriasDelNivel,
    preguntasDelNivel: preguntasDelNivel,
    parejasDelNivel: parejasDelNivel,
    palabrasJugables: palabrasJugables,
  };
})();
