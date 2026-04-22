import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

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
