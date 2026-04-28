import React from "react";
import logo from "../assets/maharashtra-police-logo.png";

export default function BrandLogo({ size = 40, bg = "#FFFFFF", style = {} }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: bg || "transparent",
        overflow: "hidden",
        ...style,
      }}
      aria-label="Maharashtra Police"
    >
      <img
        src={logo}
        alt="Maharashtra Police"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </span>
  );
}
