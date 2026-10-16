"""Crea dist/PenguinEnglish-windows.zip (se ejecuta dentro de Wine o del host)."""

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESTINO = ROOT / "dist" / "PenguinEnglish-windows"
ORIGEN = ROOT / "dist" / "PenguinEnglish"

if not (ORIGEN / "PenguinEnglish.exe").is_file():
    raise SystemExit(f"No está {ORIGEN / 'PenguinEnglish.exe'}")

zip_path = Path(shutil.make_archive(str(DESTINO), "zip", str(ORIGEN.parent), ORIGEN.name))
print(zip_path, zip_path.stat().st_size)
