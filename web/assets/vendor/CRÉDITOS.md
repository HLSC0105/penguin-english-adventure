# Créditos de los componentes autoalojados (assets/vendor/)

Copias locales de las dependencias de presentación — el juego funciona
sin internet y por file:// gracias a estos archivos.

| Archivo | Proyecto | Licencia | Fuente |
|---|---|---|---|
| `bootstrap.min.css` | Bootstrap 5.3.8 | MIT | <https://getbootstrap.com> |
| `bootstrap-icons.min.css` + `fonts/bootstrap-icons.woff(2)` | Bootstrap Icons 1.13.2 | MIT | <https://icons.getbootstrap.com> |
| `fredoka.css` + `fonts/fredoka-*.woff2` | Fredoka | SIL Open Font License (OFL) | <https://fonts.google.com/specimen/Fredoka> |

Regeneración: `scripts/web_exportar.py` no toca esta carpeta; si sube
la versión de Bootstrap/Icons/Fredoka, descargar los equivalentes de
los mismos URLs de CDN y conservar estos nombres.
