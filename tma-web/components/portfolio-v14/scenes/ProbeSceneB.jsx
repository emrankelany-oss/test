"use client";
import { useState } from "react";
import { useScene } from "@/components/portfolio-v14/engine/useScene";

export default function ProbeSceneB() {
  const [p, setP] = useState(0);
  const ref = useScene({ id: "probe-b", order: 30, viewports: 2, onProgress: setP });
  return (
    <section ref={ref} data-scene="probe-b" style={{ height: "100vh", background: "#0b0708", color: "#fff", display: "grid", placeItems: "center" }}>
      <h1 style={{ fontSize: "8vw", margin: 0, filter: `blur(${(1 - p) * 14}px)` }}>
        THE WORK BEGINS
      </h1>
    </section>
  );
}
