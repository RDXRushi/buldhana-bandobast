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

## 7. Files of reference
| Area | Path |
|---|---|
| Backend | `/app/backend/server.py` (now 1130+ lines) |
| Admin web | `/app/frontend/src/pages/StaffManagement.jsx`, `BandobastDetail.jsx` |
| Admin offline | `/app/frontend/src/lib/local-api.js` (unchanged this round) |
| **Staff app** | `/app/staff-app/**` (new) |
| Workflows | `/app/.github/workflows/build-android.yml`, `/app/.github/workflows/build-staff-apk.yml` |

## 8. Test credentials
Admin: `admin` / `admin`. Staff: any mobile number that exists in the staff DB.
