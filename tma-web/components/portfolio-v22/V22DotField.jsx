"use client";
import { useEffect, useRef } from "react";

// Deterministic positions (no SSR randomness). x/y are percentages within the box.
const DOTS = [
  { x: 12, y: 22, c: "#6fd3ff" }, { x: 28, y: 64, c: "#2f86d8" },
  { x: 41, y: 14, c: "#9fc6ee" }, { x: 53, y: 48, c: "#6fd3ff" },
  { x: 66, y: 28, c: "#ffffff" }, { x: 74, y: 70, c: "#2f86d8" },
  { x: 86, y: 38, c: "#6fd3ff" }, { x: 19, y: 84, c: "#9fc6ee" },
  { x: 60, y: 82, c: "#6fd3ff" }, { x: 92, y: 16, c: "#2f86d8" },
  { x: 8, y: 52, c: "#9fc6ee" }, { x: 36, y: 36, c: "#ffffff" },
  { x: 48, y: 74, c: "#6fd3ff" }, { x: 80, y: 58, c: "#9fc6ee" },
];

export default function V22DotField() {
  const wrapRef = useRef(null);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dots = Array.from(wrap.querySelectorAll(".v22-dot"));
    const onMove = (e) => {
      const r = wrap.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      dots.forEach((d, i) => {
        const depth = ((i % 5) + 1) / 18;
        d.style.transform = `translate3d(${(mx * depth).toFixed(1)}px, ${(my * depth).toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <div ref={wrapRef} className="v22-dotfield" aria-hidden="true">
      {DOTS.map((d, i) => (
        <span key={i} className="v22-dot"
          style={{ left: `${d.x}%`, top: `${d.y}%`, background: d.c }} />
      ))}
    </div>
  );
}
