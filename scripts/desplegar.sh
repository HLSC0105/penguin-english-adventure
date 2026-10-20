#!/usr/bin/env bash
# Conmutador de despliegue de Penguin English Adventure.
#
# Publica en la rama huérfana `gh-pages` UNA de las dos versiones del
# juego (misma URL, contenido distinto):
#
#   scripts/desplegar.sh astro      ← la evolución (Astro 7 + Tailwind v4)
#   scripts/desplegar.sh vanilla    ← así empezó (SPA vanilla, offline file://)
#
# La rama gh-pages siempre contiene el SITIO servido por
# https://hlsc0105.github.io/penguin-english-adventure/
# Requiere gh autenticado (gh auth login) o un token de git en el helper.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-astro}"

case "$VERSION" in
  astro)
    cd "$RAIZ/web-astro"
    if command -v bun >/dev/null 2>&1; then
      bun run build
    else
      npm run build
    fi
    ORIGEN="$RAIZ/web-astro/dist"
    ;;
  vanilla)
    ORIGEN="$RAIZ/web"
    ;;
  *)
    echo "uso: desplegar.sh [astro|vanilla]" >&2
    exit 2
    ;;
esac

WORK="$(mktemp -d)"
cp -r "$ORIGEN"/. "$WORK"/
git init -q -b gh-pages "$WORK"
git -C "$WORK" add -A
git -C "$WORK" commit -q -m "Despliegue: versión $VERSION ($(date '+%Y-%m-%d %H:%M'))"
git -C "$WORK" push -qf "https://github.com/HLSC0105/penguin-english-adventure.git" gh-pages:gh-pages
rm -rf "$WORK"

echo "✅ Versión $VERSION desplegada en https://hlsc0105.github.io/penguin-english-adventure/"
