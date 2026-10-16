/* Puntos, aciertos, progreso y nivel CEFR del jugador.
   Espejo de utilidades/puntuacion.py. La sesión vive en
   sessionStorage: sobrevive recargas dentro de la pestaña y se limpia
   al cerrar pestaña o navegador — y "Cerrar sesión" la borra. */
window.PEA = window.PEA || {};

PEA.estado = (function () {
  "use strict";

  const CLAVE = "pea.sesion";
  const CLAVE_TEMA = "pea.tema";
  const C = PEA_DATOS.constantes;

  function porDefecto() {
    return {
      nombre: "",
      puntos: 0,
      respondidas: 0,
      correctas: 0,
      actividades: [],
      nivel: PEA_DATOS.nivelPorDefecto,
    };
  }

  let sesion = porDefecto();

  function cargarDePestania() {
    try {
      const bruto = sessionStorage.getItem(CLAVE);
      if (!bruto) return;
      const guardada = JSON.parse(bruto);
      if (guardada && typeof guardada === "object") {
        sesion = Object.assign(porDefecto(), guardada);
        sesion.actividades = Array.isArray(sesion.actividades)
          ? sesion.actividades : [];
      }
    } catch (error) {
      sesion = porDefecto();
    }
  }

  function persistir() {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
    } catch (error) {
      /* Modo privado u overflow: el juego sigue, como en el escritorio. */
    }
  }

  /* reiniciar: puntuación en cero y nivel A2 (equivale a reiniciar_puntuacion) */
  function reiniciar() {
    sesion = porDefecto();
    persistir();
  }

  function establecerNivel(nivel) {
    if (PEA.niveles.nivelValido(nivel)) sesion.nivel = nivel;
    persistir();
    return sesion.nivel;
  }

  function establecerNombre(nombre) {
    sesion.nombre = String(nombre || "").trim();
    persistir();
  }

  /* +10 por acierto; una llamada por intento (precondición igual que Python) */
  function sumarRespuesta(esCorrecta) {
    sesion.respondidas += 1;
    if (esCorrecta) {
      sesion.correctas += 1;
      sesion.puntos += C.puntosCorrecta;
      persistir();
      return C.puntosCorrecta;
    }
    persistir();
    return 0;
  }

  function sumarBonificacion() {
    sesion.puntos += C.puntosBonificacion;
    persistir();
  }

  function porcentajeAciertos() {
    if (sesion.respondidas === 0) return 0;
    return Math.round((sesion.correctas * 100) / sesion.respondidas);
  }

  /* Solo la primera vez marca la actividad como completada. */
  function completarActividad(nombre) {
    if (sesion.actividades.indexOf(nombre) === -1) {
      sesion.actividades.push(nombre);
      persistir();
    }
  }

  function actividadCompletada(nombre) {
    return sesion.actividades.indexOf(nombre) !== -1;
  }

  function progresoPorcentaje() {
    return Math.round(
      (sesion.actividades.length * 100) / C.totalActividades);
  }

  /* Cerrar sesión: el equivalente del botón "Salir" (ven.destroy). Even
     session storage is emptied: closing the tab already cleans it. */
  function cerrarSesion() {
    reiniciar();
    try {
      sessionStorage.removeItem(CLAVE_TEMA);
    } catch (error) { /* sin sesión, seguir */ }
  }

  /* Tema de la pestaña (oscuro por defecto, como el escritorio). */
  function leerTema() {
    let tema = "oscuro";
    try {
      tema = sessionStorage.getItem(CLAVE_TEMA) === "claro" ? "claro" : "oscuro";
    } catch (error) { tema = "oscuro"; }
    return tema;
  }

  function escribirTema(tema) {
    try {
      sessionStorage.setItem(CLAVE_TEMA, tema === "claro" ? "claro" : "oscuro");
    } catch (error) { /* seguir */ }
  }

  cargarDePestania();

  return {
    C: C,
    reiniciar: reiniciar,
    establecerNivel: establecerNivel,
    establecerNombre: establecerNombre,
    sumarRespuesta: sumarRespuesta,
    sumarBonificacion: sumarBonificacion,
    porcentajeAciertos: porcentajeAciertos,
    completarActividad: completarActividad,
    actividadCompletada: actividadCompletada,
    progresoPorcentaje: progresoPorcentaje,
    cerrarSesion: cerrarSesion,
    leerTema: leerTema,
    escribirTema: escribirTema,
    leerNombre: function () { return sesion.nombre; },
    leerPuntos: function () { return sesion.puntos; },
    leerRespondidas: function () { return sesion.respondidas; },
    leerCorrectas: function () { return sesion.correctas; },
    leerActividades: function () { return sesion.actividades.slice(); },
    leerNivel: function () { return sesion.nivel; },
    tieneNombre: function () { return sesion.nombre.trim() !== ""; },
  };
})();
