"use client";
import { useState } from "react";
import { useScene } from "@/components/portfolio-v14/engine/useScene";
import { actState, metricValue, formatMetric } from "@/components/portfolio-v14/engine/chapterActs";

export default function ChapterScene({ chapter }) {
  const [p, setP] = useState(0);
  const ref = useScene({
    id: chapter.id,
    order: chapter.order,
    viewports: chapter.viewports,
    bleed: chapter.bleed,
    onProgress: setP,
  });

  const s = actState(p, chapter.plan);
  const act = chapter.acts[s.index] || {};
  const bookend = act.kind === "hook" || act.kind === "results";
  const rise = (1 - s.opacity) * 6;

  return (
    <section
      ref={ref}
      data-scene={chapter.id}
      data-act={act.id || ""}
      style={{
        height: "100vh",
        background: chapter.bleed,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {bookend && chapter.image && (
        <img
          src={chapter.image}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.4)",
            opacity: s.opacity,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.7) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "grid",
          placeItems: "center",
          padding: "8vw",
          textAlign: act.kind === "results" ? "center" : "left",
          opacity: s.opacity,
          transform: `translateY(${rise}vh)`,
        }}
      >
        <div style={{ maxWidth: "1100px", width: "100%" }}>
          {act.label && (
            <div
              style={{
                fontSize: "0.95rem",
                letterSpacing: "0.32em",
                color: chapter.accent,
                marginBottom: "1.4rem",
              }}
            >
              {act.label}
            </div>
          )}
          {act.headline && (
            <h2 style={{ fontSize: "clamp(2.4rem, 6vw, 5.5rem)", lineHeight: 1.05, margin: 0 }}>
              {act.headline}
            </h2>
          )}
          {act.body && (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "2.5rem 0 0",
                display: "grid",
                gap: "1.25rem",
                fontSize: "clamp(1.1rem, 2.1vw, 1.9rem)",
                lineHeight: 1.35,
              }}
            >
              {act.body.map((line, i) => (
                <li key={i} style={{ borderLeft: `2px solid ${chapter.accent}`, paddingLeft: "1.1rem" }}>
                  {line}
                </li>
              ))}
            </ul>
          )}
          {act.metrics && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "3rem",
                justifyContent: "center",
                marginTop: "1rem",
              }}
            >
              {act.metrics.map((m, i) => (
                <div key={i} style={{ minWidth: "180px" }}>
                  <div
                    style={{
                      fontSize: "clamp(2.6rem, 6vw, 5rem)",
                      fontWeight: 700,
                      color: chapter.accent,
                    }}
                  >
                    {formatMetric(metricValue(s.local, m.from, m.to), m.format)}
                  </div>
                  <div style={{ fontSize: "1rem", opacity: 0.85, marginTop: "0.5rem" }}>{m.label}</div>
                  {m.note && (
                    <div style={{ fontSize: "0.85rem", opacity: 0.55, marginTop: "0.25rem" }}>
                      {m.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {act.support && (
            <p style={{ marginTop: "2.5rem", fontSize: "1.15rem", opacity: 0.7, textAlign: "center" }}>
              {act.support}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
