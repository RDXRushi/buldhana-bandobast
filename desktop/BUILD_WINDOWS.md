# Build the Offline Windows App — Step-by-Step Guide

This produces a **fully offline Windows installer + portable `.exe`** that bundles:

- The full FastAPI Python backend (compiled to `bandobast-server.exe` via PyInstaller)
- A portable local MongoDB 7.x (`mongod.exe`) — no install required
- The React UI (served from the same port as the API)
- Electron as the desktop shell

After installation the end user just double-clicks the app. No Python, Node, or
MongoDB needs to be installed on their machine.

---

## 1. One-time build-machine setup (Windows 10/11, 64-bit)

Install these on **any Windows machine** you will use to produce the build
(you can use your own laptop, a company laptop, or a GitHub Actions Windows
runner):

| Tool                 | Version       | Link                                            |
| -------------------- | ------------- | ----------------------------------------------- |
| Python               | 3.11 (64-bit) | https://www.python.org/downloads/               |
| Node.js              | 20 LTS        | https://nodejs.org/                             |
| Yarn                 | latest        | `npm install -g yarn`                           |
| Git                  | latest        | https://git-scm.com/                            |
| Windows PowerShell   | 5.1+ (default) | already installed                              |

> ⚠️ During the Python installer, **tick “Add Python to PATH”**.

---

## 2. Get the source code

```powershell
# Clone / copy the repo to your Windows machine, e.g. C:\bandobast
# (or use "Save to Github" from the Emergent app chat and pull from there)
cd C:\bandobast\app\desktop
```

---

## 3. Run the one-shot build script

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\build-windows.ps1
```

What it does (takes ~5-10 min on first run):

1. Downloads MongoDB 7.0 Community (portable) and extracts `mongod.exe` + deps
   into `desktop\resources\mongodb\bin\`.
2. Builds the React frontend with a **relative** backend URL (so the same port
   serves both UI and API) and copies `frontend\build\` → `desktop\renderer\`.
3. Creates a Python venv, installs deps, and runs
   `pyinstaller bandobast-server.spec` to produce `bandobast-server.exe`.
   That file is then copied into `desktop\resources\server\`.
4. Runs `yarn dist` (electron-builder) which packages everything into an NSIS
   installer + portable `.exe`.

### Output

```
desktop\dist\
 ├─ BuldhanaBandobast-Setup-1.0.0.exe       ← installer (~280 MB)
 └─ BuldhanaBandobast-Portable-1.0.0.exe    ← portable single-file (~280 MB)
```

Both are fully offline. Ship either one to the end user.

---

## 4. Test the build on the same machine

Just double-click `BuldhanaBandobast-Portable-1.0.0.exe`. Windows may show
“Windows protected your PC” → click **More info → Run anyway** (normal for
unsigned apps — you can add Authenticode signing later).

The Electron window opens. Behind the scenes:

1. A local `mongod.exe` spawns on a free port (starts at 27777), storing data
   in `%APPDATA%\Buldhana Police Bandobast\mongo-data\`.
2. `bandobast-server.exe` spawns on a free port (starts at 38017) and
   connects to that local MongoDB.
3. Electron waits for `/_desktop/health` to return 200, then loads the UI.

Logs are written to `%APPDATA%\Buldhana Police Bandobast\logs\`.

---

## 5. Common build issues

| Problem                                              | Fix                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pyinstaller: not found`                             | Activate venv first, or reinstall with `pip install -r python-backend\requirements.txt` |
| `mongod.exe is not recognized…`                      | Re-run `build-windows.ps1` — the download step extracts it fresh                      |
| Installer size > 400 MB                              | Remove the non-server `.exe` files from `resources\mongodb\bin\` (keep only `mongod.exe`, `libcrypto-*.dll`, `libssl-*.dll`) |
| Antivirus flags the portable `.exe`                  | Code-sign with an Authenticode certificate (EV preferred) and submit to vendor        |

---

## 6. Updating

When you release a new version:

1. Bump `"version"` in `desktop\package.json`.
2. Re-run `.\build-windows.ps1`.
3. Ship the new installer. The end-user's MongoDB data in `%APPDATA%` is
   preserved — they only need to install on top.

---

## 7. Where is user data stored?

```
%APPDATA%\Buldhana Police Bandobast\
 ├─ mongo-data\      ← full MongoDB database (bandobasts, staff, allotments)
 └─ logs\
     ├─ mongod.log
     └─ backend.log
```

To move data between machines, copy the whole `mongo-data\` folder while the
app is closed.
