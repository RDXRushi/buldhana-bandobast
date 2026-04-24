import axios from "axios";
import { localApi, localHelpers } from "./local-api";

/**
 * Two modes:
 *  - WEB (default): REACT_APP_BACKEND_URL points at the FastAPI server, all
 *    requests go via axios. 100% identical to previous behavior.
 *  - LOCAL (Android/Capacitor build): REACT_APP_USE_LOCAL=true. All requests
 *    hit the in-browser IndexedDB shim. No network, no server.
 */
const USE_LOCAL = process.env.REACT_APP_USE_LOCAL === "true";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const API = `${BACKEND_URL}/api`;
export const IS_LOCAL = USE_LOCAL;

const remoteAxios = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

export const api = USE_LOCAL ? localApi : remoteAxios;

// ---- Cross-mode helpers that pages use instead of building URLs directly. ----

/** Download the staff Excel template (Officer / Amaldar / Home Guard). */
export function downloadStaffTemplate(staffType) {
  if (USE_LOCAL) return localHelpers.downloadStaffTemplate(staffType);
  window.open(`${BACKEND_URL}/api/staff-template/${staffType}`, "_blank");
}

/** Download the bandobast-points Excel template. */
export function downloadPointTemplate() {
  if (USE_LOCAL) return localHelpers.downloadPointTemplate();
  window.open(`${BACKEND_URL}/api/bandobast-point-template`, "_blank");
}

/** Download the deployed bandobast's staff-wise roster as XLSX. */
export function downloadStaffWiseExcel(bid) {
  if (USE_LOCAL) return localHelpers.downloadStaffWiseExcel(bid);
  window.open(`${BACKEND_URL}/api/bandobasts/${bid}/export/staff-wise`, "_blank");
}

/**
 * Returns a URL suitable for an <img src=...> tag showing the QR code for a
 * point. In local mode this is a base64 data-URL; in web mode it points at
 * the backend.
 */
export async function getPointQRSrc(bid, pid) {
  if (USE_LOCAL) return await localHelpers.pointQRDataUrl(bid, pid);
  return `${BACKEND_URL}/api/bandobasts/${bid}/points/${pid}/qr`;
}

// ---- Unchanged exports used by pages ---------------------------------------

export const OFFICER_RANKS = ["ASP", "Dy.SP", "PI", "API", "PSI"];
export const AMALDAR_RANKS = ["ASI", "HC", "NPC", "PC", "LPC"];
export const HOME_GUARD_RANKS = ["Home Guard"];

export const STAFF_TYPE_LABELS = {
  officer: { en: "Officer", mr: "अधिकारी" },
  amaldar: { en: "Police Staff (Amaldar)", mr: "पोलीस अंमलदार" },
  home_guard: { en: "Home Guard", mr: "होमगार्ड" },
};

export const RANKS_BY_TYPE = {
  officer: OFFICER_RANKS,
  amaldar: AMALDAR_RANKS,
  home_guard: HOME_GUARD_RANKS,
};

export const EQUIPMENT_OPTIONS = [
  "Lathi",
  "Rifle",
  "Pistol",
  "Wireless",
  "Tear Gas",
  "Shield",
  "Helmet",
  "Body Cam",
  "Barricade",
];
