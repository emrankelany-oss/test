import { coverFit } from "./frameMath.js";

/**
 * FrameRenderer interface (SP-4 may add a WebGLRenderer satisfying the same shape):
 *   mount(canvasEl)               attach + acquire context
 *   resize(w, h, dpr)             size backing store, recompute on next draw
 *   draw(source, { filter, tint }) paint one frame (source: ImageBitmap | HTMLCanvasElement)
 *   destroy()                     release resources
 */
export class Canvas2DRenderer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
  }

  mount(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext("2d", { alpha: false });
  }

  resize(w, h, dpr = 1) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    if (this.canvas) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";
    }
  }

  draw(source, opts = {}) {
    const { ctx } = this;
    if (!ctx || !source) return;
    const sw = source.width;
    const sh = source.height;
    const dw = this.canvas.width;
    const dh = this.canvas.height;
    ctx.save();
    ctx.filter = opts.filter ? `blur(${opts.filter}px)` : "none";
    ctx.clearRect(0, 0, dw, dh);
    const f = coverFit(sw, sh, dw, dh);
    ctx.drawImage(source, f.dx, f.dy, f.dw, f.dh);
    if (opts.tint && opts.tintAlpha > 0) {
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = opts.tintAlpha;
      ctx.fillStyle = opts.tint;
      ctx.fillRect(0, 0, dw, dh);
    }
    ctx.restore();
  }

  destroy() {
    this.canvas = null;
    this.ctx = null;
  }
}
