"use client";
import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 180;
const FRAME_VERSION = "v3-dark";
const FRAME_PATH = (i) =>
  `/assets/v3/frames/frame-${String(i + 1).padStart(3, "0")}.webp?${FRAME_VERSION}`;

const clamp01 = (t) => Math.max(0, Math.min(1, t));
const lerp = (a, b, t) => a + (b - a) * t;
const remap = (x, a, b) => clamp01((x - a) / (b - a));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function V3PersistentM() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const loadedRef = useRef(0);
  const lastFrameRef = useRef(-1);
  const rafRef = useRef(0);
  const drawRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    framesRef.current = new Array(FRAME_COUNT);
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      const done = () => {
        if (cancelled) return;
        loadedRef.current += 1;
        if (loadedRef.current === 4) setReady(true);
        if (drawRef.current) drawRef.current();
      };
      img.onload = done;
      img.onerror = done;
      img.src = FRAME_PATH(i);
      framesRef.current[i] = img;
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    const size = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      lastFrameRef.current = -1;
    };
    size();

    const draw = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const deckEnd = vh + vh * 4;
      const fadeOutStart = deckEnd - vh * 0.55;
      const fadeOutEnd = deckEnd - vh * 0.1;

      const y = window.scrollY;

      const tPos = clamp01(y / deckEnd);
      const tEased = easeInOut(tPos);

      const xStart = vw * 0.2;
      const xEnd = -vw * 0.22;
      const yStart = 0;
      const yEnd = vh * 0.06;

      const tx = lerp(xStart, xEnd, tEased);
      const ty = lerp(yStart, yEnd, tEased);

      const scaleStart = 1;
      const scaleEnd = 0.84;
      const sc = lerp(scaleStart, scaleEnd, tEased);

      const opOut = 1 - remap(y, fadeOutStart, fadeOutEnd);
      const opacity = opOut;

      container.style.opacity = opacity.toFixed(3);
      container.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(
        1
      )}px, 0) scale(${sc.toFixed(3)})`;

      const frameIdx = Math.min(
        FRAME_COUNT - 1,
        Math.floor(tPos * (FRAME_COUNT - 1))
      );
      const img = framesRef.current[frameIdx];
      if (img && img.complete && img.naturalWidth > 0) {
        if (frameIdx !== lastFrameRef.current) {
          const w = canvas.width / DPR;
          const h = canvas.height / DPR;
          ctx.clearRect(0, 0, w, h);
          const iw = img.naturalWidth;
          const ih = img.naturalHeight;
          const ratio = Math.min(w / iw, h / ih);
          const dw = iw * ratio;
          const dh = ih * ratio;
          const dx = (w - dw) / 2;
          const dy = (h - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
          lastFrameRef.current = frameIdx;
        }
      }
    };

    drawRef.current = draw;

    const tick = () => {
      draw();
      rafRef.current = 0;
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
    };

    const onResize = () => {
      size();
      draw();
    };

    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      drawRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`v3-persistent-m ${ready ? "is-ready" : ""}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
