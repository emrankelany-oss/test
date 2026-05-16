"use client";
import { useMemo } from "react";
import { useScene } from "@/components/portfolio-v14/engine/useScene";
import { useFrameSequence } from "@/components/portfolio-v14/engine/useFrameSequence";
import { createProceduralSource } from "@/components/portfolio-v14/dev/proceduralFrames";

export default function PlaceholderFilmScene() {
  const source = useMemo(() => createProceduralSource(180), []);
  const { canvasRef, setProgress } = useFrameSequence(source);
  const ref = useScene({
    id: "film",
    order: 20,
    viewports: 8,
    onProgress: (p) => setProgress(p),
  });
  return (
    <section ref={ref} data-scene="film" style={{ height: "100vh", background: "#000" }}>
      <canvas ref={canvasRef} data-v14-canvas style={{ display: "block", width: "100%", height: "100%" }} />
    </section>
  );
}
