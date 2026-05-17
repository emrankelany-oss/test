"use client";
import { useState } from "react";
import { useScene } from "@/components/portfolio-v14/engine/useScene";

export default function ProbeSceneA() {
  const [p, setP] = useState(0);
  const ref = useScene({ id: "probe-a", order: 10, viewports: 2, bleed: "#08070b", onProgress: setP });
  return (
    <section ref={ref} data-scene="probe-a" style={{ height: "100vh", background: "#08070b", color: "#fff", display: "grid", placeItems: "center" }}>
      <h1 style={{ fontSize: "10vw", margin: 0, transform: `translateY(${(1 - p) * 12}vh)`, opacity: 0.25 + p * 0.75 }}>
        MOTION MOVES CULTURE
      </h1>
    </section>
  );
}
