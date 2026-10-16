# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller: carpeta PenguinEnglish/ con .exe + _internal (onedir)."""

import sys
from pathlib import Path

from PyInstaller.utils.hooks import (
    collect_data_files, collect_dynamic_libs, collect_submodules)

ROOT = Path(SPECPATH).resolve()
sys.path.insert(0, str(ROOT / "src"))

datas = [(str(ROOT / "recursos"), "recursos")]
try:
    datas += collect_data_files("pygame")
except Exception:
    pass

binaries = []
try:
    binaries += collect_dynamic_libs("pygame")
except Exception:
    pass

a = Analysis(
    [str(ROOT / "scripts" / "lanzar.py")],
    pathex=[str(ROOT / "src")],
    binaries=binaries,
    datas=datas,
    hiddenimports=(
        ["pygame", "tkinter", "tkinter.ttk"]
        + collect_submodules("penguin_english")
    ),
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["coverage", "pip"],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="PenguinEnglish",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name="PenguinEnglish",
)
