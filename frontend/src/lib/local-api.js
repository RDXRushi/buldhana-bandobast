/**
 * local-api.js — drop-in replacement for the FastAPI backend, running
 * entirely in the browser / WebView. Implements every endpoint used by
 * the UI against IndexedDB (via Dexie), xlsx (SheetJS) for Excel I/O,
 * and qrcode (npm) for QR generation.
 *
 * Exposed shape mirrors the axios instance (`get`, `post`, `put`, `patch`,
 * `delete`) so existing pages do not change.
 */
import { v4 as uuidv4 } from "uuid";
import * as XLSX from "xlsx";
import QRCode from "qrcode";
import { db } from "./local-db";

// ---------- helpers ---------------------------------------------------------

const now = () => new Date().toISOString();

async function readFileAsArrayBuffer(blobOrFile) {
  return await blobOrFile.arrayBuffer();
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function xlsxBlob(rows, sheetName) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function parseXlsx(file) {
  const buf = await readFileAsArrayBuffer(file);
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  return rows;
}

function httpErr(status, detail) {
  const err = new Error(detail || "Request failed");
  err.response = { status, data: { detail } };
  return err;
}

// ---------- STAFF ----------------------------------------------------------

async function listStaff(params = {}) {
  const { staff_type, rank, search } = params;
  let q = db.staff.toCollection();
  let arr = await q.toArray();
  if (staff_type) arr = arr.filter((s) => s.staff_type === staff_type);
  if (rank) arr = arr.filter((s) => s.rank === rank);
  if (search) {
    const s = String(search).toLowerCase();
    arr = arr.filter(
      (x) =>
        (x.name || "").toLowerCase().includes(s) ||
        (x.bakkal_no || "").toLowerCase().includes(s) ||
        (x.mobile || "").toLowerCase().includes(s)
    );
  }
  arr.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  return arr;
}

async function createStaff(payload) {
  const p = payload || {};
  if (!p.staff_type || !p.rank || !p.name) throw httpErr(400, "staff_type, rank, name required");
  if (p.staff_type === "officer") {
    const dup = await db.staff
      .where("name").equalsIgnoreCase(p.name)
      .and((x) => x.staff_type === "officer" && (x.mobile || "") === (p.mobile || ""))
      .first();
    if (dup) throw httpErr(409, "Officer with this Name + Mobile already exists");
  } else {
    if (!p.bakkal_no) throw httpErr(400, "Bakkal No is required for this staff type");
    const dup = await db.staff
      .where("bakkal_no").equals(p.bakkal_no)
      .and((x) => x.staff_type === p.staff_type)
      .first();
    if (dup) throw httpErr(409, "Staff with this Bakkal No already exists");
  }
  const obj = {
    id: uuidv4(),
    staff_type: p.staff_type,
    rank: p.rank,
    bakkal_no: p.staff_type === "officer" ? "" : (p.bakkal_no || ""),
    name: p.name,
    posting: p.posting || "",
    mobile: p.mobile || "",
    photo: p.photo || "",
    gender: p.gender || "Male",
    district: p.district || "Buldhana",
    category: p.category || "",
    created_at: now(),
  };
  await db.staff.add(obj);
  return obj;
}

async function getStaffByBakkal(bakkal_no, params = {}) {
  let item = await db.staff.where("bakkal_no").equals(bakkal_no).first();
  if (params.staff_type && item && item.staff_type !== params.staff_type) item = null;
  if (!item) throw httpErr(404, "Not found");
  return item;
}

async function getStaff(id) {
  const item = await db.staff.get(id);
  if (!item) throw httpErr(404, "Staff not found");
  return item;
}

async function updateStaff(id, payload) {
  const item = await db.staff.get(id);
  if (!item) throw httpErr(404, "Not found");
  const update = {};
  for (const k of ["rank", "name", "posting", "mobile", "photo", "gender", "district", "category", "bakkal_no"]) {
    if (payload[k] !== undefined && payload[k] !== null) update[k] = payload[k];
  }
  await db.staff.update(id, update);
  return await db.staff.get(id);
}

async function deleteStaff(id) {
  await db.staff.delete(id);
  return { ok: true };
}

// ---------- STAFF: Excel template + import ---------------------------------

function downloadStaffTemplate(staff_type) {
  const rows = staff_type === "officer"
    ? [
        ["rank", "name", "posting", "mobile", "gender", "district", "category"],
        ["PI", "Example Officer", "PS Buldhana", "9999999999", "Male", "Buldhana", "Open"],
      ]
    : [
        ["rank", "bakkal_no", "name", "posting", "mobile", "gender", "district", "category"],
        [staff_type === "amaldar" ? "HC" : "Home Guard", "12345", "Example Name", "PS Buldhana", "9999999999", "Male", "Buldhana", "Open"],
      ];
  triggerDownload(xlsxBlob(rows, staff_type.toUpperCase()), `${staff_type}_template.xlsx`);
}

async function importStaff(staff_type, file) {
  const rows = await parseXlsx(file);
  if (rows.length < 2) return { inserted: 0, skipped_duplicate: 0, skipped_missing: 0, total_rows: 0, errors: [] };
  const headers = rows[0].map((h) => String(h || "").trim().toLowerCase());
  const isOff = staff_type === "officer";
  const required = isOff ? ["rank", "name"] : ["rank", "bakkal_no", "name"];
  for (const r of required) if (!headers.includes(r)) throw httpErr(400, `Missing required column: ${r}`);
  let inserted = 0, skipped_duplicate = 0, skipped_missing = 0;
  const errors = [];
  for (let i = 1; i < rows.length; i++) {
    const d = {};
    headers.forEach((h, j) => { d[h] = rows[i][j] !== undefined && rows[i][j] !== null ? String(rows[i][j]).trim() : ""; });
    const missing = isOff ? (!d.name || !d.rank) : (!d.bakkal_no || !d.name || !d.rank);
    if (missing) {
      if (Object.values(d).some((v) => v)) skipped_missing++;
      continue;
    }
    let dup;
    if (isOff) {
      dup = await db.staff.filter((x) => x.staff_type === "officer" && x.name === d.name && (x.mobile || "") === (d.mobile || "")).first();
    } else {
      dup = await db.staff.where("bakkal_no").equals(d.bakkal_no).and((x) => x.staff_type === staff_type).first();
    }
    if (dup) { skipped_duplicate++; continue; }
    try {
      await db.staff.add({
        id: uuidv4(), staff_type, rank: d.rank,
        bakkal_no: isOff ? "" : (d.bakkal_no || ""),
        name: d.name, posting: d.posting || "", mobile: d.mobile || "",
        photo: "", gender: d.gender || "Male", district: d.district || "Buldhana",
        category: d.category || "", created_at: now(),
      });
      inserted++;
    } catch (e) { errors.push({ row: i + 1, error: String(e.message || e) }); }
  }
  return { inserted, skipped_duplicate, skipped_missing, errors, total_rows: rows.length - 1 };
}

// ---------- BANDOBASTS ------------------------------------------------------

async function listBandobasts(includeDeleted = false) {
  const arr = await db.bandobasts.toArray();
  const filtered = arr.filter((b) => includeDeleted ? b.deleted : !b.deleted);
  filtered.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  return filtered;
}

async function createBandobast(payload) {
  const p = payload || {};
  const obj = {
    id: uuidv4(),
    year: p.year, date: p.date, name: p.name,
    spot: p.spot || "", ps_name: p.ps_name || "", in_charge: p.in_charge || "",
    has_other_district: !!p.has_other_district,
    other_district_staff: [],
    points: [], selected_staff_ids: [], allotments: {}, equipment_assignments: {},
    status: "draft", deleted: false, created_at: now(),
  };
  await db.bandobasts.add(obj);
  return obj;
}

async function getBandobast(bid) {
  const item = await db.bandobasts.get(bid);
  if (!item) throw httpErr(404, "Not found");
  return item;
}

async function updateBandobast(bid, payload) {
  const item = await db.bandobasts.get(bid);
  if (!item) throw httpErr(404, "Not found");
  const update = {};
  for (const k of ["year", "date", "name", "spot", "ps_name", "in_charge", "has_other_district"]) {
    if (payload[k] !== undefined && payload[k] !== null) update[k] = payload[k];
  }
  await db.bandobasts.update(bid, update);
  return await db.bandobasts.get(bid);
}

async function softDeleteBandobast(bid) {
  const item = await db.bandobasts.get(bid);
  if (!item) throw httpErr(404, "Not found");
  await db.bandobasts.update(bid, { deleted: true });
  return { ok: true, soft_deleted: true };
}

async function restoreBandobast(bid) {
  const item = await db.bandobasts.get(bid);
  if (!item) throw httpErr(404, "Not found");
  await db.bandobasts.update(bid, { deleted: false });
  return { ok: true, restored: true };
}

async function permanentDeleteBandobast(bid) {
  await db.bandobasts.delete(bid);
  return { ok: true, permanent: true };
}

// ---------- POINTS ----------------------------------------------------------

function downloadPointTemplate() {
  const rows = [
    ["point_name", "req_officer", "req_amaldar", "req_female_amaldar", "req_home_guard", "equipment", "sector", "latitude", "longitude", "suchana"],
    ["Main Gate", 1, 4, 1, 2, "Lathi,Wireless,Barricade", "Sector A", 20.5316, 76.1853, "Report 30 min prior. Maintain crowd control."],
  ];
  triggerDownload(xlsxBlob(rows, "POINTS"), "bandobast_points_template.xlsx");
}

async function importPoints(bid, file) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Bandobast not found");
  const rows = await parseXlsx(file);
  if (rows.length < 2) return { inserted: 0, errors: [] };
  const headers = rows[0].map((h) => String(h || "").trim().toLowerCase());
  if (!headers.includes("point_name")) throw httpErr(400, "Missing required column: point_name");
  let inserted = 0; const errors = [];
  const points = [...(b.points || [])];
  const seqs = points.filter((p) => !p.is_reserved).map((p) => p.seq || 0);
  let nextSeq = (seqs.length ? Math.max(...seqs) : 0) + 1;
  const toInt = (v) => (v === undefined || v === null || v === "" ? 0 : parseInt(v, 10) || 0);
  const toFloat = (v) => (v === undefined || v === null || v === "" ? null : (parseFloat(v) || null));
  for (let i = 1; i < rows.length; i++) {
    const d = {};
    headers.forEach((h, j) => { d[h] = rows[i][j]; });
    const name = String(d.point_name || "").trim();
    if (!name) continue;
    try {
      const equipRaw = d.equipment || "";
      const equipment = String(equipRaw).split(",").map((e) => e.trim()).filter(Boolean);
      points.push({
        id: uuidv4(), point_name: name, seq: nextSeq++,
        req_officer: toInt(d.req_officer), req_amaldar: toInt(d.req_amaldar),
        req_female_amaldar: toInt(d.req_female_amaldar), req_home_guard: toInt(d.req_home_guard),
        equipment, sector: String(d.sector || "").trim(),
        latitude: toFloat(d.latitude), longitude: toFloat(d.longitude),
        suchana: String(d.suchana || "").trim(), is_reserved: false,
      });
      inserted++;
    } catch (e) { errors.push({ row: i + 1, error: String(e.message || e) }); }
  }
  await db.bandobasts.update(bid, { points });
  return { inserted, errors };
}

async function addPoint(bid, payload) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Not found");
  const p = payload || {};
  if (!p.id) p.id = uuidv4();
  const points = [...(b.points || [])];
  if (!p.seq) {
    const existing = points.filter((x) => !x.is_reserved).map((x) => x.seq || 0);
    p.seq = (existing.length ? Math.max(...existing) : 0) + 1;
  }
  const pt = {
    id: p.id, point_name: p.point_name, seq: p.seq || 0,
    req_officer: p.req_officer || 0, req_amaldar: p.req_amaldar || 0,
    req_female_amaldar: p.req_female_amaldar || 0, req_home_guard: p.req_home_guard || 0,
    equipment: p.equipment || [], sector: p.sector || "",
    latitude: p.latitude ?? null, longitude: p.longitude ?? null,
    suchana: p.suchana || "", is_reserved: !!p.is_reserved,
  };
  points.push(pt);
  await db.bandobasts.update(bid, { points });
  return pt;
}

async function updatePointSeq(bid, pid, seq) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Not found");
  const points = (b.points || []).map((p) => p.id === pid ? { ...p, seq } : p);
  await db.bandobasts.update(bid, { points });
  return { ok: true };
}

async function deletePoint(bid, pid) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Not found");
  const points = (b.points || []).filter((p) => p.id !== pid);
  const allotments = { ...(b.allotments || {}) };
  delete allotments[pid];
  const eq = { ...(b.equipment_assignments || {}) };
  delete eq[pid];
  await db.bandobasts.update(bid, { points, allotments, equipment_assignments: eq });
  return { ok: true };
}

// ---------- SELECTED / ALLOT / EQUIPMENT / DEPLOY --------------------------

async function putSelectedStaff(bid, staff_ids) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Not found");
  await db.bandobasts.update(bid, { selected_staff_ids: staff_ids || [] });
  return { ok: true, count: (staff_ids || []).length };
}

async function putAllotments(bid, allotments) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Not found");
  await db.bandobasts.update(bid, { allotments: allotments || {} });
  return { ok: true };
}

async function putEquipmentAssignments(bid, equipment_assignments) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Not found");
  await db.bandobasts.update(bid, { equipment_assignments: equipment_assignments || {} });
  return { ok: true };
}

async function deployBandobast(bid) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Not found");
  const allot = { ...(b.allotments || {}) };
  const selected = new Set(b.selected_staff_ids || []);
  const allotted = new Set();
  for (const sids of Object.values(allot)) sids.forEach((s) => allotted.add(s));
  const remaining = [...selected].filter((s) => !allotted.has(s));
  const points = [...(b.points || [])];
  let reservedPointId = null;
  for (const p of points) if (p.is_reserved) { reservedPointId = p.id; break; }
  if (remaining.length) {
    if (!reservedPointId) {
      reservedPointId = uuidv4();
      points.push({
        id: reservedPointId, point_name: "Reserved / राखीव", seq: 9999,
        req_officer: 0, req_amaldar: 0, req_female_amaldar: 0, req_home_guard: 0,
        equipment: [], sector: "", latitude: null, longitude: null, suchana: "", is_reserved: true,
      });
    }
    const existing = allot[reservedPointId] || [];
    allot[reservedPointId] = [...new Set([...existing, ...remaining])];
  }
  await db.bandobasts.update(bid, { status: "deployed", points, allotments: allot });
  return { ok: true, status: "deployed", reserved_count: remaining.length };
}

// ---------- OUT-OF-DISTRICT STAFF ------------------------------------------

async function addOutStaff(bid, payload) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Bandobast not found");
  const p = payload || {};
  const existing = b.other_district_staff || [];
  if (p.staff_type === "officer") {
    if (existing.some((s) => s.staff_type === "officer" && s.name === p.name && (s.mobile || "") === (p.mobile || "")))
      throw httpErr(409, "Officer with this Name + Mobile already exists");
  } else {
    if (!p.bakkal_no) throw httpErr(400, "Bakkal No is required for this staff type");
    if (existing.some((s) => s.bakkal_no === p.bakkal_no && s.staff_type === p.staff_type))
      throw httpErr(409, "Bakkal No already exists for this bandobast");
  }
  const obj = {
    id: uuidv4(), staff_type: p.staff_type, rank: p.rank,
    bakkal_no: p.staff_type === "officer" ? "" : (p.bakkal_no || ""),
    name: p.name, posting: p.posting || "", mobile: p.mobile || "",
    gender: p.gender || "Male", district: p.district || "Other",
    category: p.category || "", is_out_district: true,
  };
  const updated = [...existing, obj];
  await db.bandobasts.update(bid, { other_district_staff: updated });
  return obj;
}

async function updateOutStaff(bid, sid, payload) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Not found");
  const list = (b.other_district_staff || []).map((s) => s.id === sid ? { ...s, ...payload } : s);
  await db.bandobasts.update(bid, { other_district_staff: list });
  return { ok: true };
}

async function deleteOutStaff(bid, sid) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Not found");
  const list = (b.other_district_staff || []).filter((s) => s.id !== sid);
  const sel = (b.selected_staff_ids || []).filter((x) => x !== sid);
  const allot = {};
  for (const [k, v] of Object.entries(b.allotments || {})) {
    allot[k] = v.filter((x) => x !== sid);
  }
  await db.bandobasts.update(bid, { other_district_staff: list, selected_staff_ids: sel, allotments: allot });
  return { ok: true };
}

async function importOutStaff(bid, staff_type, file) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Bandobast not found");
  const rows = await parseXlsx(file);
  if (rows.length < 2) return { inserted: 0, total_rows: 0 };
  const headers = rows[0].map((h) => String(h || "").trim().toLowerCase());
  const isOff = staff_type === "officer";
  const required = isOff ? ["rank", "name"] : ["rank", "bakkal_no", "name"];
  for (const r of required) if (!headers.includes(r)) throw httpErr(400, `Missing required column: ${r}`);
  let inserted = 0, skipped_duplicate = 0, skipped_missing = 0;
  const existing = [...(b.other_district_staff || [])];
  for (let i = 1; i < rows.length; i++) {
    const d = {};
    headers.forEach((h, j) => { d[h] = rows[i][j] !== undefined && rows[i][j] !== null ? String(rows[i][j]).trim() : ""; });
    const missing = isOff ? (!d.name || !d.rank) : (!d.bakkal_no || !d.name || !d.rank);
    if (missing) { if (Object.values(d).some((v) => v)) skipped_missing++; continue; }
    let dup;
    if (isOff) dup = existing.find((s) => s.staff_type === "officer" && s.name === d.name && (s.mobile || "") === (d.mobile || ""));
    else dup = existing.find((s) => s.bakkal_no === d.bakkal_no && s.staff_type === staff_type);
    if (dup) { skipped_duplicate++; continue; }
    existing.push({
      id: uuidv4(), staff_type, rank: d.rank,
      bakkal_no: isOff ? "" : (d.bakkal_no || ""),
      name: d.name, posting: d.posting || "", mobile: d.mobile || "",
      gender: d.gender || "Male", district: d.district || "Other",
      category: d.category || "", is_out_district: true,
    });
    inserted++;
  }
  await db.bandobasts.update(bid, { other_district_staff: existing });
  return { inserted, skipped_duplicate, skipped_missing, total_rows: rows.length - 1 };
}

// ---------- STAFF RESOLVER (home + OD) -------------------------------------

async function getBandobastStaff(bid, sid) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Bandobast not found");
  const out = (b.other_district_staff || []).find((s) => s.id === sid);
  if (out) return out;
  const home = await db.staff.get(sid);
  if (!home) throw httpErr(404, "Staff not found");
  return home;
}

async function resolveStaffMap(bandobast, ids) {
  const set = new Set(ids);
  const all = await db.staff.toArray();
  const home = all.filter((s) => set.has(s.id));
  const od = (bandobast.other_district_staff || []).filter((s) => set.has(s.id));
  const map = {};
  for (const s of home) map[s.id] = s;
  for (const s of od) map[s.id] = s;
  return map;
}

// ---------- REPORTS: Goshwara ----------------------------------------------

async function goshwara(bid) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Not found");
  const allIds = [...new Set(Object.values(b.allotments || {}).flat())];
  const map = await resolveStaffMap(b, allIds);
  const point_wise = (b.points || []).map((p) => ({
    point: p,
    staff: (b.allotments[p.id] || []).map((id) => map[id]).filter(Boolean),
  }));
  const staff_wise = Object.keys(map).map((sid) => ({
    staff: map[sid],
    points: (b.points || []).filter((p) => (b.allotments[p.id] || []).includes(sid)),
  }));
  return { bandobast: b, point_wise, staff_wise };
}

// ---------- REPORTS: Staff-wise Excel --------------------------------------

async function downloadStaffWiseExcel(bid) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Not found");
  const selected = b.selected_staff_ids || [];
  const all = [...new Set([...selected, ...Object.values(b.allotments || {}).flat()])];
  const map = await resolveStaffMap(b, all);
  const rows = [["Sr", "Type", "Rank", "Bakkal No", "Name", "Posting", "Mobile", "Gender", "District", "Category", "Allotted Points"]];
  let i = 1;
  const list = selected.length ? selected : Object.keys(map);
  for (const sid of list) {
    const s = map[sid]; if (!s) continue;
    const assigned = (b.points || []).filter((p) => (b.allotments[p.id] || []).includes(sid)).map((p) => p.point_name);
    rows.push([i++, s.staff_type, s.rank, s.bakkal_no || "", s.name, s.posting || "", s.mobile || "", s.gender, s.district, s.category || "", assigned.join(", ") || "-"]);
  }
  const safe = (b.name || "bandobast").replace(/\s+/g, "_");
  triggerDownload(xlsxBlob(rows, "Amaldar-wise"), `${safe}_amaldar_wise.xlsx`);
}

// ---------- QR (returns data URL) ------------------------------------------

async function pointQRDataUrl(bid, pid) {
  const b = await db.bandobasts.get(bid);
  if (!b) throw httpErr(404, "Not found");
  const p = (b.points || []).find((x) => x.id === pid);
  if (!p) throw httpErr(404, "Point not found");
  const allot = (b.allotments || {})[p.id] || [];
  const eqMap = ((b.equipment_assignments || {})[p.id]) || {};
  const map = await resolveStaffMap(b, allot);
  const officers = [], amaldars = [], guards = [];
  for (const sid of allot) {
    const s = map[sid]; if (!s) continue;
    const extras = [s.rank];
    if (s.bakkal_no && s.staff_type !== "officer") extras.push("B" + s.bakkal_no);
    if (s.mobile) extras.push(s.mobile);
    if (eqMap[sid]) extras.push("[" + eqMap[sid] + "]");
    const line = `${s.name} (${extras.filter(Boolean).join(", ")})`;
    if (s.staff_type === "officer") officers.push(line);
    else if (s.staff_type === "amaldar") amaldars.push(line);
    else guards.push(line);
  }
  const lines = [
    `BANDOBAST: ${b.name}`, `DATE: ${b.date}`, `POINT: ${p.point_name}`,
  ];
  if (p.sector) lines.push(`SECTOR: ${p.sector}`);
  if (p.latitude != null && p.longitude != null) lines.push(`MAP: https://www.google.com/maps?q=${p.latitude},${p.longitude}`);
  if ((p.equipment || []).length) lines.push(`EQUIPMENT: ${p.equipment.join(", ")}`);
  if (officers.length) { lines.push("OFFICERS:"); officers.forEach((o) => lines.push("- " + o)); }
  if (amaldars.length) { lines.push("AMALDARS:"); amaldars.forEach((o) => lines.push("- " + o)); }
  if (guards.length) { lines.push("HOME GUARDS:"); guards.forEach((o) => lines.push("- " + o)); }
  if (p.suchana) lines.push(`SUCHANA: ${p.suchana}`);
  return await QRCode.toDataURL(lines.join("\n"), { errorCorrectionLevel: "L", margin: 2, scale: 6 });
}

// ---------- URL ROUTER (axios-compatible surface) --------------------------
// Parses an incoming "request" and dispatches to the right handler.

function buildAxiosShim() {
  const ok = (data) => ({ data, status: 200 });

  async function route(method, url, body, config) {
    // Strip leading "/" just to be safe
    const u = url.startsWith("/") ? url : "/" + url;
    const m = method.toUpperCase();

    // /staff
    if (u === "/staff" && m === "GET") return ok(await listStaff((config && config.params) || {}));
    if (u === "/staff" && m === "POST") return ok(await createStaff(body));

    let mt;
    mt = u.match(/^\/staff\/by-bakkal\/(.+)$/);
    if (mt && m === "GET") return ok(await getStaffByBakkal(decodeURIComponent(mt[1]), (config && config.params) || {}));

    mt = u.match(/^\/staff\/([^/]+)$/);
    if (mt && m === "GET") return ok(await getStaff(mt[1]));
    if (mt && m === "PATCH") return ok(await updateStaff(mt[1], body));
    if (mt && m === "DELETE") return ok(await deleteStaff(mt[1]));

    mt = u.match(/^\/staff\/import\/(officer|amaldar|home_guard)$/);
    if (mt && m === "POST") {
      const file = body instanceof FormData ? body.get("file") : body.file;
      return ok(await importStaff(mt[1], file));
    }

    // /bandobasts
    if (u === "/bandobasts" && m === "GET") return ok(await listBandobasts(false));
    if (u === "/bandobasts" && m === "POST") return ok(await createBandobast(body));
    if (u === "/bandobasts/deleted" && m === "GET") return ok(await listBandobasts(true));

    mt = u.match(/^\/bandobasts\/([^/]+)$/);
    if (mt && m === "GET") return ok(await getBandobast(mt[1]));
    if (mt && m === "PATCH") return ok(await updateBandobast(mt[1], body));
    if (mt && m === "DELETE") return ok(await softDeleteBandobast(mt[1]));

    mt = u.match(/^\/bandobasts\/([^/]+)\/restore$/);
    if (mt && m === "POST") return ok(await restoreBandobast(mt[1]));

    mt = u.match(/^\/bandobasts\/([^/]+)\/permanent$/);
    if (mt && m === "DELETE") return ok(await permanentDeleteBandobast(mt[1]));

    mt = u.match(/^\/bandobasts\/([^/]+)\/points$/);
    if (mt && m === "POST") return ok(await addPoint(mt[1], body));

    mt = u.match(/^\/bandobasts\/([^/]+)\/points\/import$/);
    if (mt && m === "POST") {
      const file = body instanceof FormData ? body.get("file") : body.file;
      return ok(await importPoints(mt[1], file));
    }

    mt = u.match(/^\/bandobasts\/([^/]+)\/points\/([^/]+)\/seq$/);
    if (mt && m === "PATCH") return ok(await updatePointSeq(mt[1], mt[2], body.seq));

    mt = u.match(/^\/bandobasts\/([^/]+)\/points\/([^/]+)$/);
    if (mt && m === "DELETE") return ok(await deletePoint(mt[1], mt[2]));

    mt = u.match(/^\/bandobasts\/([^/]+)\/selected-staff$/);
    if (mt && m === "PUT") return ok(await putSelectedStaff(mt[1], body.staff_ids));

    mt = u.match(/^\/bandobasts\/([^/]+)\/allotments$/);
    if (mt && m === "PUT") return ok(await putAllotments(mt[1], body.allotments));

    mt = u.match(/^\/bandobasts\/([^/]+)\/equipment-assignments$/);
    if (mt && m === "PUT") return ok(await putEquipmentAssignments(mt[1], body.equipment_assignments));

    mt = u.match(/^\/bandobasts\/([^/]+)\/deploy$/);
    if (mt && m === "POST") return ok(await deployBandobast(mt[1]));

    mt = u.match(/^\/bandobasts\/([^/]+)\/out-staff$/);
    if (mt && m === "POST") return ok(await addOutStaff(mt[1], body));

    mt = u.match(/^\/bandobasts\/([^/]+)\/out-staff\/([^/]+)$/);
    if (mt && m === "PATCH") return ok(await updateOutStaff(mt[1], mt[2], body));
    if (mt && m === "DELETE") return ok(await deleteOutStaff(mt[1], mt[2]));

    mt = u.match(/^\/bandobasts\/([^/]+)\/out-staff\/import\/(officer|amaldar|home_guard)$/);
    if (mt && m === "POST") {
      const file = body instanceof FormData ? body.get("file") : body.file;
      return ok(await importOutStaff(mt[1], mt[2], file));
    }

    mt = u.match(/^\/bandobasts\/([^/]+)\/staff\/([^/]+)$/);
    if (mt && m === "GET") return ok(await getBandobastStaff(mt[1], mt[2]));

    mt = u.match(/^\/bandobasts\/([^/]+)\/goshwara$/);
    if (mt && m === "GET") return ok(await goshwara(mt[1]));

    // Unknown route
    console.warn("[local-api] Unhandled route:", method, u);
    throw httpErr(404, `Local API: route not found ${method} ${u}`);
  }

  return {
    get: (url, config) => route("GET", url, null, config),
    post: (url, body, config) => route("POST", url, body, config),
    put: (url, body, config) => route("PUT", url, body, config),
    patch: (url, body, config) => route("PATCH", url, body, config),
    delete: (url, config) => route("DELETE", url, null, config),
  };
}

export const localApi = buildAxiosShim();

export const localHelpers = {
  downloadStaffTemplate,
  downloadPointTemplate,
  downloadStaffWiseExcel,
  pointQRDataUrl,
};
