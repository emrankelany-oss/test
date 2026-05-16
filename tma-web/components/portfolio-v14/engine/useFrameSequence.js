"use client";
import { useEffect, useRef } from "react";
import { Canvas2DRenderer } from "./FrameRenderer.js";
import { createFrameSequenceEngine } from "./FrameSequenceEngine.js";

/**
 * Owns renderer + engine lifecycle for one film scene.
 * Returns { canvasRef, setProgress } — call setProgress from the scene's onProgress.
 */
export function useFrameSequence(source) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new Canvas2DRenderer();
    renderer.mount(canvas);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sizeToParent = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      renderer.resize(r.width, r.height, dpr);
    };
    sizeToParent();

    const engine = createFrameSequenceEngine(source, renderer);
    engineRef.current = engine;
    engine.start();
    if (typeof window !== "undefined") window.__v14Debug = engine.debug;

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(sizeToParent);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(resizeRaf);
      engine.destroy();
      renderer.destroy();
      engineRef.current = null;
    };
  }, [source]);

  return {
    canvasRef,
    setProgress: (p) => engineRef.current?.setProgress(p),
  };
}
