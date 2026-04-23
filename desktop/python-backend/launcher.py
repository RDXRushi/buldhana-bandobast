"""
Buldhana Bandobast — Desktop Launcher
Entry point for the PyInstaller-bundled FastAPI backend.

Responsibilities:
  1. Set environment variables for the desktop (offline) runtime BEFORE importing
     server.py (MONGO_URL points to the bundled local mongod).
  2. Import the existing FastAPI `app` from backend/server.py (single source of truth).
  3. Mount the React build as static files so the same port serves both API and UI.
  4. Run uvicorn on 127.0.0.1 with a configurable port.
"""

import os
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

def _frozen_base() -> Path:
    """Return the directory that contains bundled data files."""
    if getattr(sys, "frozen", False):
        # PyInstaller onefile: _MEIPASS is a temp dir with bundled data
        return Path(sys._MEIPASS)  # type: ignore[attr-defined]
    return Path(__file__).resolve().parent


def _exe_dir() -> Path:
    """Return the directory of the running executable (where config lives)."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


BASE = _frozen_base()
EXE_DIR = _exe_dir()


# ---------------------------------------------------------------------------
# Environment setup (MUST run before importing server.py)
# ---------------------------------------------------------------------------

# Defaults for the desktop edition. Electron may override these via env.
os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27777")
os.environ.setdefault("DB_NAME", "buldhana_bandobast")
os.environ.setdefault("CORS_ORIGINS", "*")

# Ensure server.py can be imported. In dev we point to /app/backend;
# in frozen mode PyInstaller bundles server.py next to launcher.py.
if getattr(sys, "frozen", False):
    sys.path.insert(0, str(BASE))
else:
    dev_backend = Path(__file__).resolve().parent.parent.parent / "backend"
    if dev_backend.exists():
        sys.path.insert(0, str(dev_backend))


# ---------------------------------------------------------------------------
# Import FastAPI app
# ---------------------------------------------------------------------------

from server import app as fastapi_app  # noqa: E402
from fastapi import HTTPException  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402


# ---------------------------------------------------------------------------
# Health check endpoint (registered BEFORE the SPA catch-all)
# ---------------------------------------------------------------------------

@fastapi_app.get("/_desktop/health")
async def _desktop_health():
    return {"ok": True, "version": "1.0.0", "mode": "desktop"}


# ---------------------------------------------------------------------------
# Serve React build (same origin as the API)
# ---------------------------------------------------------------------------

RENDERER_DIR = BASE / "renderer"
# During dev, fall back to /app/desktop/renderer
if not RENDERER_DIR.exists():
    alt = Path(__file__).resolve().parent.parent / "renderer"
    if alt.exists():
        RENDERER_DIR = alt

if RENDERER_DIR.exists():
    static_sub = RENDERER_DIR / "static"
    if static_sub.exists():
        fastapi_app.mount(
            "/static",
            StaticFiles(directory=str(static_sub)),
            name="static",
        )

    @fastapi_app.get("/")
    async def _desktop_root():
        index = RENDERER_DIR / "index.html"
        if index.is_file():
            return FileResponse(str(index))
        raise HTTPException(status_code=404, detail="UI not bundled")

    # SPA fallback: serve static assets or index.html. Registered AFTER the
    # api_router (which was included inside server.py), so /api/* still wins.
    @fastapi_app.get("/{full_path:path}")
    async def _desktop_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="Not Found")
        target = RENDERER_DIR / full_path
        if target.is_file():
            return FileResponse(str(target))
        index = RENDERER_DIR / "index.html"
        if index.is_file():
            return FileResponse(str(index))
        raise HTTPException(status_code=404, detail="Not Found")


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

def main():
    import uvicorn
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "38017"))
    uvicorn.run(fastapi_app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
