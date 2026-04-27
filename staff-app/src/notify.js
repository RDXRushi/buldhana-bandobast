import { LocalNotifications } from "@capacitor/local-notifications";
import { Preferences } from "@capacitor/preferences";
import { api, getMobile } from "./api";

let pollHandle = null;

async function getSeenIds() {
  const v = await Preferences.get({ key: "seen_alert_keys" });
  try { return new Set(JSON.parse(v.value || "[]")); } catch { return new Set(); }
}

async function saveSeenIds(set) {
  await Preferences.set({ key: "seen_alert_keys", value: JSON.stringify([...set]) });
}

async function ensurePerm() {
  try {
    const cur = await LocalNotifications.checkPermissions();
    if (cur.display !== "granted") {
      await LocalNotifications.requestPermissions();
    }
  } catch (_) {}
}

export async function pollOnce() {
  const mobile = await getMobile();
  if (!mobile) return [];
  let alerts;
  try {
    alerts = await api.alerts(mobile);
  } catch (_) { return []; }
  const seen = await getSeenIds();
  const fresh = [];
  for (const a of alerts) {
    const key = `${a.bandobast_id}|${a.sent_at}`;
    if (!seen.has(key)) {
      fresh.push(a);
      seen.add(key);
    }
  }
  if (fresh.length) {
    await saveSeenIds(seen);
    await ensurePerm();
    try {
      await LocalNotifications.schedule({
        notifications: fresh.map((a, i) => ({
          id: Math.floor(Date.now() / 1000) + i,
          title: "🚨 Bandobast Alert",
          body: `${a.bandobast_name} on ${a.bandobast_date}. Tap to view your duty.`,
          extra: { bandobast_id: a.bandobast_id },
        })),
      });
    } catch (_) {}
  }
  return alerts;
}

export function startPolling(intervalMs = 30000) {
  if (pollHandle) return;
  pollOnce(); // immediate
  pollHandle = setInterval(pollOnce, intervalMs);
}

export function stopPolling() {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
}
