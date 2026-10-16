/* Lógica pura de los cuatro juegos con puntaje.
   Espejo 1:1 de juegos/trivia.py, completar.py, ordenar.py y memoria.py.
   No toca la interfaz: las pantallas llaman estas APIs. */
window.PEA = window.PEA || {};
PEA.juegos = (function () {
  "use strict";

  /* ---- repartitions aleatorias (stdlib random en Python) ---- */

  function barajar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const intercambio = copia[i];
      copia[i] = copia[j];
      copia[j] = intercambio;
    }
    return copia;
  }

  function muestra(arr, cantidad) {
    /* sample: k items SIN repetir, O(k) sobre una copia barajada */
    return barajar(arr).slice(0, cantidad);
  }

  /* ================= TRIVIA ================= */

  function cantidadPreguntas(nivel) {
    return PEA.niveles.parametrosNivel(nivel).trivia;
  }

  function obtenerPreguntas(cantidad, nivel) {
    const banco = PEA.niveles.preguntasDelNivel(nivel);
    const pedidas = cantidad == null ? cantidadPreguntas(nivel) : cantidad;
    const reales = Math.min(Math.floor(pedidas), banco.length);
    const elegidas = muestra(banco, reales);
    /* Copia cada pregunta y baraja sus opciones para no mutar el banco. */
    return elegidas.map(function (pregunta) {
      return Object.assign({}, pregunta, {
        opciones: barajar(pregunta.opciones),
      });
    });
  }

  function validarRespuesta(pregunta, respuesta) {
    return respuesta === pregunta.correcta;
  }

  /* ================= COMPLETAR ================= */

  const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function cantidadRondas(nivel, clave) {
    return PEA.niveles.parametrosNivel(nivel)[clave === "ordenar" ? "ordenar" : "completar"];
  }

  function crearPregunta(nivel) {
    const palabras = PEA.niveles.palabrasJugables(nivel);
    const palabraInfo = palabras[Math.floor(Math.random() * palabras.length)];
    const palabra = palabraInfo.ingles.toUpperCase();
    const permiteInicial = PEA.niveles.parametrosNivel(nivel).huecoInicialPermitido;
    /* B1 no oculta la primera letra: hueco más difícil (igual que Python). */
    const minimo = (!permiteInicial && palabra.length > 1) ? 1 : 0;
    const rango = palabra.length - minimo;
    const posicion = minimo + Math.floor(Math.random() * rango);
    const letraCorrecta = palabra.charAt(posicion);

    const opciones = [letraCorrecta];
    while (opciones.length < 3) {
      const letra = LETRAS.charAt(Math.floor(Math.random() * LETRAS.length));
      if (opciones.indexOf(letra) === -1) opciones.push(letra);
    }
    return {
      palabra: palabra,
      posicion: posicion,
      opciones: barajar(opciones),
      correcta: letraCorrecta,
    };
  }

  /* "APPLE" con hueco en 3 → ['A','P','P','_','E'] (la UI une con celdas) */
  function letrasConHueco(palabra, posicion) {
    return palabra.split("").map(function (letra, indice) {
      return indice === posicion ? "_" : letra;
    });
  }

  /* ================= ORDENAR ================= */

  function crearPalabra(nivel) {
    const palabras = PEA.niveles.palabrasJugables(nivel);
    const palabraInfo = palabras[Math.floor(Math.random() * palabras.length)];
    const original = palabraInfo.ingles.toUpperCase();

    let desordenada = original;
    while (desordenada === original) {
      desordenada = barajar(original.split("")).join("");
    }
    return { original: original, desordenada: desordenada };
  }

  function validarPalabra(intentar, original) {
    return String(intentar).trim().toUpperCase() === original.toUpperCase();
  }

  /* ================= MEMORIA ================= */

  function cantidadParejas(nivel) {
    return PEA.niveles.parametrosNivel(nivel).memoriaParejas;
  }

  function esperaFlipMs(nivel) {
    return PEA.niveles.parametrosNivel(nivel).esperaFlipMs;
  }

  function crearTablero(nivel) {
    const banco = PEA.niveles.parejasDelNivel(nivel);
    const cuantas = Math.min(cantidadParejas(nivel), banco.length);
    const elegidas = muestra(banco, cuantas);
    const tarjetas = [];
    elegidas.forEach(function (pareja, numeroPareja) {
      tarjetas.push({
        par: numeroPareja,
        tipo: "palabra",
        texto: pareja.ingles,
        imagen: null,
        visible: false,
      });
      tarjetas.push({
        par: numeroPareja,
        tipo: "imagen",
        texto: null,
        imagen: pareja.imagen,
        visible: false,
      });
    });
    return barajar(tarjetas);
  }

  function sonPareja(tarjetaA, tarjetaB) {
    return tarjetaA.par === tarjetaB.par;
  }

  return {
    trivia: {
      cantidadPreguntas: cantidadPreguntas,
      obtenerPreguntas: obtenerPreguntas,
      validarRespuesta: validarRespuesta,
    },
    completar: {
      cantidadRondas: function (nivel) { return cantidadRondas(nivel, "completar"); },
      crearPregunta: crearPregunta,
      letrasConHueco: letrasConHueco,
    },
    ordenar: {
      cantidadRondas: function (nivel) { return cantidadRondas(nivel, "ordenar"); },
      crearPalabra: crearPalabra,
      validarPalabra: validarPalabra,
    },
    memoria: {
      cantidadParejas: cantidadParejas,
      esperaFlipMs: esperaFlipMs,
      crearTablero: crearTablero,
      sonPareja: sonPareja,
    },
  };
})();
