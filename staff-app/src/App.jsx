import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import AlertsPage from "./pages/AlertsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import BandobastDetailPage from "./pages/BandobastDetailPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import { getMobile } from "./api";
import { startPolling, stopPolling } from "./notify";

function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();
  if (loc.pathname.startsWith("/login") || loc.pathname.startsWith("/settings") || loc.pathname.startsWith("/bandobast/")) return null;
  const tabs = [
    { path: "/alerts", label: "Alerts", icon: "🔔" },
    { path: "/profile", label: "Profile", icon: "👤" },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <button key={t.path}
          className={loc.pathname.startsWith(t.path) ? "active" : ""}
          onClick={() => nav(t.path)}
        >
          <span className="icon">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      const m = await getMobile();
      setAuthed(!!m);
      setAuthChecked(true);
      if (m) startPolling();
    })();
    return () => stopPolling();
  }, []);

  if (!authChecked) {
    return <div className="app-shell"><div className="empty">Loading…</div></div>;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/login" element={<LoginPage onAuthed={() => { setAuthed(true); startPolling(); }} />} />
        <Route path="/alerts" element={authed ? <AlertsPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={authed ? <ProfilePage onLogout={() => { setAuthed(false); stopPolling(); }} /> : <Navigate to="/login" />} />
        <Route path="/bandobast/:bid" element={authed ? <BandobastDetailPage /> : <Navigate to="/login" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to={authed ? "/alerts" : "/login"} />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
