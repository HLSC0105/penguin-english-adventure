# Atribuciones de los recursos utilizados

## Imágenes (pingüino, animales, frutas, familia, cuerpo, objetos y profesiones)

Las imágenes de la carpeta `recursos/imagenes/` pertenecen al proyecto **OpenMoji**:

- Proyecto: OpenMoji — https://openmoji.org/
- Repositorio: https://github.com/hfg-gmuend/openmoji
- Licencia: **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**
  - https://creativecommons.org/licenses/by-sa/4.0/
- Diseñadas por: OpenMoji (equipo del proyecto OpenMoji)

### ¿Qué significa la licencia CC BY-SA 4.0?

- **BY (Atribución):** hay que dar crédito a los autores, como estamos haciendo en este archivo.
- **SA (ShareAlike):** si alguien usa o modifica estas imágenes, debe compartir su trabajo con la misma licencia.
- Para un proyecto académico, usarlas con atribución es completamente válido.

### Uso en este proyecto

- Las imágenes se descargaron en formato PNG (72×72 píxeles, y una versión de 618×618 píxeles para el pingüino Pipo).
- Se guardan localmente en `recursos/imagenes/`, por lo que el juego **no necesita internet** para mostrarlas.
- Los nombres de los archivos son los códigos Unicode de cada emoji (por ejemplo, `1F415.png` es el perro 🐕).
- Para añadir más glifos: `python scripts/descargar_openmoji.py 1F422` (requiere red).

## Sonidos

Los efectos de sonido del juego (clic, correcto, error y ganar) son
**generados por el propio proyecto**, por lo que no tienen licencia externa:

- Se crean con el script `scripts/generar_sonidos.py`, que produce tonos
  seno sencillos con la librería estándar de Python (sin dependencias).
- Se guardan como WAV en `recursos/sonidos/` (clic.wav, correcto.wav,
  error.wav, ganar.wav).
- Se reproducen con **pygame.mixer**, un motor de audio portable que
  funciona en Windows, Linux y macOS. En Windows, si pygame no está
  disponible, hay un respaldo con `winsound.Beep`.
- Si necesitas regenerarlos o cambiarlos, ejecuta:

  ```bash
  python scripts/generar_sonidos.py
  ```