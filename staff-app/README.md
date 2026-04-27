# Buldhana Bandobast Staff App — Android

A companion mobile app for police staff. Each officer/amaldar/home-guard
logs in with the mobile number that admin has on record, then sees:

- 🔔 Bandobast alerts the moment admin clicks **Send Alert** in the web portal
- 📍 Their assigned point + Google Maps link
- 🎒 Their equipment for the duty
- 👥 Co-staff allotted at the same point
- 🆔 Their ID card and Duty Pass QR
- ✏️ Self-edit profile + capture their own photo (mobile number is locked)

---

## 1. Architecture

- React 18 + Vite + Capacitor 6
- Online (talks to the same FastAPI/MongoDB backend used by the admin portal)
- Mobile-number-only auth (no OTP for MVP — server-side check that the number
  exists in the staff database)
- Polls `/api/staff-app/alerts` every 30 s when foregrounded, fires a
  **local notification** for any new alert
- Saves `mobile` and a custom `backend_url` in `@capacitor/preferences`

Data flow:
```
Admin web portal           →  FastAPI (/api/bandobasts/:bid/alert)
       │                          │
       │  records alerts          │
       ▼                          ▼
      MongoDB ◄──────── /api/staff-app/* ────────┐
                                                 │
                                       Buldhana Bandobast Staff app (this APK)
                                       polls alerts, displays bandobast briefing
```

---

## 2. Build & download (GitHub Actions)

Every push to the repo triggers `.github/workflows/build-staff-apk.yml`:

1. **Set the backend URL** for the build:
   - **Easiest:** in your repo → **Settings → Variables → Actions → New repository variable**
     - Name: `STAFF_APP_BACKEND_URL`
     - Value: `https://your-deployed-admin-server.com`
   - **Or one-off:** open the Actions tab → "Build Staff App APK" → **Run workflow** → fill in the `backend_url` input.
2. Wait ~8 min for the workflow to finish.
3. Click into the run → scroll to **Artifacts** → download
   **`BuldhanaBandobastStaff-Android`** (ZIP with `BuldhanaBandobastStaff.apk`).
4. (Optional) tag a release `v1.0.0` to publish a public-download GitHub Release.

> Even if you forget to set the URL, the app's **Settings** screen lets each
> phone enter the URL manually after install.

---

## 3. Install on a phone

1. Transfer `BuldhanaBandobastStaff.apk` to the phone (USB / WhatsApp / Drive).
2. Open the file → tap **"Install anyway"** when Play Protect warns
   (debug-unsigned builds always show this).
3. Launch **"Buldhana Bandobast Staff"**.
4. **First-time setup**: tap **Settings**, paste the admin backend URL, save.
5. Enter your 10-digit mobile number → Login.
6. On Profile → tap **Edit → Capture Photo** → take selfie. Save.
7. When admin sends an alert, you get a notification + the alert appears in
   the Alerts tab.

---

## 4. Admin: how to send an alert

1. Open the admin portal.
2. Go to **Bandobasts → click the deployed bandobast → Detail page**.
3. The "Bandobast Alert / बंदोबस्त सूचना" panel shows. Click **Send Alert**.
4. Server records one alert per allotted staff member who has a valid mobile.
   Each phone running the staff app sees the new alert within 30 seconds.

---

## 5. Project layout

```
staff-app/
 ├─ src/
 │   ├─ App.jsx               ← router + bottom nav
 │   ├─ api.js                ← axios + Preferences-backed config
 │   ├─ notify.js             ← polling + local notifications
 │   └─ pages/
 │       ├─ LoginPage.jsx
 │       ├─ AlertsPage.jsx
 │       ├─ ProfilePage.jsx   ← edit profile + camera
 │       ├─ BandobastDetailPage.jsx
 │       └─ SettingsPage.jsx  ← change backend URL
 ├─ android/                  ← Capacitor-generated native project
 ├─ capacitor.config.json
 └─ vite.config.js
```

---

## 6. Future upgrades

- **Real push (FCM)** instead of polling, so alerts arrive even when the app
  is closed. Needs a Firebase project + `google-services.json`.
- **OTP login** if you want SMS-verified auth (Twilio/MSG91 — adds cost).
- **Offline mode** with full local cache so duty passes work without network.
- **iOS build** (re-use the same React code; add `npx cap add ios` on a Mac).
