/* Sonidos con archivos WAV locales (assets/sonidos).
   Espejo de utilidades/sonidos.py: si un WAV no carga o el navegador
   bloquea la reproducción, el juego sigue y la interfaz muestra
   "Sin sonido" — nunca lanza una excepción visible.

   ¿Por qué un POOL? Con un solo <Audio> por sonido, reproducir dos
   veces seguidas el mismo efecto reinicia (currentTime=0) el primer
   intento; tras muchos disparos el nodo puede quedar en un estado en
   el que el navegador deja de sonarlo de forma silenciosa (exacto lo
   reportado: "los sonidos se dejan de escuchar"). Cada efecto lleva
   ahora 3 nodos rotando: un efecto que aún suena no se corta, y si un
   nodo se corrompe se reconstruye y se reintenta una vez. */
window.PEA = window.PEA || {};

PEA.sonidos = (function () {
  "use strict";

  const ARCHIVOS = {
    clic: "clic.wav",
    correcto: "correcto.wav",
    error: "error.wav",
    ganar: "ganar.wav",
  };
  const NODOS_POR_SONIDO = 3;

  let volumen = 0.5;          // como VOLUMEN_POR_DEFECTO de Python
  let disponible = true;      // cargó y ya sonó (o así se cree)
  let negociado = false;      // ya hubo por lo menos un intento real
  let sinSonidoAlCambiar = null;   /* notificador (lo registra ui.js) */
  const pools = {};           /* clave → { nodos:[Audio], sig:number } */

  function ruta(nombre) {
    return "assets/sonidos/" + ARCHIVOS[nombre];
  }

  function crearNodo(clave) {
    const audio = new Audio(ruta(clave));
    audio.volume = volumen;
    audio.preload = "auto";
    audio.addEventListener("error", marcarSinSonido, true);
    return audio;
  }

  function prepararPool(clave) {
    if (!pools[clave]) {
      pools[clave] = { nodos: [], sig: 0 };
    }
    const pool = pools[clave];
    while (pool.nodos.length < NODOS_POR_SONIDO) {
      pool.nodos.push(crearNodo(clave));
    }
    /* Reconstruye nodos que murieron (decode roto, media evict). */
    for (let i = 0; i < pool.nodos.length; i += 1) {
      if (pool.nodos[i].error || pool.nodos[i].readyState === 0 &&
          pool.nodos[i].networkState === HTMLMediaElement.NETWORK_EMPTY) {
        pool.nodos[i] = crearNodo(clave);
      }
    }
    return pool;
  }

  function marcarSinSonido() {
    disponible = false;
    if (typeof sinSonidoAlCambiar === "function") {
      sinSonidoAlCambiar();
    }
  }

  /* Devuelve true si el motor está listo y existe el WAV (como
     audio_disponible()); la exclusividad se negocia al primer play. */
  function audioDisponible() {
    return disponible && negociado === false
      ? true          /* aún no sabido: optimista como el escritorio */
      : disponible;
  }

  /* Un efecto que aún suena NO se interrumpe: se prefiere un nodo libre
     y solo se corta por rotación cuando los 3 están ocupados. */
  function nodoLibre(pool) {
    for (let i = 0; i < pool.nodos.length; i += 1) {
      const candidato = pool.nodos[pool.sig % pool.nodos.length];
      pool.sig += 1;
      if (candidato.paused || candidato.currentTime === 0) {
        return candidato;
      }
    }
    return pool.nodos[pool.nodos.length - 1];   /* todos ocupados: rotó */
  }

  function reproducir(clave) {
    if (!disponible) return;
    const pool = prepararPool(clave);
    const audio = nodoLibre(pool);
    if (!audio) return;
    try {
      audio.currentTime = 0;
    } catch (error) { /* aún decodificando: la llamada igual sonará */ }
    audio.volume = volumen;
    const promesa = audio.play();
    negociado = true;
    if (promesa && typeof promesa.catch === "function") {
      promesa.catch(function () { fallaReproducir(clave, audio); });
    }
  }

  function fallaReproducir(clave, audio) {
    if (!disponible) return;
    /* Primer nivel: posible nodo envenenado → reconstruido SOLO ese
       slot y un intento más. Segundo: bloqueo de autoplay → badge. */
    const pool = pools[clave];
    if (pool) {
      const posicion = pool.nodos.indexOf(audio);
      if (posicion !== -1) pool.nodos[posicion] = crearNodo(clave);
    }
    const reintento = new Audio(ruta(clave));
    reintento.volume = volumen;
    const deNuevo = reintento.play();
    if (deNuevo && typeof deNuevo.catch === "function") {
      deNuevo.catch(function () {
        negociado = true;
        marcarSinSonido();
      });
    } else {
      negociado = true;
    }
  }

  function precargar() {
    Object.keys(ARCHIVOS).forEach(prepararPool);
  }

  function establecerVolumen(valor) {
    const numero = Number(valor);
    if (isNaN(numero)) return;
    volumen = Math.max(0, Math.min(1, numero));
    Object.keys(pools).forEach(function (clave) {
      pools[clave].nodos.forEach(function (audio) {
        audio.volume = volumen;
      });
    });
  }

  function leerVolumen() {
    return volumen;
  }

  return {
    precargar: precargar,
    reproducir: reproducir,
    audioDisponible: audioDisponible,
    establecerVolumen: establecerVolumen,
    leerVolumen: leerVolumen,
    alCambiarSinSonido: function (notificador) {
      sinSonidoAlCambiar = notificador;
    },
  };
})();
