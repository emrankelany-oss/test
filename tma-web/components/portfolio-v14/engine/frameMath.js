export function frameIndexFor(progress, count) {
  if (count <= 0) return 0;
  const p = Math.min(1, Math.max(0, progress));
  return Math.min(count - 1, Math.max(0, Math.round(p * (count - 1))));
}

export function preloadWindow(index, count, ahead = 20, behind = 5) {
  if (count <= 0) return [];
  const start = Math.max(0, index - behind);
  const end = Math.min(count - 1, index + ahead);
  const out = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

export function coverFit(srcW, srcH, dstW, dstH) {
  if (srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) {
    return { dx: 0, dy: 0, dw: dstW, dh: dstH };
  }
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  return { dx: (dstW - dw) / 2, dy: (dstH - dh) / 2, dw, dh };
}
