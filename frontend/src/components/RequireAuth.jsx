import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const raw = typeof window !== "undefined" ? localStorage.getItem("bdpol_auth") : null;
  if (!raw) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
