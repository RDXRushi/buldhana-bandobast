import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, setMobile, getBaseUrl } from "../api";
import BrandLogo from "../components/BrandLogo";

export default function LoginPage({ onAuthed }) {
  const [mobile, setMobileVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [base, setBase] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    getBaseUrl().then((b) => setBase(b));
  }, []);

  const submit = async (e) => {
    e?.preventDefault?.();
    setErr("");
    const trimmed = (mobile || "").replace(/\D/g, "").slice(-10);
    if (trimmed.length !== 10) {
      setErr("Enter a valid 10-digit mobile number");
      return;
    }
    setBusy(true);
    try {
      await api.login(trimmed);
      await setMobile(trimmed);
      onAuthed && onAuthed();
      nav("/alerts");
    } catch (e2) {
      setErr(e2.response?.data?.detail || e2.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="app-header">
        <BrandLogo size={40} bg="#FFFFFF" style={{ marginRight: 10 }} />
        <div>
          <h1>Buldhana Police</h1>
          <div className="sub">डिजिटल पोलीस बंदोबस्त — Staff App</div>
        </div>
      </div>
      <div className="scroll-area" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Sign in</h2>
          <p style={{ color: "var(--gray-500)", fontSize: 14, marginBottom: 18 }}>
            Enter the mobile number that your in-charge officer has on record.
            <br />
            <em style={{ color: "var(--gray-700)" }}>आपल्या नोंदीतील मोबाईल क्रमांक टाका.</em>
          </p>
          <form onSubmit={submit}>
            <div className="label">Mobile / मोबाईल</div>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={15}
              autoFocus
              value={mobile}
              onChange={(e) => setMobileVal(e.target.value)}
              placeholder="9999999999"
              data-testid="mobile-input"
            />
            {err && <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 8 }}>{err}</div>}
            <button className="btn btn-green" style={{ marginTop: 18 }} disabled={busy} data-testid="login-btn">
              {busy ? "Checking…" : "Login / प्रवेश"}
            </button>
          </form>
        </div>
        <button className="btn btn-outline" onClick={() => nav("/settings")} style={{ marginTop: 8 }}>
          ⚙ Settings {base ? "" : "(Backend not set)"}
        </button>
        <div style={{ textAlign: "center", color: "var(--gray-500)", fontSize: 11, marginTop: 24 }}>
          © 2026 Buldhana District Police
        </div>
      </div>
    </>
  );
}
