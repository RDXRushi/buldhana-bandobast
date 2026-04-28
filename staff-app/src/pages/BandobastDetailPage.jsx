import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, getMobile } from "../api";
import BrandLogo from "../components/BrandLogo";

export default function BandobastDetailPage() {
  const { bid } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const mobile = await getMobile();
        const d = await api.bandobast(bid, mobile);
        setData(d);
        await api.markSeen(bid, mobile).catch(() => {});
        if (d.point) {
          setQrUrl(await api.qrUrl(bid, d.point.id));
        }
      } catch (e) {
        setErr(e.response?.data?.detail || e.message);
      }
    })();
  }, [bid]);

  if (err) return (
    <>
      <div className="app-header"><button onClick={() => nav(-1)} style={{ background: "transparent", color: "white", border: "none", fontSize: 20 }}>‹</button><h1 style={{ marginLeft: 8 }}>Error</h1></div>
      <div className="scroll-area"><div className="card" style={{ color: "#b91c1c" }}>{err}</div></div>
    </>
  );
  if (!data) return <div className="empty">Loading…</div>;

  const { bandobast: b, me, point, equipment_for_me, co_staff, map_url } = data;

  return (
    <>
      <div className="app-header">
        <button onClick={() => nav(-1)} style={{ background: "transparent", color: "white", border: "none", fontSize: 22, marginRight: 6 }}>‹</button>
        <div style={{ flex: 1 }}>
          <h1>{b.name}</h1>
          <div className="sub">{new Date(b.date).toLocaleDateString()} · {b.spot}</div>
        </div>
      </div>
      <div className="scroll-area">

        {/* Bandobast Info */}
        <div className="card">
          <div className="row-between" style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Bandobast Briefing</h2>
            <span className="badge badge-green">DEPLOYED</span>
          </div>
          <div className="split">
            <Field label="Date" value={new Date(b.date).toLocaleDateString()} />
            <Field label="Spot" value={b.spot || "—"} />
            <Field label="In-charge" value={b.in_charge || "—"} />
            <Field label="PS" value={b.ps_name || "—"} />
          </div>
        </div>

        {/* My Point */}
        {point ? (
          <div className="card">
            <div className="row-between" style={{ marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>📍 My Point</h2>
              {point.is_reserved && <span className="badge badge-saffron">RESERVED</span>}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{point.point_name}</div>
            {point.sector && <div style={{ color: "var(--gray-500)", fontSize: 13 }}>Sector: {point.sector}</div>}
            {map_url && (
              <a className="btn btn-primary" style={{ marginTop: 14 }} href={map_url} target="_blank" rel="noopener noreferrer">
                🗺 Open Location in Google Maps
              </a>
            )}
            <div style={{ marginTop: 16 }}>
              {equipment_for_me && (
                <Field label="My Equipment" value={equipment_for_me} />
              )}
              {(point.equipment || []).length > 0 && (
                <Field label="Point Equipment" value={point.equipment.join(", ")} />
              )}
              {point.suchana && (
                <div style={{ marginTop: 12 }}>
                  <div className="label">Sucнana / सूचना</div>
                  <div style={{ background: "var(--gray-50)", padding: 12, borderRadius: 6, fontSize: 14 }}>
                    {point.suchana}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ background: "#fff3cd", borderColor: "#fbe2a4" }}>
            ⚠️ You are not yet allotted to a point in this bandobast. Please contact your in-charge.
          </div>
        )}

        {/* QR / Duty Pass */}
        {point && qrUrl && (
          <div className="qr-card">
            <h2 style={{ margin: "0 0 8px 0", fontSize: 16 }}>Duty Pass QR</h2>
            <img src={qrUrl} alt="QR" />
            <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 6 }}>Show this at checkpoint</div>
          </div>
        )}

        {/* ID Card preview */}
        <div className="card" style={{ background: "linear-gradient(135deg, #FF9933, #E68A2E)", color: "white" }}>
          <div style={{ fontSize: 11, opacity: 0.9, display: "flex", alignItems: "center", gap: 6 }}>
            <BrandLogo size={20} bg="rgba(255,255,255,0.95)" />
            BULDHANA POLICE — ID CARD
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <div className="avatar" style={{ width: 64, height: 64, background: "rgba(255,255,255,0.25)", color: "white" }}>
              {me.photo ? <img src={me.photo} alt="me" /> : (me.name?.[0]?.toUpperCase() || "?")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{me.name}</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>{me.rank} {me.bakkal_no ? `· B${me.bakkal_no}` : ""}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>{me.posting}</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>📞 {me.mobile}</div>
            </div>
          </div>
        </div>

        {/* Co-staff */}
        {co_staff && co_staff.length > 0 && (
          <div className="card">
            <h2 style={{ margin: "0 0 10px 0", fontSize: 16 }}>👥 With Me at this Point</h2>
            {co_staff.map((s) => (
              <div key={s.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--gray-100)" }}>
                <div className="avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                  {s.photo ? <img src={s.photo} alt="" /> : (s.name?.[0]?.toUpperCase() || "?")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                    {s.rank}{s.bakkal_no ? ` · B${s.bakkal_no}` : ""}{s.mobile ? ` · ${s.mobile}` : ""}
                  </div>
                  {s.equipment && <div style={{ fontSize: 11, color: "var(--saffron-dark)" }}>🎒 {s.equipment}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
