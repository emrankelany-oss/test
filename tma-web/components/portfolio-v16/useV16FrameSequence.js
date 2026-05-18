"use client";
import { useEffect, useRef, useState } from "react";
import {
  TOTAL_FRAMES,
  SCRUB_EASE,
  progressToIndex,
  lerp,
} from "./engine/frameSequence.js";
import { createCanvasRenderer } from "./engine/canvasRenderer.js";
import { createFramePreloader } from "./engine/framePreloader.js";
import { createV16ProceduralSource } from "./dev/proceduralFrames.js";

/**
 * Owns the canvas renderer + tiered preloader + the rAF lerp loop.
 *
 * Returns:
 *   canvasRef         attach to <canvas>
 *   setTargetProgress (p) — call from ScrollTrigger onUpdate (no React state)
 *   ready             boolean — true once the priority block is decoded
 *
 * Frame index is driven by an eased "displayed" progress for a weighty,
 * premium scrub. Exposes window.__v16Debug for e2e (mirrors v14).
 */
export function useV16FrameSequence({ onReady } = {}) {
  const canvasRef = useRef(null);
  const targetRef = useRef(0);
  const displayedRef = useRef(0);
  const setTargetProgressRef = useRef((p) => {
    targetRef.current = p;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const procedural =
      new URLSearchParams(window.location.search).get("frames") === "procedural";
    const proc = procedural ? createV16ProceduralSource(TOTAL_FRAMES) : null;

    const renderer = createCanvasRenderer();
    renderer.mount(canvas);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sizeToParent = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      renderer.resize(r.width, r.height, dpr);
    };
    sizeToParent();

    const preloader = createFramePreloader({
      total: TOTAL_FRAMES,
      load: proc
        ? async (i) => proc.drawProcedural(i)
        : undefined, // default fetch+ImageBitmap loader (real WebP frames)
    });

    const debug = { drawCount: 0, frameIndex: -1, count: TOTAL_FRAMES, ready: false };
    window.__v16Debug = debug;

    let lastDrawn = -1;
    let lastGood = null;
    let rafId = 0;
    let alive = true;

    const tick = () => {
      if (!alive) return;
      displayedRef.current = lerp(displayedRef.current, targetRef.current, SCRUB_EASE);
      const index = progressToIndex(displayedRef.current, TOTAL_FRAMES);
      if (index !== lastDrawn) {
        const frame = preloader.getBitmap(index) || lastGood;
        if (frame) {
          renderer.draw(frame);
          lastGood = frame;
          lastDrawn = index;
          debug.drawCount += 1;
          debug.frameIndex = index;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    preloader.start();
    preloader.whenPriorityReady().then(() => {
      if (!alive) return;
      // paint the first frame immediately even before the loop catches it
      const first = preloader.getBitmap(0);
      if (first) {
        renderer.draw(first);
        lastGood = first;
        lastDrawn = 0;
      }
      debug.ready = true;
      setReady(true);
      onReady?.();
    });
    rafId = requestAnimationFrame(tick);

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        sizeToParent();
        if (lastGood) renderer.draw(lastGood);
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(resizeRaf);
      preloader.destroy();
      renderer.destroy();
      if (window.__v16Debug === debug) delete window.__v16Debug;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    canvasRef,
    ready,
    setTargetProgress: setTargetProgressRef.current,
  };
}
