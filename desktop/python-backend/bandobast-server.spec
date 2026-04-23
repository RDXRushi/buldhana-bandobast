# -*- mode: python ; coding: utf-8 -*-
#
# PyInstaller spec for the Buldhana Bandobast desktop backend.
# Produces a single-file Windows executable: dist/bandobast-server.exe
#
# Build: pyinstaller bandobast-server.spec --clean --noconfirm

from PyInstaller.utils.hooks import collect_submodules, collect_data_files
from pathlib import Path

block_cipher = None

here = Path(SPECPATH)
backend_src = (here.parent.parent / "backend" / "server.py").resolve()
renderer_dir = (here.parent / "renderer").resolve()

hidden = []
hidden += collect_submodules("pymongo")
hidden += collect_submodules("motor")
hidden += collect_submodules("openpyxl")
hidden += collect_submodules("qrcode")
hidden += collect_submodules("uvicorn")
hidden += collect_submodules("uvicorn.loops")
hidden += collect_submodules("uvicorn.protocols")
hidden += collect_submodules("uvicorn.lifespan")
hidden += [
    "uvicorn.logging",
    "uvicorn._subprocess",
    "email.mime.multipart",
    "email.mime.text",
]

datas = []
# Bundle server.py at the root of _MEIPASS so `from server import app` works
datas.append((str(backend_src), "."))
# Bundle the React build under renderer/
if renderer_dir.exists():
    datas.append((str(renderer_dir), "renderer"))
# Bundle qrcode static assets (images/fonts) if any
datas += collect_data_files("qrcode")
datas += collect_data_files("openpyxl")

a = Analysis(
    ["launcher.py"],
    pathex=[str(here), str(here.parent.parent / "backend")],
    binaries=[],
    datas=datas,
    hiddenimports=hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        "tkinter",
        "matplotlib",
        "PyQt5",
        "PyQt6",
        "PySide2",
        "PySide6",
        "notebook",
        "IPython",
    ],
    noarchive=False,
    optimize=0,
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="bandobast-server",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,     # no console window on Windows
    icon=None,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
