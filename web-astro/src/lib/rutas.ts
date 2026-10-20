/* Rutas: espejo de utilidades/rutas.py.
   En el paquete Python el problema es ¿dónde están mis recursos cuando
   PyInstaller congela todo?; en Astro el problema es el base path de
   GitHub Pages: /penguin-english-adventure/. Toda URL interna pasa por
   aquí y funciona igual en dev, en build y en Pages. */

export function ruta(parte: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : import.meta.env.BASE_URL + "/";
  return base + parte.replace(/^\//, "");
}

export const RUTA_PIPO = ruta("pinguino_128.png");
export const RUTA_SONIDO = (clave: string) => ruta(`sonidos/${clave}.wav`);
