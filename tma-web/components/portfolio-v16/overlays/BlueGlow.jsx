"use client";
import { forwardRef } from "react";

// Soft electric-blue glow. Parent applies mouse-parallax transform via ref.
const BlueGlow = forwardRef(function BlueGlow(_props, ref) {
  return (
    <div
      ref={ref}
      aria-hidden
      className="v16-loader-glow"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        willChange: "transform",
        background:
          "radial-gradient(40% 38% at 50% 46%, rgba(56,132,255,0.32) 0%, rgba(56,132,255,0.10) 45%, rgba(0,0,0,0) 72%)",
      }}
    />
  );
});

export default BlueGlow;
