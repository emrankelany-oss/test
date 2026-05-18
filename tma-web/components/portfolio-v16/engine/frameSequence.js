// V16 frame-sequence configuration + pure helpers.
// Pure module: no DOM, no React — safe to unit-test under node:test.

export const TOTAL_FRAMES = 192;
export const FRAME_PATH = "/assets/v16/frames/frame-";
export const FRAME_EXT = "webp";
export const PAD = 3;

export const PIN_VIEWPORTS = 3; // 300vh pin
export const SCRUB_EASE = 0.12; // displayed → target lerp per rAF tick
export const PRELOAD_PRIORITY = 30; // loading gate clears after first N decoded
export const PRELOAD_CONCURRENCY = 6; // background fetch parallelism
export const EXPLOSION_RANGE = [0.58, 0.7]; // glow + screen-shake band

export const TEXT_BEATS = {
  label: 0.08, // THE MOTION AGENCY
  headline1: 0.2, // WE DON'T BUILD BRANDS.
  headline2: 0.38, // WE RELEASE MOMENTUM.
  explosion: 0.62, // glow + screen shake (band center)
  fadeOut: 0.82, // hero text fades, frames dominate
  archive: 0.92, // ENTER THE ARCHIVE
};

export function clamp(v, lo, hi) {
  if (v !== v) return lo; // NaN guard — keep frame index finite
  return v < lo ? lo : v > hi ? hi : v;
}

// t is unclamped — extrapolation is intentional for smooth animation overshoot.
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function progressToIndex(progress, total = TOTAL_FRAMES) {
  if (total <= 0) return 0;
  const p = clamp(progress, 0, 1);
  return Math.round(p * (total - 1));
}

export function indexToUrl(
  index,
  { path = FRAME_PATH, ext = FRAME_EXT, pad = PAD } = {}
) {
  return `${path}${String(index + 1).padStart(pad, "0")}.${ext}`;
}

// object-fit: cover for canvas drawImage. Returns the dest rect.
export function coverFit(sw, sh, dw, dh) {
  if (!sw || !sh || !dw || !dh) return { dx: 0, dy: 0, dw, dh };
  const scale = Math.max(dw / sw, dh / sh);
  const w = sw * scale;
  const h = sh * scale;
  return { dx: (dw - w) / 2, dy: (dh - h) / 2, dw: w, dh: h };
}
