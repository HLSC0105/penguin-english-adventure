/* Pantalla para aprender vocabulario: categorías y palabras paginadas.
   Espejo de interfaz/vocabulario.py: estudio, no examen (no suma
   puntos). Las categorías salen de niveles.categoriasDelNivel (filtro
   acumulativo) y van con su conteo; 4 tarjetas por página con la
   navegación Anterior/Siguiente reservada al centro. */
window.PEA = window.PEA || {};

PEA.pantallas = PEA.pantallas || {};
PEA.pantallas.vocabulario = (function () {
  "use strict";

  const PALABRAS_POR_PAGINA = PEA_DATOS.constantes.palabrasPorPagina;   /* 4 */

  function mostrarVocabulario(padre, argumentos) {
    const categoria = (argumentos && argumentos.length) ? argumentos[0] : null;
    const pagina = (argumentos && argumentos.length > 1) ? argumentos[1] : 0;
    const irAlMenu = function () {
      PEA.ui.navegar(PEA.pantallas.menu.mostrarMenu);
    };

    PEA.ui.encabezadoActivar(PEA.estado.leerNombre(), irAlMenu);
    padre.append(PEA.ui.titulo("Aprender vocabulario"));

    if (categoria === null) {
      mostrarCategorias(padre);
    } else {
      mostrarPalabras(padre, categoria, pagina);
    }
  }

  /* Botones "Nombre (n)", dos por fila como el grid de Tk. */
  function mostrarCategorias(padre) {
    const categorias = PEA.niveles.categoriasDelNivel(PEA.estado.leerNivel());
    const gripa = PEA.ui.h("div", "seccion");
    const fila = PEA.ui.h("div", "row g-3 mx-auto",
      { style: "max-width:640px;" });

    Object.keys(categorias).forEach(function (nombre) {
      const col = PEA.ui.h("div", "col-6");
      const boton = PEA.ui.h("button", "btn btn-categoria", {
        type: "button",
        "aria-label": "Categoría " + nombre + " con " +
          categorias[nombre].length + " palabras",
        onclick: function () {
          PEA.sonidos.reproducir("clic");
          PEA.ui.navegar(mostrarVocabulario, nombre, 0);
        },
      });
      boton.append(
        document.createTextNode(nombre),
        PEA.ui.texto(PEA.ui.h("span", "conteo fuente-num"),
          "(" + categorias[nombre].length + ")")
      );
      col.append(boton);
      fila.append(col);
    });

    gripa.append(fila);
    padre.append(gripa);
  }

  /* Cuadrícula de tarjetas con imagen, palabra, traducción, nivel y
     ejemplo. El total de páginas es ceil(n / 4) → (n + 3) // 4. */
  function mostrarPalabras(padre, categoria, pagina) {
    const categorias = PEA.niveles.categoriasDelNivel(PEA.estado.leerNivel());
    const palabras = categorias[categoria] || [];
    const totalPaginas = Math.max(
      1, Math.ceil(palabras.length / PALABRAS_POR_PAGINA));
    if (pagina >= totalPaginas) pagina = totalPaginas - 1;

    const bloque = PEA.ui.h("div", "seccion");
    bloque.append(PEA.ui.texto(
      PEA.ui.h("p", "texto-acento fs-5 fw-semibold text-center mb-2"),
      "Categoría: " + categoria));

    /* --- navegación centrada: ◀ Anterior | Página N de M | Siguiente ▶ --- */
    const nav = PEA.ui.h(
      "div", "d-flex justify-content-center align-items-center gap-3 mb-3");
    if (pagina > 0) {
      const anterior = PEA.ui.h("button", "btn btn-pea-ghost", {
        type: "button",
        "aria-label": "Página anterior",
        onclick: function () {
          PEA.sonidos.reproducir("clic");
          PEA.ui.navegar(mostrarVocabulario, categoria, pagina - 1);
        },
      });
      anterior.append(document.createTextNode("\u25C0 Anterior"));
      nav.append(anterior);
    }
    nav.append(PEA.ui.texto(
      PEA.ui.h("span", "texto-secundario fuente-num"),
      "Página " + (pagina + 1) + " de " + totalPaginas));
    if (pagina < totalPaginas - 1) {
      const siguiente = PEA.ui.h("button", "btn btn-pea-ghost", {
        type: "button",
        "aria-label": "Página siguiente",
        onclick: function () {
          PEA.sonidos.reproducir("clic");
          PEA.ui.navegar(mostrarVocabulario, categoria, pagina + 1);
        },
      });
      siguiente.append(document.createTextNode("Siguiente \u25B6"));
      nav.append(siguiente);
    }
    bloque.append(nav);

    /* --- tarjetas, dos por fila como en el escritorio --- */
    const filasTarjetas = PEA.ui.h("div", "row g-3 mx-auto",
      { style: "max-width:760px;" });
    const inicio = pagina * PALABRAS_POR_PAGINA;
    palabras.slice(inicio, inicio + PALABRAS_POR_PAGINA).forEach(function (palabra) {
      const col = PEA.ui.h("div", "col-12 col-md-6");
      col.append(tarjetaPalabra(palabra));
      filasTarjetas.append(col);
    });
    bloque.append(filasTarjetas);

    /* "Volver al listado" solo en la última página (paridad de Tk). */
    if (pagina >= totalPaginas - 1) {
      const pie = PEA.ui.h("div", "d-flex justify-content-center mt-3");
      const botonPie = PEA.ui.h("button", "btn btn-pea-ghost", {
        type: "button",
        "aria-label": "Volver al listado de categorías",
        onclick: function () {
          PEA.sonidos.reproducir("clic");
          PEA.ui.navegar(mostrarVocabulario, null, 0);
        },
      });
      botonPie.append(document.createTextNode("Volver al listado"));
      pie.append(botonPie);
      bloque.append(pie);
    }

    padre.append(bloque);
  }

  /* Ficha de palabra: imagen OpenMoji (o círculo con la inicial) +
     inglés + español + nivel CEFR + ejemplo. */
  function tarjetaPalabra(palabra) {
    const ficha = PEA.ui.h("div", "pea-tarjeta ficha-palabra");
    ficha.append(PEA.ui.imagenPalabra("", {
      src: palabra.imagen ? "assets/img/" + palabra.imagen : null,
      alt: "",
      "data-inicial": palabra.ingles.charAt(0),
      loading: "lazy",
    }));
    ficha.append(
      PEA.ui.texto(PEA.ui.h("div", "palabra-ingles"), palabra.ingles),
      PEA.ui.texto(PEA.ui.h("div", "palabra-espanol"), palabra.espanol),
      PEA.ui.texto(PEA.ui.h("span", "pea-mini mb-1"), palabra.nivel),
      PEA.ui.texto(PEA.ui.h("div", "palabra-ejemplo"),
        "\u201C" + palabra.ejemplo + "\u201D")
    );
    return ficha;
  }

  return { mostrarVocabulario: mostrarVocabulario };
})();
