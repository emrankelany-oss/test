// Ported from Obsidian Assembly (docs/obsidian-assembly-parallax-section2.md).
// Desktop: a = sign * factor * vh * (progress - 0.5), progress clamped to [0,1].
// Disabled at viewport width <= 1024 (OA parity).

export function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function parallaxOffset({ progress, factor, vh, sign = 1, viewportWidth = 1280 }) {
  if (viewportWidth <= 1024) return 0;
  const p = clamp01(progress);
  return sign * factor * vh * (p - 0.5);
}

export function transform3d(px) {
  return `translate3d(0, ${px}px, 0)`;
}
