"use client";
import { useRef } from "react";
import { useScrollProgress } from "@/lib/useScrollProgress";

const STEPS = [
  { n: "01", title: "Discover", body: "We embed inside the business, listen, and map the levers that actually move category position." },
  { n: "02", title: "Position", body: "Strategy and brand architecture — one POV, one playbook, one voice that lands in the GCC." },
  { n: "03", title: "Create", body: "Design, copy, film, motion, GTM — all written in the same room as the strategy." },
  { n: "04", title: "Scale", body: "We measure what moves and stay long enough to compound the win." },
];

export default function V2HorizontalCards() {
  const ref = useRef(null);
  useScrollProgress(ref, [{ name: "--progress", start: 0, end: 1 }]);

  return (
    <section ref={ref} className="v2-hsection" data-section="rethink">
      <div className="v2-hsection-sticky">
        <div className="v2-hsection-header">
          <div className="v2-section-num">
            <span className="dot" />
            03 / How we work
          </div>
          <h2 className="v2-hsection-title">
            One <span className="ital">playbook.</span>
          </h2>
        </div>

        <div className="v2-hsection-track">
          {STEPS.map((s, i) => (
            <article key={s.n} className="v2-htrack-card" style={{ "--i": i }}>
              <div className="v2-htrack-card-n">{s.n}</div>
              <h3 className="v2-htrack-card-title">{s.title}</h3>
              <p className="v2-htrack-card-body">{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
