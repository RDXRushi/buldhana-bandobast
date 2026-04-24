/**
 * Local IndexedDB database (Dexie) — mirrors the MongoDB collections used by
 * the FastAPI backend. Used by the Android build to provide a fully-offline
 * experience with no HTTP server.
 */
import Dexie from "dexie";

export const db = new Dexie("buldhana_bandobast");

// Schema v1 — indexed fields enable fast lookups; everything else is stored
// inside the row object.
db.version(1).stores({
  staff: "id, staff_type, rank, bakkal_no, name, mobile, created_at",
  bandobasts: "id, date, name, status, deleted, created_at",
});

export default db;
