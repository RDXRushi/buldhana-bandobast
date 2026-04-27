import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getMobile } from "../api";
import { pollOnce } from "../notify";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const mobile = await getMobile();
      const data = await api.alerts(mobile);
      setAlerts(data || []);
      // also trigger any local notifications for fresh items
      await pollOnce();
    } catch (e) {
      setErr(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="app-header">
        <div style={{ flex: 1 }}>
          <h1>Bandobast Alerts</h1>
          <div className="sub">बंदोबस्त सूचना</div>
        </div>
        <button onClick={load} className="btn-outline" style={{ background: "transparent", color: "white", padding: 8, border: "1px solid rgba(255,255,255,0.4)", borderRadius: 6 }}>
          ↻
        </button>
      </div>
      <div className="scroll-area">
        {loading && <div className="empty">Loading…</div>}
        {err && <div className="card" style={{ color: "#b91c1c" }}>{err}</div>}
        {!loading && !err && alerts.length === 0 && (
          <div className="empty">
            <div style={{ fontSize: 38 }}>🔔</div>
            <div style={{ marginTop: 8, fontWeight: 600 }}>No alerts yet</div>
            <div style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 4 }}>
              You will be notified when your duty in charge sends a bandobast alert.
            </div>
          </div>
        )}
        {alerts.map((a) => (
          <button
            key={`${a.bandobast_id}-${a.sent_at}`}
            className="card"
            style={{ width: "100%", textAlign: "left", display: "block" }}
            onClick={() => nav(`/bandobast/${a.bandobast_id}`)}
            data-testid={`alert-${a.bandobast_id}`}
          >
            <div className="row-between">
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{a.bandobast_name}</div>
                <div style={{ color: "var(--gray-500)", fontSize: 13, marginTop: 4 }}>
                  📅 {new Date(a.bandobast_date).toLocaleDateString()}
                </div>
                <div style={{ color: "var(--gray-500)", fontSize: 11, marginTop: 6 }}>
                  Sent: {new Date(a.sent_at).toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {!a.seen && <span className="badge badge-saffron">NEW</span>}
                <div style={{ marginTop: 6, fontSize: 18 }}>›</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
