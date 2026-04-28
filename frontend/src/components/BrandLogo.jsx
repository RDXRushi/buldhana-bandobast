import React from "react";
import logo from "../assets/maharashtra-police-logo.png";

/**
 * Maharashtra Police brand logo. Used wherever the previous lucide <Shield>
 * icon represented the police brand (sidebar, login, ID card, duty pass,
 * goshwara, etc.). Decorative stat icons (ShieldPlus, ShieldCheck) are NOT
 * replaced — those convey "add" / "verified", not branding.
 *
 * Props:
 *   size      — pixel size (square). Default 28.
 *   bg        — optional background color for the circular wrapper. Pass
 *               `null` (or `false`) to render the image with a transparent
 *               background (recommended for printable reports).
 *   className — extra classes for the wrapper.
 */
export default function BrandLogo({ size = 28, bg = "#FFFFFF", className = "", style = {} }) {
  const wrapStyle = {
    width: size,
    height: size,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: size / 2,
    background: bg || "transparent",
    overflow: "hidden",
    ...style,
  };
  return (
    <span className={className} style={wrapStyle} aria-label="Maharashtra Police">
      <img
        src={logo}
        alt="Maharashtra Police"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        draggable={false}
      />
    </span>
  );
}
