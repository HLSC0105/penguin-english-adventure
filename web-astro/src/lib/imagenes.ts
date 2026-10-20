/* Optimización de OpenMoji en BUILD (la ventaja de astro:assets):
   cada PNG del paquete (src/assets/img/) sale como .webp con
   dimensiones fijas (84 px CSS @2x = 168 px) — cero layout shift y
   menos peso. El mapa nombre→URL optimizado se inyecta a las islands
   por un atributo data-* (el contenido queda en el HTML final).
   La caché por proceso evita re-optimizar por página: 233 imágenes,
   una sola vez por build. */
import { getImage } from "astro:assets";

const imagenes = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/img/*.png", { eager: true },
);

let cache: Record<string, string> | null = null;

export async function mapaDeImagenes(): Promise<Record<string, string>> {
  if (cache) return cache;
  const salida: Record<string, string> = {};
  await Promise.all(
    Object.entries(imagenes).map(async ([ruta, modulo]) => {
      const nombre = ruta.split("/").pop()!;
      try {
        const optimizada = await getImage({ src: modulo.default, width: 168 });
        salida[nombre] = optimizada.src;
      } catch {
        /* si una imagen falla, la UI pinta el círculo con la inicial */
      }
    }),
  );
  cache = salida;
  return salida;
}
