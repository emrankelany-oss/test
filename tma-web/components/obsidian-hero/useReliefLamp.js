"use client";
import { useEffect, useRef } from "react";
import { ReliefLampEngine } from "./relief/ReliefLampEngine.js";

// Owns the engine for the lifetime of the canvas. No-ops entirely when disabled
// (reduced motion / failure). Returns a ref to attach to a <canvas>.
export function useReliefLamp({ imageSrc, disabled, onFail }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine;
    try {
      engine = new ReliefLampEngine(canvas);
    } catch (e) {
      console.warn("[ObsidianHero] WebGL unavailable:", e.message);
      onFail && onFail();
      return;
    }
    engineRef.current = engine;

    const wrap = canvas.parentElement || canvas;
    const measure = () => {
      const r = wrap.getBoundingClientRect();
      engine.resize(Math.max(1, r.width), Math.max(1, r.height));
    };
    measure();
    engine.setImage(imageSrc);
    engine.start();

    let roRaf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(roRaf);
      roRaf = requestAnimationFrame(measure);
    });
    ro.observe(wrap);

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e && e.isIntersecting && e.intersectionRatio > 0) engine.resume();
        else engine.pause();
      },
      { threshold: [0, 0.01] }
    );
    io.observe(wrap);

    const onMove = (ev) => engine.setMouse(ev.clientX, ev.clientY);
    const onLeave = () => engine.clearMouse();
    const onTouch = (ev) => {
      if (ev.touches && ev.touches.length) engine.setMouse(ev.touches[0].clientX, ev.touches[0].clientY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onLeave);
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(roRaf);
      engine.destroy();
      engineRef.current = null;
    };
  }, [imageSrc, disabled, onFail]);

  return { canvasRef, engineRef };
}
