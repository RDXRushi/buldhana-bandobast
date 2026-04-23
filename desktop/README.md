# Buldhana Police Bandobast — Windows Desktop (Offline, Standalone)

## What you get
A fully offline, standalone Windows desktop application of the Digital Police Bandobast Management System.
- No internet required after installation
- No server/database setup needed — uses local storage (~per-user)
- All features from the web version included

## System requirements
- Windows 10 or 11 (64-bit)
- ~300 MB free disk space
- 4 GB RAM recommended (app supports up to 8 GB heap)

## How to run (Portable — no install)
1. Download `BuldhanaBandobast-Portable-v1.0.0.zip`
2. Right-click → **Extract All...** to any folder (e.g., `C:\BuldhanaBandobast`)
3. Inside the extracted folder, double-click **`Buldhana Police Bandobast.exe`**
4. On first run Windows may show **"Windows protected your PC"** — click **More info → Run anyway** (normal for unsigned apps)
5. The app window opens with the same login screen as the web version. Default demo credentials: `admin` / `admin`

## Where is your data stored?
All bandobasts, staff, and equipment assignments are saved locally in:
```
C:\Users\<YourName>\AppData\Roaming\buldhana-bandobast-desktop\bandobast-db.json
```
You can back this file up, copy it between machines, or restore it anytime.
The File menu → "Open Data Folder" opens this location.

## Features included (all offline)
- Dashboard with calendar and bandobast list
- Staff Management (Officer / Amaldar / Home Guard) with Excel import/template
- 5-step Bandobast Wizard (Create → Points → Select → Allot → Deploy)
- Out-of-District staff (scoped per bandobast)
- Equipment assignment (1 item per staff per point)
- QR codes containing full point briefing + Google Maps URL (scan offline works; opening the map link requires phone internet)
- Print ID Cards, Duty Passes, Goshwara (bulk + individual)
- Excel roster export
- Soft-delete + Restore + Permanent delete

## Build from source (for developers)
```bash
cd /app/desktop
yarn install
yarn start   # dev run
yarn dist    # build Windows installer (requires wine on Linux or native Windows)
```

## Updating
Simply replace the extracted folder with a newer portable build. Data in `AppData` is preserved.

## Multi-PC usage
Each Windows PC has its own local database. To sync between PCs, copy the JSON file from `AppData\Roaming\buldhana-bandobast-desktop\` — or, as a future enhancement, a sync server can be added.
