#!/usr/bin/env bash
# Genera dist/PenguinEnglish-windows.zip en esta máquina (Docker + Wine).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null; then
    echo "Hace falta Docker para generar el .exe de Windows." >&2
    exit 1
fi

echo "Construyendo la imagen Wine + Python Windows..."
docker build -f scripts/Dockerfile.windows-exe -t pea-windows-exe .

echo "Empaquetando PenguinEnglish.exe..."
docker run --rm \
    -e WINEDEBUG=-all \
    -v "$ROOT:/src" \
    -w /src \
    pea-windows-exe

if [[ ! -f dist/PenguinEnglish/PenguinEnglish.exe ]]; then
    echo "No se generó dist/PenguinEnglish/PenguinEnglish.exe" >&2
    exit 1
fi

echo "Comprimiendo dist/PenguinEnglish-windows.zip..."
docker run --rm \
    -v "$ROOT:/src" \
    --user 0 \
    --entrypoint /bin/chmod \
    pea-windows-exe \
    -R a+rwX /src/dist /src/build
python3 "$ROOT/scripts/zip_windows.py"

echo "Listo para enviar: $ROOT/dist/PenguinEnglish-windows.zip"
echo "En Windows: descomprimir y abrir PenguinEnglish/PenguinEnglish.exe"
