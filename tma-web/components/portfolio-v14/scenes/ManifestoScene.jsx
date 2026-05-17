"use client";
import { useState } from "react";
import { useScene } from "@/components/portfolio-v14/engine/useScene";
import { actState } from "@/components/portfolio-v14/engine/chapterActs";

const LINES = [
  "We don't just create campaigns — we become an extension of your team.",
  "We transform B2B brands into culturally relevant, emotionally engaging experiences.",
  "We craft communication that resonates, visuals that convert, strategies that move markets.",
  "We build brands with purpose. We create work that matters.",
];

const PLAN = {
  acts: LINES.map((_, i) => ({ id: `m${i}`, weight: 1 })),
  inFrac: 0.25,
  outFrac: 0.25,
};

export default function ManifestoScene() {
  const [p, setP] = useState(0);
  const ref = useScene({
    id: "manifesto",
    order: 30,
    viewports: 4,
    bleed: "#07060a",
    onProgress: setP,
  });
  const s = actState(p, PLAN);
  const last = s.index === LINES.length - 1;

  return (
    <section
      ref={ref}
      data-scene="manifesto"
      data-act={s.id || ""}
      style={{
        height: "100vh",
        background: "#07060a",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        padding: "10vw",
      }}
    >
      <p
        style={{
          maxWidth: "1200px",
          margin: 0,
          textAlign: "center",
          fontSize: last ? "clamp(2.6rem, 7vw, 6rem)" : "clamp(1.9rem, 5vw, 4rem)",
          lineHeight: 1.1,
          fontWeight: last ? 700 : 400,
          opacity: s.opacity,
          transform: `translateY(${(1 - s.opacity) * 5}vh)`,
        }}
      >
        {LINES[s.index]}
      </p>
    </section>
  );
}
