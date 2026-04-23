// Express + lowdb server — offline port of the FastAPI backend.
// Serves /api/* routes identical in shape to the web version.

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const ExcelJS = require("exceljs");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const OFFICER_RANKS = ["ASP", "Dy.SP", "PI", "API", "PSI"];
const AMALDAR_RANKS = ["ASI", "HC", "NPC", "PC", "LPC"];
const HOME_GUARD_RANKS = ["Home Guard"];

function initDb(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "bandobast-db.json");
  const adapter = new FileSync(file);
  const db = low(adapter);
  db.defaults({ staff: [], bandobasts: [] }).write();
  return db;
}

function nowIso() {
  return new Date().toISOString();
}

function startServer(userDataDir) {
  return new Promise((resolve) => {
    const db = initDb(userDataDir);
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

    // ========== STAFF ==========
    app.get("/api", (req, res) => res.json({ message: "Buldhana Police Bandobast API (Desktop)" }));
    app.get("/api/", (req, res) => res.json({ message: "Buldhana Police Bandobast API (Desktop)" }));

    app.get("/api/staff", (req, res) => {
      const { staff_type, rank, search } = req.query;
      let list = db.get("staff").value() || [];
      if (staff_type) list = list.filter((s) => s.staff_type === staff_type);
      if (rank) list = list.filter((s) => s.rank === rank);
      if (search) {
        const q = String(search).toLowerCase();
        list = list.filter(
          (s) =>
            (s.name || "").toLowerCase().includes(q) ||
            (s.bakkal_no || "").toLowerCase().includes(q) ||
            (s.mobile || "").toLowerCase().includes(q)
        );
      }
      list = [...list].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      res.json(list);
    });

    app.post("/api/staff", (req, res) => {
      const p = req.body || {};
      if (!p.staff_type || !p.rank || !p.name) return res.status(400).json({ detail: "staff_type, rank, name required" });
      const all = db.get("staff");
      if (p.staff_type === "officer") {
        const dup = all.find({ staff_type: "officer", name: p.name, mobile: p.mobile || "" }).value();
        if (dup) return res.status(409).json({ detail: "Officer with this Name + Mobile already exists" });
      } else {
        if (!p.bakkal_no) return res.status(400).json({ detail: "Bakkal No is required for this staff type" });
        const dup = all.find({ bakkal_no: p.bakkal_no, staff_type: p.staff_type }).value();
        if (dup) return res.status(409).json({ detail: "Staff with this Bakkal No already exists" });
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
        created_at: nowIso(),
      };
      all.push(obj).write();
      res.json(obj);
    });

    app.get("/api/staff/by-bakkal/:bakkal_no", (req, res) => {
      const { bakkal_no } = req.params;
      const { staff_type } = req.query;
      const q = { bakkal_no };
      if (staff_type) q.staff_type = staff_type;
      const item = db.get("staff").find(q).value();
      if (!item) return res.status(404).json({ detail: "Not found" });
      res.json(item);
    });

    app.get("/api/staff/:id", (req, res) => {
      const item = db.get("staff").find({ id: req.params.id }).value();
      if (!item) return res.status(404).json({ detail: "Staff not found" });
      res.json(item);
    });

    app.patch("/api/staff/:id", (req, res) => {
      const entry = db.get("staff").find({ id: req.params.id });
      if (!entry.value()) return res.status(404).json({ detail: "Not found" });
      const update = {};
      for (const k of ["rank", "name", "posting", "mobile", "photo", "gender", "district", "category", "bakkal_no"]) {
        if (req.body[k] !== undefined && req.body[k] !== null) update[k] = req.body[k];
      }
      entry.assign(update).write();
      res.json(entry.value());
    });

    app.delete("/api/staff/:id", (req, res) => {
      const removed = db.get("staff").remove({ id: req.params.id }).write();
      if (!removed.length) return res.status(404).json({ detail: "Not found" });
      res.json({ ok: true });
    });

    // ===== Staff Excel template =====
    app.get("/api/staff-template/:staff_type", async (req, res) => {
      const { staff_type } = req.params;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(staff_type.toUpperCase());
      if (staff_type === "officer") {
        ws.addRow(["rank", "name", "posting", "mobile", "gender", "district", "category"]);
        ws.addRow(["PI", "Example Officer", "PS Buldhana", "9999999999", "Male", "Buldhana", "Open"]);
      } else {
        ws.addRow(["rank", "bakkal_no", "name", "posting", "mobile", "gender", "district", "category"]);
        const er = staff_type === "amaldar" ? "HC" : "Home Guard";
        ws.addRow([er, "12345", "Example Name", "PS Buldhana", "9999999999", "Male", "Buldhana", "Open"]);
      }
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=${staff_type}_template.xlsx`);
      await wb.xlsx.write(res);
      res.end();
    });

    // ===== Staff Excel import =====
    const parseXlsx = async (buffer) => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);
      const ws = wb.worksheets[0];
      const rows = [];
      ws.eachRow({ includeEmpty: false }, (row) => rows.push(row.values.slice(1)));
      return rows;
    };

    app.post("/api/staff/import/:staff_type", upload.single("file"), async (req, res) => {
      const { staff_type } = req.params;
      if (!req.file) return res.status(400).json({ detail: "No file" });
      let rows;
      try { rows = await parseXlsx(req.file.buffer); } catch (e) { return res.status(400).json({ detail: "Invalid Excel" }); }
      if (rows.length < 2) return res.json({ inserted: 0, skipped_duplicate: 0, skipped_missing: 0, total_rows: 0, errors: [] });
      const headers = rows[0].map((h) => String(h || "").trim().toLowerCase());
      const isOff = staff_type === "officer";
      const required = isOff ? ["rank", "name"] : ["rank", "bakkal_no", "name"];
      for (const r of required) if (!headers.includes(r)) return res.status(400).json({ detail: `Missing required column: ${r}` });
      let inserted = 0, skipped_duplicate = 0, skipped_missing = 0;
      const errors = [];
      const all = db.get("staff");
      for (let i = 1; i < rows.length; i++) {
        const data = {};
        headers.forEach((h, j) => { data[h] = rows[i][j] !== undefined && rows[i][j] !== null ? String(rows[i][j]).trim() : ""; });
        const missing = isOff ? (!data.name || !data.rank) : (!data.bakkal_no || !data.name || !data.rank);
        if (missing) {
          if (Object.values(data).some((v) => v)) skipped_missing++;
          continue;
        }
        let dup;
        if (isOff) dup = all.find({ staff_type: "officer", name: data.name, mobile: data.mobile || "" }).value();
        else dup = all.find({ bakkal_no: data.bakkal_no, staff_type }).value();
        if (dup) { skipped_duplicate++; continue; }
        try {
          all.push({
            id: uuidv4(), staff_type, rank: data.rank, bakkal_no: isOff ? "" : (data.bakkal_no || ""),
            name: data.name, posting: data.posting || "", mobile: data.mobile || "",
            photo: "", gender: data.gender || "Male", district: data.district || "Buldhana",
            category: data.category || "", created_at: nowIso(),
          }).write();
          inserted++;
        } catch (e) { errors.push({ row: i + 1, error: String(e.message || e) }); }
      }
      res.json({ inserted, skipped_duplicate, skipped_missing, errors, total_rows: rows.length - 1 });
    });

    // ========== BANDOBAST ==========
    app.get("/api/bandobasts", (req, res) => {
      const items = (db.get("bandobasts").value() || []).filter((b) => !b.deleted);
      items.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      res.json(items);
    });

    app.get("/api/bandobasts/deleted", (req, res) => {
      const items = (db.get("bandobasts").value() || []).filter((b) => b.deleted);
      items.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      res.json(items);
    });

    app.post("/api/bandobasts", (req, res) => {
      const p = req.body || {};
      const obj = {
        id: uuidv4(),
        year: p.year, date: p.date, name: p.name,
        spot: p.spot || "", ps_name: p.ps_name || "", in_charge: p.in_charge || "",
        has_other_district: !!p.has_other_district,
        other_district_staff: [],
        points: [], selected_staff_ids: [], allotments: {}, equipment_assignments: {},
        status: "draft", deleted: false, created_at: nowIso(),
      };
      db.get("bandobasts").push(obj).write();
      res.json(obj);
    });

    app.get("/api/bandobasts/:bid", (req, res) => {
      const item = db.get("bandobasts").find({ id: req.params.bid }).value();
      if (!item) return res.status(404).json({ detail: "Not found" });
      res.json(item);
    });

    app.patch("/api/bandobasts/:bid", (req, res) => {
      const entry = db.get("bandobasts").find({ id: req.params.bid });
      if (!entry.value()) return res.status(404).json({ detail: "Not found" });
      const update = {};
      for (const k of ["year", "date", "name", "spot", "ps_name", "in_charge", "has_other_district"]) {
        if (req.body[k] !== undefined && req.body[k] !== null) update[k] = req.body[k];
      }
      entry.assign(update).write();
      res.json(entry.value());
    });

    app.delete("/api/bandobasts/:bid", (req, res) => {
      const entry = db.get("bandobasts").find({ id: req.params.bid });
      if (!entry.value()) return res.status(404).json({ detail: "Not found" });
      entry.assign({ deleted: true }).write();
      res.json({ ok: true, soft_deleted: true });
    });

    app.post("/api/bandobasts/:bid/restore", (req, res) => {
      const entry = db.get("bandobasts").find({ id: req.params.bid });
      if (!entry.value()) return res.status(404).json({ detail: "Not found" });
      entry.assign({ deleted: false }).write();
      res.json({ ok: true, restored: true });
    });

    app.delete("/api/bandobasts/:bid/permanent", (req, res) => {
      const removed = db.get("bandobasts").remove({ id: req.params.bid }).write();
      if (!removed.length) return res.status(404).json({ detail: "Not found" });
      res.json({ ok: true, permanent: true });
    });

    // Points template + import
    app.get("/api/bandobast-point-template", async (req, res) => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("POINTS");
      ws.addRow(["point_name", "req_officer", "req_amaldar", "req_female_amaldar", "req_home_guard", "equipment", "sector", "latitude", "longitude", "suchana"]);
      ws.addRow(["Main Gate", 1, 4, 1, 2, "Lathi,Wireless,Barricade", "Sector A", 20.5316, 76.1853, "Report 30 min prior. Maintain crowd control."]);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=bandobast_points_template.xlsx");
      await wb.xlsx.write(res);
      res.end();
    });

    app.post("/api/bandobasts/:bid/points/import", upload.single("file"), async (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid });
      if (!b.value()) return res.status(404).json({ detail: "Bandobast not found" });
      if (!req.file) return res.status(400).json({ detail: "No file" });
      let rows;
      try { rows = await parseXlsx(req.file.buffer); } catch { return res.status(400).json({ detail: "Invalid Excel" }); }
      if (rows.length < 2) return res.json({ inserted: 0, errors: [] });
      const headers = rows[0].map((h) => String(h || "").trim().toLowerCase());
      if (!headers.includes("point_name")) return res.status(400).json({ detail: "Missing required column: point_name" });
      let inserted = 0; const errors = [];
      const existing = b.value().points || [];
      const seqs = existing.filter((p) => !p.is_reserved).map((p) => p.seq || 0);
      let nextSeq = (seqs.length ? Math.max(...seqs) : 0) + 1;
      for (let i = 1; i < rows.length; i++) {
        const d = {};
        headers.forEach((h, j) => { d[h] = rows[i][j]; });
        const name = String(d.point_name || "").trim();
        if (!name) continue;
        try {
          const toInt = (v) => (v === undefined || v === null || v === "" ? 0 : parseInt(v, 10) || 0);
          const toFloat = (v) => (v === undefined || v === null || v === "" ? null : (parseFloat(v) || null));
          const equipRaw = d.equipment || "";
          const equipment = String(equipRaw).split(",").map((e) => e.trim()).filter(Boolean);
          const pt = {
            id: uuidv4(), point_name: name, seq: nextSeq++,
            req_officer: toInt(d.req_officer), req_amaldar: toInt(d.req_amaldar),
            req_female_amaldar: toInt(d.req_female_amaldar), req_home_guard: toInt(d.req_home_guard),
            equipment, sector: String(d.sector || "").trim(),
            latitude: toFloat(d.latitude), longitude: toFloat(d.longitude),
            suchana: String(d.suchana || "").trim(), is_reserved: false,
          };
          b.get("points").push(pt).write();
          inserted++;
        } catch (e) { errors.push({ row: i + 1, error: String(e.message || e) }); }
      }
      res.json({ inserted, errors });
    });

    // Points CRUD
    app.post("/api/bandobasts/:bid/points", (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid });
      if (!b.value()) return res.status(404).json({ detail: "Not found" });
      const p = req.body || {};
      if (!p.id) p.id = uuidv4();
      if (!p.seq) {
        const existing = b.value().points.filter((x) => !x.is_reserved).map((x) => x.seq || 0);
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
      b.get("points").push(pt).write();
      res.json(pt);
    });

    app.patch("/api/bandobasts/:bid/points/:pid/seq", (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid });
      if (!b.value()) return res.status(404).json({ detail: "Not found" });
      const points = b.value().points.map((p) => p.id === req.params.pid ? { ...p, seq: req.body.seq } : p);
      b.assign({ points }).write();
      res.json({ ok: true });
    });

    app.delete("/api/bandobasts/:bid/points/:pid", (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid });
      if (!b.value()) return res.status(404).json({ detail: "Not found" });
      const points = b.value().points.filter((p) => p.id !== req.params.pid);
      const allot = { ...(b.value().allotments || {}) };
      delete allot[req.params.pid];
      const eq = { ...(b.value().equipment_assignments || {}) };
      delete eq[req.params.pid];
      b.assign({ points, allotments: allot, equipment_assignments: eq }).write();
      res.json({ ok: true });
    });

    // Selected staff + Allotments + Equipment + Deploy
    app.put("/api/bandobasts/:bid/selected-staff", (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid });
      if (!b.value()) return res.status(404).json({ detail: "Not found" });
      b.assign({ selected_staff_ids: req.body.staff_ids || [] }).write();
      res.json({ ok: true, count: (req.body.staff_ids || []).length });
    });

    app.put("/api/bandobasts/:bid/allotments", (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid });
      if (!b.value()) return res.status(404).json({ detail: "Not found" });
      b.assign({ allotments: req.body.allotments || {} }).write();
      res.json({ ok: true });
    });

    app.put("/api/bandobasts/:bid/equipment-assignments", (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid });
      if (!b.value()) return res.status(404).json({ detail: "Not found" });
      b.assign({ equipment_assignments: req.body.equipment_assignments || {} }).write();
      res.json({ ok: true });
    });

    app.post("/api/bandobasts/:bid/deploy", (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid });
      if (!b.value()) return res.status(404).json({ detail: "Not found" });
      const cur = b.value();
      const allot = { ...(cur.allotments || {}) };
      const selected = new Set(cur.selected_staff_ids || []);
      const allotted = new Set();
      for (const sids of Object.values(allot)) sids.forEach((s) => allotted.add(s));
      const remaining = [...selected].filter((s) => !allotted.has(s));
      let reservedPointId = null;
      let points = [...(cur.points || [])];
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
      b.assign({ status: "deployed", points, allotments: allot }).write();
      res.json({ ok: true, status: "deployed", reserved_count: remaining.length });
    });

    // Out of District Staff
    app.post("/api/bandobasts/:bid/out-staff", (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid });
      if (!b.value()) return res.status(404).json({ detail: "Bandobast not found" });
      const p = req.body || {};
      const existing = b.value().other_district_staff || [];
      if (p.staff_type === "officer") {
        if (existing.some((s) => s.staff_type === "officer" && s.name === p.name && (s.mobile || "") === (p.mobile || "")))
          return res.status(409).json({ detail: "Officer with this Name + Mobile already exists" });
      } else {
        if (!p.bakkal_no) return res.status(400).json({ detail: "Bakkal No is required for this staff type" });
        if (existing.some((s) => s.bakkal_no === p.bakkal_no && s.staff_type === p.staff_type))
          return res.status(409).json({ detail: "Bakkal No already exists for this bandobast" });
      }
      const obj = {
        id: uuidv4(), staff_type: p.staff_type, rank: p.rank,
        bakkal_no: p.staff_type === "officer" ? "" : (p.bakkal_no || ""),
        name: p.name, posting: p.posting || "", mobile: p.mobile || "",
        gender: p.gender || "Male", district: p.district || "Other",
        category: p.category || "", is_out_district: true,
      };
      b.get("other_district_staff").push(obj).write();
      res.json(obj);
    });

    app.patch("/api/bandobasts/:bid/out-staff/:sid", (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid });
      if (!b.value()) return res.status(404).json({ detail: "Not found" });
      const list = (b.value().other_district_staff || []).map((s) => s.id === req.params.sid ? { ...s, ...req.body } : s);
      b.assign({ other_district_staff: list }).write();
      res.json({ ok: true });
    });

    app.delete("/api/bandobasts/:bid/out-staff/:sid", (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid });
      if (!b.value()) return res.status(404).json({ detail: "Not found" });
      const list = (b.value().other_district_staff || []).filter((s) => s.id !== req.params.sid);
      const sel = (b.value().selected_staff_ids || []).filter((x) => x !== req.params.sid);
      const allot = {};
      for (const [k, v] of Object.entries(b.value().allotments || {})) {
        allot[k] = v.filter((x) => x !== req.params.sid);
      }
      b.assign({ other_district_staff: list, selected_staff_ids: sel, allotments: allot }).write();
      res.json({ ok: true });
    });

    app.post("/api/bandobasts/:bid/out-staff/import/:staff_type", upload.single("file"), async (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid });
      if (!b.value()) return res.status(404).json({ detail: "Bandobast not found" });
      const { staff_type } = req.params;
      let rows;
      try { rows = await parseXlsx(req.file.buffer); } catch { return res.status(400).json({ detail: "Invalid Excel" }); }
      if (rows.length < 2) return res.json({ inserted: 0, total_rows: 0 });
      const headers = rows[0].map((h) => String(h || "").trim().toLowerCase());
      const isOff = staff_type === "officer";
      const required = isOff ? ["rank", "name"] : ["rank", "bakkal_no", "name"];
      for (const r of required) if (!headers.includes(r)) return res.status(400).json({ detail: `Missing required column: ${r}` });
      let inserted = 0, skipped_duplicate = 0, skipped_missing = 0;
      const existing = [...(b.value().other_district_staff || [])];
      for (let i = 1; i < rows.length; i++) {
        const d = {};
        headers.forEach((h, j) => { d[h] = rows[i][j] !== undefined && rows[i][j] !== null ? String(rows[i][j]).trim() : ""; });
        const missing = isOff ? (!d.name || !d.rank) : (!d.bakkal_no || !d.name || !d.rank);
        if (missing) { if (Object.values(d).some((v) => v)) skipped_missing++; continue; }
        let dup;
        if (isOff) dup = existing.find((s) => s.staff_type === "officer" && s.name === d.name && (s.mobile || "") === (d.mobile || ""));
        else dup = existing.find((s) => s.bakkal_no === d.bakkal_no && s.staff_type === staff_type);
        if (dup) { skipped_duplicate++; continue; }
        const obj = {
          id: uuidv4(), staff_type, rank: d.rank,
          bakkal_no: isOff ? "" : (d.bakkal_no || ""),
          name: d.name, posting: d.posting || "", mobile: d.mobile || "",
          gender: d.gender || "Male", district: d.district || "Other",
          category: d.category || "", is_out_district: true,
        };
        existing.push(obj);
        inserted++;
      }
      b.assign({ other_district_staff: existing }).write();
      res.json({ inserted, skipped_duplicate, skipped_missing, total_rows: rows.length - 1 });
    });

    // Bandobast-scoped staff resolver (home + OD)
    app.get("/api/bandobasts/:bid/staff/:sid", (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid }).value();
      if (!b) return res.status(404).json({ detail: "Bandobast not found" });
      const out = (b.other_district_staff || []).find((s) => s.id === req.params.sid);
      if (out) return res.json(out);
      const home = db.get("staff").find({ id: req.params.sid }).value();
      if (!home) return res.status(404).json({ detail: "Staff not found" });
      res.json(home);
    });

    // Goshwara + staff-wise export
    function resolveStaffMap(bandobast, ids) {
      const set = new Set(ids);
      const home = (db.get("staff").value() || []).filter((s) => set.has(s.id));
      const od = (bandobast.other_district_staff || []).filter((s) => set.has(s.id));
      const map = {};
      for (const s of home) map[s.id] = s;
      for (const s of od) map[s.id] = s;
      return map;
    }

    app.get("/api/bandobasts/:bid/goshwara", (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid }).value();
      if (!b) return res.status(404).json({ detail: "Not found" });
      const allIds = [...new Set(Object.values(b.allotments || {}).flat())];
      const map = resolveStaffMap(b, allIds);
      const point_wise = (b.points || []).map((p) => ({
        point: p, staff: (b.allotments[p.id] || []).map((id) => map[id]).filter(Boolean),
      }));
      const staff_wise = Object.keys(map).map((sid) => ({
        staff: map[sid],
        points: (b.points || []).filter((p) => (b.allotments[p.id] || []).includes(sid)),
      }));
      res.json({ bandobast: b, point_wise, staff_wise });
    });

    app.get("/api/bandobasts/:bid/export/staff-wise", async (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid }).value();
      if (!b) return res.status(404).json({ detail: "Not found" });
      const selected = b.selected_staff_ids || [];
      const all = [...new Set([...selected, ...Object.values(b.allotments || {}).flat()])];
      const map = resolveStaffMap(b, all);
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Amaldar-wise");
      ws.addRow(["Sr", "Type", "Rank", "Bakkal No", "Name", "Posting", "Mobile", "Gender", "District", "Category", "Allotted Points"]);
      let i = 1;
      for (const sid of selected.length ? selected : Object.keys(map)) {
        const s = map[sid]; if (!s) continue;
        const assigned = (b.points || []).filter((p) => (b.allotments[p.id] || []).includes(sid)).map((p) => p.point_name);
        ws.addRow([i++, s.staff_type, s.rank, s.bakkal_no || "", s.name, s.posting || "", s.mobile || "", s.gender, s.district, s.category || "", assigned.join(", ") || "-"]);
      }
      const safe = (b.name || "bandobast").replace(/\s+/g, "_");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=${safe}_amaldar_wise.xlsx`);
      await wb.xlsx.write(res);
      res.end();
    });

    // QR code (rich content: point info + staff + map link)
    app.get("/api/bandobasts/:bid/points/:pid/qr", async (req, res) => {
      const b = db.get("bandobasts").find({ id: req.params.bid }).value();
      if (!b) return res.status(404).json({ detail: "Not found" });
      const p = (b.points || []).find((x) => x.id === req.params.pid);
      if (!p) return res.status(404).json({ detail: "Point not found" });
      const allot = (b.allotments || {})[p.id] || [];
      const eqMap = ((b.equipment_assignments || {})[p.id]) || {};
      const map = resolveStaffMap(b, allot);
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
      const png = await QRCode.toBuffer(lines.join("\n"), { errorCorrectionLevel: "L", margin: 2, scale: 6 });
      res.setHeader("Content-Type", "image/png");
      res.end(png);
    });

    // ========== STATIC (React build) ==========
    const rendererDir = path.join(__dirname, "renderer");
    app.use(express.static(rendererDir));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) return res.status(404).json({ detail: "Not found" });
      res.sendFile(path.join(rendererDir, "index.html"));
    });

    // Find a free port starting from 38017
    const startOn = (port) => {
      const server = app.listen(port, "127.0.0.1", () => {
        // eslint-disable-next-line no-console
        console.log(`Buldhana Bandobast server running on http://127.0.0.1:${port}`);
        resolve({ port, close: () => server.close() });
      });
      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") startOn(port + 1);
        else throw err;
      });
    };
    startOn(38017);
  });
}

module.exports = { startServer };
