# Buldhana Police Bandobast — Product Requirements

## 1. Problem Statement
Build a secure administrative dashboard to digitize the deployment of police
personnel (Officers, Amaldars, Home Guards) for specific events
("Bandobasts"), with a 5-step New Bandobast Wizard and Reports (Goshwara,
Duty Pass, ID Cards with QR).

### Requirements
- Bilingual Interface (Marathi + English).
- No authentication required for MVP (dummy `admin`/`admin` login).
- Fully offline standalone **Android APK** + Windows Desktop editions in
  addition to the web app.

---

## 2. Editions

### 2.1 Web edition (production-ready)
- **Stack:** React + FastAPI + MongoDB.
- **Status:** ✅ Complete, tested, 89 staff in production DB.

### 2.2 Android edition ⭐ NEW (this session, Apr 2026)
- **Stack:** React + Capacitor (WebView) + IndexedDB (Dexie).
- **No server. No internet. No MongoDB.** All 40+ API endpoints are
  re-implemented client-side in `frontend/src/lib/local-api.js`.
- **Build pipeline:** GitHub Actions workflow `.github/workflows/build-android.yml`
  runs on every push, produces a downloadable `.apk` in ~8–12 min.
- **Status:** ✅ Local API shim fully validated (13/13 e2e flows pass against
  fake-indexeddb). Capacitor Android project generated. Workflow ready.
  **Pending:** user pushes the commits to GitHub so Actions can build.

### 2.3 Desktop edition (Windows) — DISCONTINUED
- Attempted Electron + PyInstaller build. User ran into recurring runtime
  issues (zombie mongod processes) and chose Android instead.
- Windows workflow and code removed from this branch for clarity.

---

## 3. Files of reference
| Area                       | Path                                              |
| -------------------------- | ------------------------------------------------- |
| Web backend                | `/app/backend/server.py`                          |
| Web frontend (unchanged)   | `/app/frontend/src/**`                            |
| **Local DB schema**        | `/app/frontend/src/lib/local-db.js`               |
| **Local API shim**         | `/app/frontend/src/lib/local-api.js`              |
| **Mode-aware api wrapper** | `/app/frontend/src/lib/api.js`                    |
| **Shared QR component**    | `/app/frontend/src/components/PointQR.jsx`        |
| Capacitor config           | `/app/frontend/capacitor.config.json`             |
| Android native project     | `/app/frontend/android/`                          |
| APK build workflow         | `/app/.github/workflows/build-android.yml`        |
| Android user guide         | `/app/frontend/ANDROID_BUILD.md`                  |
| Windows build workflow     | `/app/.github/workflows/build-windows.yml`        |
| Desktop code               | `/app/desktop/**`                                 |

## 4. How to get the APK (end-user)
1. Click "Save to GitHub" in the Emergent chat.
2. On GitHub → Actions tab → wait for `Build Android APK` to turn green.
3. Download `BuldhanaBandobast-Android` artifact (ZIP with `.apk`).
4. Install on phone → launch. Data lives in the app's IndexedDB.

## 5. Test credentials
See `/app/memory/test_credentials.md`. Same for all editions: `admin/admin`.

## 6. Backlog
- Sign APK with a release keystore for Play Store distribution.
- Add "Export .bandobast file" feature to move events between phones via USB.
- Role-based auth if ever deployed centrally online.
