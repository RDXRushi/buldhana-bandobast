# Buldhana Bandobast — Android APK (Offline Edition)

Fully offline Android app. No server. No internet. The whole bandobast
management system runs inside the phone's WebView with an IndexedDB-backed
database.

---

## Getting the APK (automatically built by GitHub Actions)

### One-time setup
1. Click **"Save to GitHub"** in the Emergent chat to push this repo.
2. Open the repo on GitHub → **Actions** tab.
3. Enable workflows if prompted.

### Every push builds a fresh APK
1. Push any commit to `main` (or click **Run workflow** manually).
2. Wait ~8–12 min for the `Build Android APK` workflow to turn green ✅.
3. Click into the run → scroll to **Artifacts** → download
   **`BuldhanaBandobast-Android`** — a ZIP containing `BuldhanaBandobast.apk`.
4. Transfer the `.apk` to your Android phone (USB, Drive, Telegram, etc.).
5. On the phone, open the file → **"Install anyway"** when Play Protect warns
   (unsigned debug builds always show this).

### One-click public download (optional)
After the first successful build, tag a release:
```bash
git tag v1.0.0 && git push origin v1.0.0
```
The workflow publishes a public GitHub Release at
`https://github.com/<you>/<repo>/releases/tag/v1.0.0` with the `.apk`
attached. Anyone can download directly — no GitHub login needed.

---

## System requirements
- Android 7.0 (Nougat / API 24) or newer
- ~50 MB storage
- No internet, no permissions requested

## Where is data stored?
Inside the app's private IndexedDB (Android sandbox). It survives app
restarts, reboots, and device-level data resets only remove it (or explicit
"Clear storage" from Android Settings → Apps → Buldhana Bandobast).

## Feature parity with the web app
Every feature works offline:
- Staff management (Officer / Amaldar / Home Guard) + Excel import/template
- Full 5-step Bandobast Wizard
- Out-of-District staff per bandobast
- Equipment assignment
- QR codes with full point briefing + Google Maps URL
- ID Cards, Duty Passes, Goshwara (view + print via phone's Print to PDF)
- Excel roster export
- Soft-delete + restore

## Limitations of the Android build
- **No multi-device sync.** Each phone is a standalone island. (Future: add
  "Export .bandobast file" for USB transfer.)
- **Printing** uses Android's native Print-to-PDF flow rather than a
  connected printer (tap Share → Print from any report page).
- **Unsigned debug build.** For Play Store distribution, sign with your own
  keystore (add a `release` signing config in `android/app/build.gradle`).

## How it works (technical)
```
┌───────────────────────────────────────────────────────┐
│  Android App (Capacitor WebView)                       │
│   └── React app (same code as the web)                 │
│         └── api.js detects REACT_APP_USE_LOCAL=true    │
│               └── Routes calls to local-api.js         │
│                     └── IndexedDB (Dexie)              │
│                     └── xlsx (Excel I/O)               │
│                     └── qrcode (QR generation)         │
└───────────────────────────────────────────────────────┘
```
No HTTP server, no MongoDB, no Python, no Node runtime inside the APK.
Just a WebView + ~360 KB of gzipped JavaScript doing everything locally.
