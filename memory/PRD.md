# Buldhana Police Bandobast — PRD

## 1. Problem
Digitize police bandobast deployment. Bilingual (English + Marathi). Three editions:
- **Web** (admin) — React + FastAPI + MongoDB
- **Android (admin offline)** — Capacitor + IndexedDB shim
- **Android (staff)** — Capacitor + online API for receiving bandobast alerts

## 2. Editions

### 2.1 Admin Web (production)
- Status: ✅ live, tested, 89+ staff records.

### 2.2 Admin Android offline (`/app/frontend`)
- Same React UI, IndexedDB local-api shim. APK via `.github/workflows/build-android.yml`.

### 2.3 Staff Android ⭐ NEW (this session)
- New Capacitor project at `/app/staff-app`.
- Mobile-number login → auto-detects staff record by digits-only match.
- Self-edit profile (name / rank / posting / gender / district / category)
  except mobile number. Photo capture via Capacitor Camera.
- Polls `/api/staff-app/alerts` every 30 s; fires local notification on new alert.
- Per-bandobast view: my point, equipment, suchana, Google Maps link, ID card
  preview, Duty-Pass QR (rendered server-side), co-staff at same point.
- Dedicated CI workflow `.github/workflows/build-staff-apk.yml` produces
  `BuldhanaBandobastStaff.apk`.
- See `/app/staff-app/README.md` for full build + install + admin-usage guide.

## 3. New backend endpoints (this session)
| Method | Path | Purpose |
|---|---|---|
| DELETE | `/api/staff/bulk/{staff_type}` | Delete-all by type (officer/amaldar/home_guard) |
| POST   | `/api/bandobasts/{bid}/alert` | Send alert to all allotted staff |
| GET    | `/api/bandobasts/{bid}/alert-status` | last_alerted_at, total, seen counts |
| POST   | `/api/staff-app/login` | Mobile-number login |
| GET    | `/api/staff-app/me` | Self profile |
| PATCH  | `/api/staff-app/me` | Update profile (mobile locked) |
| GET    | `/api/staff-app/alerts` | List my alerts |
| POST   | `/api/staff-app/alerts/{bid}/seen` | Mark alert seen |
| GET    | `/api/staff-app/bandobast/{bid}` | Get bandobast briefing for me |

## 4. New admin frontend changes
- StaffManagement: **Delete All** button (per active staff type), with
  double confirmation (`type DELETE to confirm`).
- BandobastDetail: **Bandobast Alert** section with `Send Alert` /
  `Re-send Alert` button + last-sent + seen counter.

## 5. End-to-end smoke (Apr 2026)
All 9 new endpoints verified via curl on the deployed preview:
- alert send: 1 sent, 0 skipped
- staff-app login → returns staff record
- alerts list, profile update, mark-seen, bandobast detail (with map URL,
  equipment, co-staff) — all green.

## 6. Backlog
- Real FCM push (replace polling) to deliver alerts when app is closed.
- OTP login (currently mobile-only).
- iOS build of the staff app.
- Sign APKs with release keystore for Play Store.

## 6.1 Apr 2026 — Map View + QR/Pass polish (this session)
- **Point QR** now encodes `https://www.google.com/maps/search/?api=1&query={lat},{lng}&query_place_id={point_name}` so any QR scanner opens Google Maps directly. Falls back to plain text briefing when lat/lng missing. (`/app/backend/server.py:790-880`)
- **Duty Pass** ( `PrintDutyPass.jsx`, `PrintBulkDutyPasses.jsx`): replaced the green "VALID" badge with `Date · Reporting Time` so the pass shows when the staff must report.
- **Bandobast Detail → 🗺️ Map View** button (next to Deploy) opens an interactive OpenStreetMap (Leaflet) modal plotting every point that has lat/lng. Each marker popup shows point name, sector, coords, full allotted staff list (name · rank · bakkal) and an "Open in Google Maps" deep-link.
  - New file: `/app/frontend/src/components/BandobastMapModal.jsx`
  - Deps added: `leaflet@1.9.4`, `react-leaflet@5.0.0`
  - Verified: 15/15 markers rendered + popup with Marathi staff names confirmed via Playwright.

## 6.2 Apr 2026 — Staff App polish (this session)
- **Staff app hosted as a web URL** (no install needed) at
  `https://duty-points-mgmt.preview.emergentagent.com/staff-app/` (built `dist`
  copied into `/app/frontend/public/staff-app/`).
- **Pager alert tone**, 5 seconds, classic two-tone (1000 Hz / 1400 Hz)
  synthesised via the Web Audio API (`/app/staff-app/src/pager.js`). Plays
  automatically inside `pollOnce()` when a new bandobast alert is found, and
  again from a "🔊 Test Pager Alert Tone (5s)" button on the login page so
  the user can verify and unlock audio. For the native Android build, a
  matching `pager.wav` is shipped at `res/raw/pager.wav` and registered as the
  notification sound in `capacitor.config.json`.
- **Download Android APK** button on the login page → `GET /api/staff-app/apk`.
  The endpoint serves the latest APK from `/app/docs/apk/BuldhanaBandobastStaff.apk`
  or falls back to the workflow-built APK paths under `android/app/build/outputs`.
  Until an APK exists, the button shows "APK build pending" (disabled) and the
  endpoint returns a helpful 404 explaining how to upload it.
- **Profile edit lock-down**: only `rank`, `posting`, `photo` are editable.
  All other fields (`name`, `mobile`, `bakkal_no`, `gender`, `district`,
  `category`) are shown but marked `Locked — managed by admin`. The backend
  `StaffAppProfileUpdate` Pydantic schema now strictly accepts only those three
  fields, so a tampered client cannot change locked data.
- **Branding**: app title is now **Buldhana Police Staff App** (HTML title,
  Capacitor `appName`, Android `strings.xml`). Maharashtra Police logo is used
  as the favicon, the in-app brand logo, and as the Android launcher icon —
  generated for all density buckets (mdpi → xxxhdpi) plus adaptive-icon
  foreground/background, via `/app/scripts/build_staff_app_assets.py`.

## 6.1 Apr 2026 — Map View + QR/Pass polish (this session)
- **Point QR** now encodes `https://www.google.com/maps/search/?api=1&query={lat},{lng}&query_place_id={point_name}` so any QR scanner opens Google Maps directly. Falls back to plain text briefing when lat/lng missing. (`/app/backend/server.py:790-880`)
- **Duty Pass** ( `PrintDutyPass.jsx`, `PrintBulkDutyPasses.jsx`): replaced the green "VALID" badge with `Date · Reporting Time` so the pass shows when the staff must report.
- **Bandobast Detail → 🗺️ Map View** button (next to Deploy) opens an interactive OpenStreetMap (Leaflet) modal plotting every point that has lat/lng. Each marker popup shows point name, sector, coords, full allotted staff list (name · rank · bakkal) and an "Open in Google Maps" deep-link.
  - New file: `/app/frontend/src/components/BandobastMapModal.jsx`
  - Deps added: `leaflet@1.9.4`, `react-leaflet@5.0.0`

## 7. Files of reference
| Area | Path |
|---|---|
| Backend | `/app/backend/server.py` (now 1130+ lines) |
| Admin web | `/app/frontend/src/pages/StaffManagement.jsx`, `BandobastDetail.jsx` |
| Admin offline | `/app/frontend/src/lib/local-api.js` (unchanged this round) |
| **Staff app** | `/app/staff-app/**` (new) |
| Workflows | `/app/.github/workflows/build-android.yml`, `/app/.github/workflows/build-staff-apk.yml` |

