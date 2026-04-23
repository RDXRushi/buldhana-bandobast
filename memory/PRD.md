# Buldhana Police Bandobast — Product Requirements

## 1. Problem Statement
Build a secure administrative dashboard to digitize the deployment of police
personnel (Officers, Amaldars, Home Guards) for specific events (“Bandobasts”),
with a 5-step New Bandobast Wizard (Create → Points → Select Staff → Allotment
→ Deploy), Staff Management, and Reports (Goshwara, Duty Pass, ID Cards with
QR).

### Requirements
- Bilingual Interface (Marathi + English).
- No authentication required for MVP (dummy `admin`/`admin` login).
- **Fully offline standalone Windows desktop application (`.exe`)** in addition
  to the web edition.

---

## 2. Editions

### 2.1 Web edition (production ready)
- **Stack:** React + FastAPI + MongoDB.
- **Status:** ✅ Complete, tested, deployed.

### 2.2 Desktop edition (offline Windows)
- **Shell:** Electron.
- **Backend:** Identical FastAPI `server.py`, bundled to `bandobast-server.exe`
  via PyInstaller. Single source of truth with the web backend.
- **Database:** Portable MongoDB 7.x (`mongod.exe`) bundled inside the app,
  data stored in `%APPDATA%\Buldhana Police Bandobast\mongo-data\`.
- **UI:** Same React build served at the same port as the API (relative URLs).
- **Status:** ✅ Architecture wired, launcher validated end-to-end on Linux
  (PyInstaller bundle runs and passes API/UI/QR/Excel tests).
  **Pending:** Windows build run (requires a Windows machine to execute
  `build-windows.ps1`, produces the installer + portable `.exe`).

---

## 3. Implementation Timeline

### Completed (web)
- Staff Management CRUD + Excel import/templates
- 5-Step Bandobast Wizard
- Out-of-District staff (scoped per bandobast) with Excel import
- Equipment assignment per allotted staff per point
- QR code with full point briefing + Google Maps URL
- ID Cards + Duty Passes (bulk + individual)
- Goshwara + Amaldar-wise Excel export
- Soft-delete + Restore + Permanent-delete
- Login + 5-sec loading splash
- Bakkal No optional for Officers

### Completed (desktop — this session, Apr 2026)
- Replaced the incomplete Node.js `server.js` stub with a PyInstaller bundle
  of the existing FastAPI backend → zero logic duplication / drift.
- `python-backend/launcher.py` entry script that imports `server.py`, mounts
  React build as static, adds SPA fallback, exposes `/_desktop/health`.
- `python-backend/bandobast-server.spec` PyInstaller recipe (incl. hidden
  imports for `uvicorn`, `motor`, `pymongo`, `openpyxl`, `qrcode`).
- Electron `main.js` rewritten to spawn portable `mongod.exe` +
  `bandobast-server.exe` on free ports, wait for `/_desktop/health`, then
  load the window.
- `build-windows.ps1` one-shot build script: downloads portable MongoDB,
  builds React with relative URLs, runs PyInstaller, runs electron-builder.
- `BUILD_WINDOWS.md` + `README.md` user documentation.

### Verified on Linux build host
- Launcher + compiled PyInstaller binary both serve:
  - `/` (React UI)
  - `/static/*` (assets)
  - `/api/staff`, `/api/bandobasts/*`, `/api/bandobasts/:bid/points/:pid/qr`
    (valid PNG), `/api/staff-template/*` (valid XLSX), Goshwara
  - `/_desktop/health` (JSON)

---

## 4. Backlog / P1-P2
- Run `build-windows.ps1` on a Windows machine and publish the `.exe`.
- Authenticode code-signing (optional) to avoid SmartScreen warning.
- Multi-PC sync (cloud-optional — currently each PC is standalone).
- Role-based logins if the app is ever deployed centrally online.
- Trim MongoDB bundle to just `mongod.exe` + SSL DLLs to reduce installer size.

---

## 5. Key files
| Area              | Path                                                 |
| ----------------- | ---------------------------------------------------- |
| Web backend       | `/app/backend/server.py`                             |
| Web frontend      | `/app/frontend/src/**`                               |
| Desktop launcher  | `/app/desktop/python-backend/launcher.py`            |
| PyInstaller spec  | `/app/desktop/python-backend/bandobast-server.spec`  |
| Electron main     | `/app/desktop/main.js`                               |
| Windows build     | `/app/desktop/build-windows.ps1`                     |
| Build docs        | `/app/desktop/BUILD_WINDOWS.md`                      |
| User docs         | `/app/desktop/README.md`                             |

---

## 6. Test credentials
See `/app/memory/test_credentials.md`.
