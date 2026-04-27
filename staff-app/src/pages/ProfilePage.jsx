import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { api, getMobile, clearAuth } from "../api";

export default function ProfilePage({ onLogout }) {
  const [me, setMe] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const load = async () => {
    const mobile = await getMobile();
    try {
      const data = await api.me(mobile);
      setMe(data);
      setForm(data);
    } catch (e) {
      // mobile no longer valid in backend — log out
      await clearAuth();
      onLogout && onLogout();
      nav("/login");
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    try {
      const mobile = await getMobile();
      const payload = {};
      for (const k of ["name", "rank", "posting", "gender", "district", "category", "photo"]) {
        if (form[k] !== undefined) payload[k] = form[k];
      }
      const updated = await api.updateMe(mobile, payload);
      setMe(updated);
      setForm(updated);
      setEdit(false);
    } catch (e) {
      alert(e.response?.data?.detail || e.message);
    } finally {
      setBusy(false);
    }
  };

  const capturePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 480, height: 600,
      });
      setForm((f) => ({ ...f, photo: photo.dataUrl }));
    } catch (e) {
      // user cancelled or no permission
    }
  };

  const logout = async () => {
    if (!window.confirm("Sign out?")) return;
    await clearAuth();
    onLogout && onLogout();
    nav("/login");
  };

  if (!me) return <div className="empty">Loading…</div>;

  return (
    <>
      <div className="app-header">
        <div style={{ flex: 1 }}>
          <h1>My Profile</h1>
          <div className="sub">माझी माहिती</div>
        </div>
        {!edit ? (
          <button onClick={() => setEdit(true)} style={{ background: "transparent", color: "white", padding: "6px 12px", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 6 }}>Edit</button>
        ) : null}
      </div>
      <div className="scroll-area">
        <div className="card" style={{ textAlign: "center" }}>
          <div className="avatar" style={{ width: 100, height: 100, margin: "0 auto", fontSize: 36 }}>
            {form.photo ? <img src={form.photo} alt="me" /> : (me.name?.[0]?.toUpperCase() || "?")}
          </div>
          {edit && (
            <button className="btn btn-outline" style={{ marginTop: 12, width: "auto" }} onClick={capturePhoto}>
              📷 Capture Photo
            </button>
          )}
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 12 }}>{me.name}</div>
          <div className="badge" style={{ marginTop: 6 }}>{me.staff_type} · {me.rank}</div>
        </div>

        {!edit ? (
          <div className="card">
            <Field label="Mobile / मोबाईल" value={me.mobile} note="Locked — managed by admin" />
            <Field label="Bakkal No / बक्कल" value={me.bakkal_no || "—"} />
            <Field label="Posting / पोस्टिंग" value={me.posting || "—"} />
            <Field label="Gender / लिंग" value={me.gender || "—"} />
            <Field label="District / जिल्हा" value={me.district || "—"} />
            <Field label="Category / प्रवर्ग" value={me.category || "—"} />
          </div>
        ) : (
          <div className="card">
            <EditField label="Name / नाव"      value={form.name}     onChange={(v) => setForm({ ...form, name: v })} />
            <EditField label="Rank / पद"       value={form.rank}     onChange={(v) => setForm({ ...form, rank: v })} />
            <EditField label="Posting / पोस्टिंग" value={form.posting}  onChange={(v) => setForm({ ...form, posting: v })} />
            <EditField label="Gender / लिंग"    value={form.gender}   onChange={(v) => setForm({ ...form, gender: v })} />
            <EditField label="District / जिल्हा" value={form.district} onChange={(v) => setForm({ ...form, district: v })} />
            <EditField label="Category / प्रवर्ग" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button className="btn btn-outline" onClick={() => { setEdit(false); setForm(me); }}>Cancel</button>
              <button className="btn btn-green" onClick={save} disabled={busy} data-testid="save-profile-btn">{busy ? "Saving…" : "Save"}</button>
            </div>
          </div>
        )}

        <button className="btn btn-outline" onClick={() => nav("/settings")} style={{ marginTop: 12 }}>⚙ Backend Settings</button>
        <button className="btn btn-outline" onClick={logout} style={{ marginTop: 8, color: "#b91c1c" }} data-testid="logout-btn">Logout</button>
      </div>
    </>
  );
}

function Field({ label, value, note }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {note && <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 2 }}>{note}</div>}
    </div>
  );
}

function EditField({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="label">{label}</div>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
