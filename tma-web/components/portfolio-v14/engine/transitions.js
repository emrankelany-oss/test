// t: 0 = fully scene A, 1 = fully scene B.
// `tri` is a triangle wave: 0 at the ends, 1 at the midpoint (blur-to-sharp shape).
function tri(t) {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.abs(2 * c - 1);
}

export function blurAmount(t, maxBlur = 16) {
  return Math.round(tri(t) * maxBlur);
}

export function zoomScale(t, maxZoom = 0.08) {
  return 1 + tri(t) * maxZoom;
}

export function colorBleedAlpha(t, maxAlpha = 0.5) {
  return +(tri(t) * maxAlpha).toFixed(4);
}

export function crossfadeOpacity(t) {
  const c = Math.min(1, Math.max(0, t));
  return { a: 1 - c, b: c };
}
