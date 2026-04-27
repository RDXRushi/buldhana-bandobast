import axios from "axios";
import { Preferences } from "@capacitor/preferences";

// Backend URL: priority order
//   1. localStorage override (set via Settings page)
//   2. Vite-provided env var (REACT_APP_BACKEND_URL or VITE_BACKEND_URL)
//   3. Built-in default (must be set at build time)
const ENV_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.REACT_APP_BACKEND_URL ||
  "";

let cachedBaseUrl = ENV_URL;

export async function getBaseUrl() {
  if (cachedBaseUrl) return cachedBaseUrl;
  try {
    const v = await Preferences.get({ key: "backend_url" });
    if (v.value) {
      cachedBaseUrl = v.value;
      return v.value;
    }
  } catch (_) {}
  return ENV_URL;
}

export async function setBaseUrl(url) {
  cachedBaseUrl = url;
  await Preferences.set({ key: "backend_url", value: url });
}

export async function getMobile() {
  const v = await Preferences.get({ key: "mobile" });
  return v.value || "";
}

export async function setMobile(mobile) {
  await Preferences.set({ key: "mobile", value: mobile });
}

export async function clearAuth() {
  await Preferences.remove({ key: "mobile" });
}

async function request(method, path, { params, data, headers } = {}) {
  const base = await getBaseUrl();
  if (!base) throw new Error("Backend URL not configured. Open Settings to set it.");
  const res = await axios.request({
    method,
    url: `${base.replace(/\/$/, "")}/api${path}`,
    params,
    data,
    headers,
    timeout: 15000,
  });
  return res.data;
}

export const api = {
  login: (mobile) => request("POST", "/staff-app/login", { data: { mobile } }),
  me: (mobile) => request("GET", "/staff-app/me", { params: { mobile } }),
  updateMe: (mobile, payload) => request("PATCH", "/staff-app/me", { params: { mobile }, data: payload }),
  alerts: (mobile) => request("GET", "/staff-app/alerts", { params: { mobile } }),
  markSeen: (bid, mobile) => request("POST", `/staff-app/alerts/${bid}/seen`, { params: { mobile } }),
  bandobast: (bid, mobile) => request("GET", `/staff-app/bandobast/${bid}`, { params: { mobile } }),
  qrUrl: async (bid, pid) => {
    const base = await getBaseUrl();
    return `${base.replace(/\/$/, "")}/api/bandobasts/${bid}/points/${pid}/qr`;
  },
};
