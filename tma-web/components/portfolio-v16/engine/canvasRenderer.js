import { coverFit } from "./frameSequence.js";

/**
 * Canvas2D renderer. mount() once, resize() on layout change, draw(source)
 * per frame. `source` is any CanvasImageSource with numeric width/height
 * (ImageBitmap or HTMLCanvasElement). Paints object-fit: cover, no stretch.
 */
export function createCanvasRenderer() {
  let canvas = null;
  let ctx = null;

  return {
    mount(el) {
      canvas = el;
      ctx = el.getContext("2d", { alpha: false });
    },
    resize(w, h, dpr = 1) {
      if (!canvas) return;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
    },
    draw(source) {
      if (!ctx || !canvas || !source) return;
      const dw = canvas.width;
      const dh = canvas.height;
      const f = coverFit(source.width, source.height, dw, dh);
      ctx.clearRect(0, 0, dw, dh);
      ctx.drawImage(source, f.dx, f.dy, f.dw, f.dh);
    },
    destroy() {
      canvas = null;
      ctx = null;
    },
  };
}
