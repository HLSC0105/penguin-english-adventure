/* Sonidos con WAV locales — espejo de utilidades/sonidos.py + el pool
   de 3 nodos por efecto que corrigió «los sonidos se dejan de oír»:
   un efecto que aún suena no se interrumpe y el nodo envenenado se
   reconstruye. Si el navegador bloquea la reproducción, el HUD muestra
   «Sin sonido» y el juego sigue. */
import { RUTA_SONIDO } from "./rutas";

const ARCHIVOS = ["clic", "correcto", "error", "ganar"] as const;
type Clave = (typeof ARCHIVOS)[number];
const NODOS_POR_SONIDO = 3;

let volumen = 0.5;
let disponible = true;
let negociado = false;
let notificadorSinSonido: (() => void) | null = null;
const pools: Record<Clave, { nodos: HTMLAudioElement[]; sig: number }> = {} as never;

function crearNodo(clave: Clave): HTMLAudioElement {
  const audio = new Audio(RUTA_SONIDO(clave));
  audio.volume = volumen;
  audio.preload = "auto";
  audio.addEventListener("error", marcarSinSonido, true);
  return audio;
}

function prepararPool(clave: Clave): { nodos: HTMLAudioElement[]; sig: number } {
  if (!pools[clave]) pools[clave] = { nodos: [], sig: 0 };
  const pool = pools[clave];
  while (pool.nodos.length < NODOS_POR_SONIDO) pool.nodos.push(crearNodo(clave));
  for (let i = 0; i < pool.nodos.length; i += 1) {
    const nodo = pool.nodos[i];
    if (nodo.error || (nodo.readyState === 0 && nodo.networkState === HTMLMediaElement.NETWORK_EMPTY)) {
      pool.nodos[i] = crearNodo(clave);
    }
  }
  return pool;
}

function marcarSinSonido(): void {
  disponible = false;
  if (notificadorSinSonido) notificadorSinSonido();
}

export function audioDisponible(): boolean {
  return negociado ? disponible : true;   /* optimista como el escritorio */
}

function nodoLibre(pool: { nodos: HTMLAudioElement[]; sig: number }): HTMLAudioElement {
  for (let i = 0; i < pool.nodos.length; i += 1) {
    const candidato = pool.nodos[pool.sig % pool.nodos.length];
    pool.sig += 1;
    if (candidato.paused || candidato.currentTime === 0) return candidato;
  }
  return pool.nodos[pool.nodos.length - 1];
}

export function reproducir(clave: Clave): void {
  if (!disponible) return;
  const pool = prepararPool(clave);
  const audio = nodoLibre(pool);
  if (!audio) return;
  try { audio.currentTime = 0; } catch { /* aún decodificando */ }
  audio.volume = volumen;
  negociado = true;
  const promesa = audio.play();
  if (promesa?.catch) {
    promesa.catch(() => fallaReproducir(clave, audio));
  }
}

function fallaReproducir(clave: Clave, audio: HTMLAudioElement): void {
  if (!disponible) return;
  const pool = pools[clave];
  if (pool) {
    const posicion = pool.nodos.indexOf(audio);
    if (posicion !== -1) pool.nodos[posicion] = crearNodo(clave);
  }
  const reintento = new Audio(RUTA_SONIDO(clave));
  reintento.volume = volumen;
  negociado = true;
  reintento.play().catch(() => marcarSinSonido());
}

export function precargar(): void {
  ARCHIVOS.forEach((clave) => prepararPool(clave));
}

export function establecerVolumen(valor: number): void {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return;
  volumen = Math.max(0, Math.min(1, numero));
  for (const clave of ARCHIVOS) {
    (pools[clave]?.nodos ?? []).forEach((audio) => { audio.volume = volumen; });
  }
}

export function leerVolumen(): number {
  return volumen;
}

export function alCambiarSinSonido(notificador: () => void): void {
  notificadorSinSonido = notificador;
}

export const audio = { reproducir, precargar, audioDisponible, establecerVolumen, leerVolumen, alCambiarSinSonido };
