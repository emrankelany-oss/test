"use client";
import { useMemo } from "react";
import { useScene } from "@/components/portfolio-v14/engine/useScene";
import { useFrameSequence } from "@/components/portfolio-v14/engine/useFrameSequence";
import { createProceduralSource } from "@/components/portfolio-v14/dev/proceduralFrames";

const FRAME_COUNT = 180;

export default function IntroFilmScene() {
  const source = useMemo(() => {
    const useProcedural =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("frames") === "procedural";
    if (useProcedural) return createProceduralSource(FRAME_COUNT);
    return {
      count: FRAME_COUNT,
      getUrl: (i) =>
        `/assets/v14/intro/frame-${String(i + 1).padStart(3, "0")}.webp`,
    };
  }, []);
  const { canvasRef, setProgress } = useFrameSequence(source);
  const ref = useScene({
    id: "film",
    order: 20,
    viewports: 8,
    bleed: "#000",
    onProgress: (p) => setProgress(p),
  });
  return (
    <section ref={ref} data-scene="film" style={{ height: "100vh", background: "#000" }}>
      <canvas ref={canvasRef} data-v14-canvas style={{ display: "block", width: "100%", height: "100%" }} />
    </section>
  );
}
