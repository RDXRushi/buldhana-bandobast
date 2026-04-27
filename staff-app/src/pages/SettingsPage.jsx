import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBaseUrl, setBaseUrl } from "../api";

export default function SettingsPage() {
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const nav = useNavigate();

  useEffect(() => { getBaseUrl().then(setUrl); }, []);

  const save = async () => {
    const v = (url || "").trim().replace(/\/$/, "");
    if (!v.startsWith("http")) {
      alert("URL must start with http:// or https://");
      return;
    }
    await setBaseUrl(v);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <div className="app-header">
        <button onClick={() => nav(-1)} style={{ background: "transparent", color: "white", border: "none", fontSize: 22, marginRight: 6 }}>‹</button>
        <h1>Settings</h1>
      </div>
      <div className="scroll-area">
        <div className="card">
          <div className="label">Backend Server URL</div>
          <input
            type="url"
            placeholder="https://your-admin.example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            data-testid="backend-url-input"
          />
          <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 8 }}>
            Ask your station in-charge for the correct URL of the Buldhana Bandobast admin server.
          </div>
          <button className="btn btn-green" style={{ marginTop: 14 }} onClick={save} data-testid="save-url-btn">
            {saved ? "✓ Saved" : "Save"}
          </button>
        </div>
        <div style={{ textAlign: "center", color: "var(--gray-500)", fontSize: 11, marginTop: 14 }}>
          v1.0.0 · Buldhana Police
        </div>
      </div>
    </>
  );
}
