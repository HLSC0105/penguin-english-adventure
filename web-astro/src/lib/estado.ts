/* Sesión del jugador (espejo de utilidades/puntuacion.py).
   +10 por acierto, +20 de bonificación, registro de actividades y el
   nivel CEFR. La sesión vive en sessionStorage: sobrevive recargas de
   la pestaña y se limpia al cerrarla — «Cerrar sesión» la borra. */
import { NIVEL_POR_DEFECTO, nivelValido, type Nivel } from "./datos";

const CLAVE = "pea.sesion";
const CLAVE_TEMA = "pea.tema";
const CLAVE_SPLASH = "pea.splash";

export interface Sesion {
  nombre: string;
  puntos: number;
  respondidas: number;
  correctas: number;
  actividades: string[];
  nivel: Nivel;
}

const CONSTANTES = { puntosCorrecta: 10, puntosBonificacion: 20, totalActividades: 5 };

function porDefecto(): Sesion {
  return {
    nombre: "",
    puntos: 0,
    respondidas: 0,
    correctas: 0,
    actividades: [],
    nivel: NIVEL_POR_DEFECTO,
  };
}

let sesion: Sesion = porDefecto();

function cargarDePestania(): void {
  try {
    const bruto = sessionStorage.getItem(CLAVE);
    if (!bruto) return;
    const guardada = JSON.parse(bruto);
    if (guardada && typeof guardada === "object") {
      sesion = { ...porDefecto(), ...guardada };
      if (!Array.isArray(sesion.actividades)) sesion.actividades = [];
      if (!nivelValido(sesion.nivel)) sesion.nivel = NIVEL_POR_DEFECTO;
    }
  } catch {
    sesion = porDefecto();
  }
}

function persistir(): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
  } catch { /* modo privado: el juego sigue */ }
}

export function establecerNivel(nivel: Nivel): Nivel {
  if (nivelValido(nivel)) sesion.nivel = nivel;
  persistir();
  return sesion.nivel;
}

export function establecerNombre(nombre: string): void {
  sesion.nombre = String(nombre || "").trim();
  persistir();
}

export function sumarRespuesta(esCorrecta: boolean): number {
  sesion.respondidas += 1;
  if (esCorrecta) {
    sesion.correctas += 1;
    sesion.puntos += CONSTANTES.puntosCorrecta;
  }
  persistir();
  return esCorrecta ? CONSTANTES.puntosCorrecta : 0;
}

export function sumarBonificacion(): void {
  sesion.puntos += CONSTANTES.puntosBonificacion;
  persistir();
}

export function porcentajeAciertos(): number {
  if (sesion.respondidas === 0) return 0;
  return Math.round((sesion.correctas * 100) / sesion.respondidas);
}

export function completarActividad(nombre: string): void {
  if (!sesion.actividades.includes(nombre)) {
    sesion.actividades.push(nombre);
    persistir();
  }
}

export function actividadCompletada(nombre: string): boolean {
  return sesion.actividades.includes(nombre);
}

export function progresoPorcentaje(): number {
  return Math.round((sesion.actividades.length * 100) / CONSTANTES.totalActividades);
}

export function cerrarSesion(): void {
  sesion = porDefecto();
  persistir();
  try { sessionStorage.removeItem(CLAVE_TEMA); } catch { /* seguir */ }
}

export function leerTema(): "claro" | "oscuro" {
  try {
    return sessionStorage.getItem(CLAVE_TEMA) === "claro" ? "claro" : "oscuro";
  } catch {
    return "oscuro";
  }
}

export function escribirTema(tema: "claro" | "oscuro"): void {
  try { sessionStorage.setItem(CLAVE_TEMA, tema); } catch { /* seguir */ }
}

export function splashVisto(): boolean {
  try { return sessionStorage.getItem(CLAVE_SPLASH) === "1"; } catch { return false; }
}

export function marcarSplashVisto(): void {
  try { sessionStorage.setItem(CLAVE_SPLASH, "1"); } catch { /* seguir */ }
}

/* lectores (la UI los usa en cada page-load) */
export const leerNombre = () => sesion.nombre;
export const leerPuntos = () => sesion.puntos;
export const leerNivel = () => sesion.nivel;
export const leerActividades = () => sesion.actividades.slice();
export const tieneNombre = () => sesion.nombre.trim() !== "";

cargarDePestania();
