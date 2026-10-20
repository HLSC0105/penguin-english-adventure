import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

/* La configuración es corta a propósito: Astro ya decide casi todo
   (salida estática, rutas de archivos, imágenes). Lo único que pedimos
   es el plugin de Tailwind v4 vía Vite y la conexión de las páginas
   con transiciones de vista (ClientRouter se usa en el Layout). */
export default defineConfig({
  site: "https://hlsc0105.github.io",
  base: "/penguin-english-adventure",
  vite: {
    plugins: [tailwindcss()],
  },
});
