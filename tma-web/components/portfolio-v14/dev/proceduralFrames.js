// Generates a deterministic offscreen-canvas "film": shifting hue gradient,
// a large frame-index counter, and a dot that travels left→right across frames.
// Frame advance is visually unambiguous, so Playwright can assert it.
export function createProceduralSource(count = 180) {
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
    const hue = Math.round(t * 320);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, `hsl(${hue}, 70%, 18%)`);
    g.addColorStop(1, `hsl(${(hue + 80) % 360}, 70%, 42%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 220px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(index), W / 2, H / 2);
    ctx.beginPath();
    ctx.arc(40 + t * (W - 80), H - 60, 26, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    cache.set(index, cv);
    return cv;
  }

  return { count, width: W, height: H, drawProcedural };
}
