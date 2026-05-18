import { TOTAL_FRAMES } from "../engine/frameSequence.js";
// Deterministic offscreen "film" for e2e: a frame-index counter + a dot that
// travels left→right, so Playwright can assert that frames advance with scroll.
// Mirrors the v14 procedural-source pattern.
export function createV16ProceduralSource(count = TOTAL_FRAMES) {
  const W = 1280;
  const H = 720;
  const cache = new Map();

  function drawProcedural(index) {
    if (cache.has(index)) return cache.get(index);
    const cv =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(W, H)
        : Object.assign(document.createElement("canvas"), { width: W, height: H });
    const ctx = cv.getContext("2d");
    const t = count > 1 ? index / (count - 1) : 0;
    const hue = Math.round(210 + t * 40); // electric-blue band
    ctx.fillStyle = `hsl(${hue}, 80%, ${8 + t * 10}%)`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(120,180,255,0.95)";
    ctx.font = "bold 220px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(index), W / 2, H / 2);
    ctx.beginPath();
    ctx.arc(40 + t * (W - 80), H - 60, 26, 0, Math.PI * 2);
    ctx.fillStyle = "#7db4ff";
    ctx.fill();
    cache.set(index, cv);
    return cv;
  }

  return { count, width: W, height: H, drawProcedural };
}
