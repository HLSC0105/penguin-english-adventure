/* Lógica pura de los cuatro juegos con puntaje — espejo 1:1 de
   juegos/trivia.py, completar.py, ordenar.py y memoria.py.
   No toca el DOM: las islands llaman estas APIs. */
import {
  type Nivel, type Pregunta, type Pareja, type Palabra,
  preguntasDelNivel, parejasDelNivel, palabrasJugables, parametrosNivel,
} from "./datos";

function barajar<T>(lista: T[]): T[] {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function muestra<T>(arr: T[], cantidad: number): T[] {
  return barajar(arr).slice(0, cantidad);
}

/* ============ TRIVIA ============ */

export function obtenerPreguntas(nivel: Nivel, cantidad?: number): Pregunta[] {
  const banco = preguntasDelNivel(nivel);
  const pedidas = cantidad ?? parametrosNivel(nivel).trivia;
  const reales = Math.min(Math.floor(pedidas), banco.length);
  return muestra(banco, reales).map((pregunta) => ({
    ...pregunta,
    opciones: barajar(pregunta.opciones),
  }));
}

export function validarRespuesta(pregunta: Pregunta, respuesta: string): boolean {
  return respuesta === pregunta.correcta;
}

/* ============ COMPLETAR ============ */

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function cantidadRondas(nivel: Nivel, clave: "completar" | "ordenar"): number {
  return parametrosNivel(nivel)[clave];
}

export interface PreguntaHueco {
  palabra: string;
  posicion: number;
  opciones: string[];
  correcta: string;
}

export function crearPregunta(nivel: Nivel): PreguntaHueco {
  const palabras = palabrasJugables(nivel);
  const palabraInfo = palabras[Math.floor(Math.random() * palabras.length)];
  const palabra = palabraInfo.ingles.toUpperCase();
  const permiteInicial = parametrosNivel(nivel).huecoInicialPermitido;
  /* B1 no oculta la primera letra: hueco más difícil (igual que Python). */
  const minimo = (!permiteInicial && palabra.length > 1) ? 1 : 0;
  const posicion = minimo + Math.floor(Math.random() * (palabra.length - minimo));
  const letraCorrecta = palabra.charAt(posicion);

  const opciones = [letraCorrecta];
  while (opciones.length < 3) {
    const letra = LETRAS.charAt(Math.floor(Math.random() * LETRAS.length));
    if (!opciones.includes(letra)) opciones.push(letra);
  }
  return { palabra, posicion, opciones: barajar(opciones), correcta: letraCorrecta };
}

/* "APPLE" con hueco en 3 → ['A','P','P','_','E'] */
export function letrasConHueco(palabra: string, posicion: number): string[] {
  return palabra.split("").map((letra, indice) => indice === posicion ? "_" : letra);
}

/* ============ ORDENAR ============ */

export interface PalabraDesordenada { original: string; desordenada: string; }

export function crearPalabra(nivel: Nivel): PalabraDesordenada {
  const palabras = palabrasJugables(nivel);
  const palabraInfo = palabras[Math.floor(Math.random() * palabras.length)];
  const original = palabraInfo.ingles.toUpperCase();

  let desordenada = original;
  while (desordenada === original) {
    desordenada = barajar(original.split("")).join("");
  }
  return { original, desordenada };
}

export function validarPalabra(intento: string, original: string): boolean {
  return String(intento).trim().toUpperCase() === original.toUpperCase();
}

/* ============ MEMORIA ============ */

export function cantidadParejas(nivel: Nivel): number {
  return parametrosNivel(nivel).memoriaParejas;
}

export function esperaFlipMs(nivel: Nivel): number {
  return parametrosNivel(nivel).esperaFlipMs;
}

export type TipoCarta = "palabra" | "imagen";
export interface Tarjeta {
  par: number;
  tipo: TipoCarta;
  texto: string | null;
  imagen: string | null;
  visible: boolean;
}

export function crearTablero(nivel: Nivel): Tarjeta[] {
  const banco = parejasDelNivel(nivel);
  const cuantas = Math.min(cantidadParejas(nivel), banco.length);
  const elegidas = muestra(banco, cuantas);
  const tarjetas: Tarjeta[] = [];
  elegidas.forEach((pareja: Pareja, numeroPareja: number) => {
    tarjetas.push({ par: numeroPareja, tipo: "palabra", texto: pareja.ingles, imagen: null, visible: false });
    tarjetas.push({ par: numeroPareja, tipo: "imagen", texto: null, imagen: pareja.imagen, visible: false });
  });
  return barajar(tarjetas);
}

export function sonPareja(a: Tarjeta, b: Tarjeta): boolean {
  return a.par === b.par;
}
