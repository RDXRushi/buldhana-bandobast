# Buldhana Police Bandobast — Windows Desktop (Offline, Standalone)

A fully offline, self-contained Windows desktop application of the Digital
Police Bandobast Management System. No internet. No server. No separate
database install. Everything the web version does — available on a single
laptop.

---

## Quick start (for the end user)

### Option A — Installer (recommended)
1. Double-click **`BuldhanaBandobast-Setup-1.0.0.exe`**.
2. Choose an install location (or accept the default).
3. The installer creates a desktop shortcut and Start-menu entry.
4. Launch **“Buldhana Bandobast”** → the app opens in ~5 seconds.

### Option B — Portable (no install)
1. Double-click **`BuldhanaBandobast-Portable-1.0.0.exe`**.
2. Windows may show **“Windows protected your PC”** → click
   **More info → Run anyway** (normal for unsigned apps).
3. The app window opens.

Default demo login: **`admin` / `admin`**

---

## System requirements
- Windows 10 or 11 (64-bit)
- ~500 MB free disk space
- 4 GB RAM recommended

---

## Where is your data stored?
```
C:\Users\<YourName>\AppData\Roaming\Buldhana Police Bandobast\
 ├─ mongo-data\   ← your entire database (bandobasts, staff, photos, etc.)
 └─ logs\         ← diagnostic logs
```
Use **File → Open Data Folder** inside the app to open this location.

### Backup / transfer to another PC
1. Close the app.
2. Copy the entire `mongo-data\` folder to the other PC (same path).
3. Launch the app on the new PC — all your data appears.

---

## Features (all work offline)
- Dashboard with calendar & bandobast list
- Staff Management (Officer / Amaldar / Home Guard) with Excel import & templates
- 5-Step Bandobast Wizard (Create → Points → Select → Allot → Deploy)
- Out-of-District staff (scoped per bandobast) + Excel import
- Equipment assignment (per staff, per point)
- QR codes containing full point briefing + Google Maps URL
  *(scanning works offline; opening the map link requires phone internet)*
- Print ID Cards, Duty Passes, Goshwara (bulk + individual)
- Excel roster export
- Soft-delete + Restore + Permanent delete

---

## Troubleshooting

**The app window is blank / never opens.**
Check `%APPDATA%\Buldhana Police Bandobast\logs\backend.log` and
`mongod.log`. Most common cause: another program is using port 27777 or
38017 — the app auto-retries higher ports, but a zealous antivirus may
block `mongod.exe`. Whitelist the install folder.

**"Startup Failed: Bundled MongoDB binary not found"**
The build was produced without running `build-windows.ps1`. Re-build
following `BUILD_WINDOWS.md`.

---

## For developers

See [`BUILD_WINDOWS.md`](./BUILD_WINDOWS.md) for the complete build pipeline
(PyInstaller + portable MongoDB + Electron + electron-builder).

### Architecture
```
┌──────────────────────────────────────────────────────────────┐
│  Electron window  (Chromium)                                 │
│       │                                                      │
│       └── loads  http://127.0.0.1:<serverPort>/              │
│                                                              │
│           └── bandobast-server.exe   (PyInstaller bundle)    │
│                 ├── FastAPI + uvicorn                        │
│                 ├── serves React build under /               │
│                 └── talks to mongodb://127.0.0.1:<mongoPort> │
│                                                              │
│           └── mongod.exe  (portable, data in %APPDATA%)      │
└──────────────────────────────────────────────────────────────┘
```
