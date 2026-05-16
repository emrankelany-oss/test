"use client";

import { useEffect, useRef } from "react";

const FRAME_COUNT = 450;

function pickFrameSet() {
  if (typeof window === "undefined") return { dir: "/assets/v11/frames", w: 1600, h: 900 };
  const mobile = window.matchMedia("(max-width: 760px)").matches;
  return mobile
    ? { dir: "/assets/v11/frames/mobile", w: 1280, h: 720 }
    : { dir: "/assets/v11/frames", w: 1600, h: 900 };
}

function frameUrl(dir, i) {
  return `${dir}/${String(i + 1).padStart(4, "0")}.webp`;
}

export default function FrameBackdrop({ progressRef, onReady, onProgress }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const { dir, w: srcW, h: srcH } = pickFrameSet();
    const frames = new Array(FRAME_COUNT);
    let loadedCount = 0;
    let cancelled = false;

    // -------- preload pipeline -----------------------------------------
    const EAGER_HEAD = 90; // first frames needed for hero + early scroll
    const eagerPromises = [];

    const loadFrame = (i) =>
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          frames[i] = img;
          loadedCount++;
          onProgress?.(loadedCount / FRAME_COUNT);
          resolve();
        };
        img.onerror = () => {
          // count it anyway so progress doesn't stick
          loadedCount++;
          onProgress?.(loadedCount / FRAME_COUNT);
          resolve();
        };
        img.src = frameUrl(dir, i);
      });

    for (let i = 0; i < Math.min(EAGER_HEAD, FRAME_COUNT); i++) {
      eagerPromises.push(loadFrame(i));
    }

    Promise.all(eagerPromises).then(() => {
      if (cancelled) return;
      onReady?.();
      // lazy-load the rest after the eager head is ready, throttled by RAF
      let next = EAGER_HEAD;
      const queueNext = () => {
        if (cancelled) return;
        if (next >= FRAME_COUNT) return;
        // launch a small batch then yield to RAF
        const batch = Math.min(6, FRAME_COUNT - next);
        for (let k = 0; k < batch; k++) loadFrame(next + k);
        next += batch;
        requestAnimationFrame(queueNext);
      };
      requestAnimationFrame(queueNext);
    });

    // -------- canvas sizing + draw state -------------------------------
    let raf = 0;
    let lastDrawn = -1;
    const sizeState = { w: 0, h: 0, dpr: 1 };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeState.w = w;
      sizeState.h = h;
      sizeState.dpr = dpr;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastDrawn = -1;
    };
    resize();
    window.addEventListener("resize", resize);

    const findNearestLoaded = (idx) => {
      if (frames[idx]) return idx;
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (idx - d >= 0 && frames[idx - d]) return idx - d;
        if (idx + d < FRAME_COUNT && frames[idx + d]) return idx + d;
      }
      return -1;
    };

    const draw = () => {
      const p = progressRef.current || 0;
      const target = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.round(p * (FRAME_COUNT - 1))),
      );
      const idx = findNearestLoaded(target);
      if (idx !== -1 && idx !== lastDrawn) {
        const img = frames[idx];
        const cw = sizeState.w;
        const ch = sizeState.h;
        const iw = img.naturalWidth || srcW;
        const ih = img.naturalHeight || srcH;
        const r = Math.max(cw / iw, ch / ih); // object-fit: cover
        const dw = iw * r;
        const dh = ih * r;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;
        ctx.fillStyle = "#04060a";
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, dx, dy, dw, dh);
        lastDrawn = idx;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      // drop refs so the GC can reclaim large image buffers
      for (let i = 0; i < frames.length; i++) frames[i] = null;
    };
  }, [progressRef, onReady, onProgress]);

  return <canvas ref={canvasRef} className="v11-backdrop" aria-hidden="true" />;
}

export { FRAME_COUNT };
