"use client";
import { useRef } from "react";
import { AGENCY_STATS } from "./data";
import { useV24Reveal } from "./useV24Reveal";

export default function V24StatsBand() {
  const ref = useRef(null);
  useV24Reveal(ref);
  return (
    <section className="v24-section" data-v24-section="stats">
      <div ref={ref} className="v24-statsband v24-rv">
        {AGENCY_STATS.map((s, i) => (
          <div key={i} className="v24-stat">
            <div className="v24-stat-metric">{s.metric}</div>
            <div className="v24-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
