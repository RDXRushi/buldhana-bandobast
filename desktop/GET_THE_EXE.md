# Get the `.exe` via GitHub Actions — 3-minute setup

Because an `.exe` can only be built on Windows, we use a free GitHub-hosted
Windows runner. After a one-time setup, every push gives you a downloadable
installer + portable `.exe`.

---

## 1. Push this repo to your GitHub account

In the Emergent chat input, click **“Save to GitHub”** and follow the prompts.

After the push completes, open your repo on GitHub.com.

---

## 2. Watch the build run (happens automatically)

1. Go to the **Actions** tab of your repo.
2. You'll see a workflow run named **"Build Windows Desktop App"** starting
   (it kicks off automatically on every push to `main`/`master`).
3. Click into it and watch the steps. Total time: **~8–10 minutes**.

If it didn't trigger automatically, click the workflow on the left → then the
**Run workflow** button on the right.

---

## 3. Download the `.exe`

When the run finishes (green ✅):

1. Scroll to the bottom of the run page → **Artifacts** section.
2. Click **`BuldhanaBandobast-Windows`** to download a ZIP containing:
   - `BuldhanaBandobast-1.0.0-x64.exe`          ← NSIS installer
   - `BuldhanaBandobast-Portable-1.0.0.exe`     ← Portable single-file
   - `latest.yml`                               ← update metadata
3. Extract the ZIP, double-click the `.exe`, and you're running.

> Artifacts are stored for 30 days and visible only to your GitHub account.

---

## 4. (Optional) Publish a public release with one command

If you want a shareable **public download link** that anyone can use without
logging into GitHub:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow detects the tag and automatically creates a **GitHub Release**
with both `.exe` files attached. The release URL will be:

```
https://github.com/<your-user>/<your-repo>/releases/tag/v1.0.0
```

Anyone — including officers on mobile — can download directly from there.

---

## 5. Rebuilding after changes

Just commit and push to `main`. The workflow re-runs and produces a fresh
`.exe`. The installer auto-preserves user data in `%APPDATA%`.

---

## Troubleshooting

| Symptom                              | Fix                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Workflow didn't start                | Actions tab → "I understand my workflows, go ahead and enable them" button (first-time only).            |
| `yarn build` fails with warnings     | Already handled — we set `CI=false` in the workflow to suppress warnings-as-errors.                       |
| PyInstaller import error             | Add the missing module to `hidden` in `desktop/python-backend/bandobast-server.spec`, push again.          |
| MongoDB download fails               | Transient MongoDB CDN outage; re-run the workflow.                                                        |
| "Windows protected your PC" on run   | Unsigned binaries → **More info → Run anyway** (or buy an Authenticode cert and sign; see `BUILD_WINDOWS.md`). |
