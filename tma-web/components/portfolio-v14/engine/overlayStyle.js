import { blurAmount, zoomScale, colorBleedAlpha } from "./transitions.js";

const VEL_REF = 3000;
const VEL_GAIN = 0.6;

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}
function triangle(t) {
  const c = clamp01(t);
  return 1 - Math.abs(2 * c - 1);
}
function parseHex(c) {
  if (typeof c !== "string") return null;
  let h = c.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
function toHex(rgb) {
  return (
    "#" +
    rgb
      .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * t: boundary blend 0→1. velocity: ScrollTrigger.getVelocity() (px/s, signed).
 * Returns the overlay's per-frame style numbers. Inert at the endpoints so the
 * veil is invisible inside scenes (no hard cut, no lingering wash).
 */
export function overlayStyle(t, velocity, fromColor, toColor) {
  if (t <= 0 || t >= 1) {
    return { blurPx: 0, scale: 1, bleedColor: "#000000", bleedAlpha: 0, opacity: 0 };
  }
  const vMul = 1 + Math.min(Math.abs(velocity || 0) / VEL_REF, 1) * VEL_GAIN;
  const from = parseHex(fromColor) || [0, 0, 0];
  const to = parseHex(toColor) || [0, 0, 0];
  const k = clamp01(t);
  const bleed = [0, 1, 2].map((i) => from[i] + (to[i] - from[i]) * k);
  return {
    blurPx: +(blurAmount(t) * vMul).toFixed(3),
    scale: zoomScale(t),
    bleedColor: toHex(bleed),
    bleedAlpha: +(colorBleedAlpha(t) * vMul).toFixed(4),
    opacity: +triangle(t).toFixed(4),
  };
}
