import React, { useEffect, useState } from "react";
import { getPointQRSrc, IS_LOCAL } from "../lib/api";

/**
 * Renders the QR PNG for a given (bandobast, point). Works both against the
 * remote FastAPI endpoint (web) and the local IndexedDB shim (Android).
 *
 * Props: bid, pid, className, alt
 */
export default function PointQR({ bid, pid, className, alt }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await getPointQRSrc(bid, pid);
        if (active) setSrc(s);
      } catch (_) {
        if (active) setSrc("");
      }
    })();
    return () => { active = false; };
  }, [bid, pid]);

  if (!src) {
    return (
      <div
        className={className}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 12 }}
      >
        QR…
      </div>
    );
  }
  return <img src={src} alt={alt || "QR"} className={className} />;
}

/** Trigger a download of the QR PNG. Works in both modes. */
export async function downloadPointQR(bid, pid, filename = "qr.png") {
  const src = await getPointQRSrc(bid, pid);
  if (IS_LOCAL) {
    // data URL -> convert to blob and trigger download
    const res = await fetch(src);
    const blob = await res.blob();
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 5000);
  } else {
    window.open(src, "_blank");
  }
}
