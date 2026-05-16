"use client";
import { useRef } from "react";
import { useScrollProgress } from "@/lib/useScrollProgress";

export default function V2KineticType() {
  const ref = useRef(null);
  useScrollProgress(ref, [
    { name: "--progress1", start: 0, end: 0.55 },
    { name: "--progress2", start: 0.55, end: 1.0 },
  ]);

  return (
    <section ref={ref} className="v2-kinetic" data-section="solution">
      <div className="v2-kinetic-inner">
        <div className="v2-kinetic-first">
          <h2 className="v2-kinetic-zoom">
            STRATEGY,
            <br />
            DESIGN,
            <br />
            GTM,
            <br />
            CONTENT.
          </h2>
        </div>

        <div className="v2-kinetic-enter">CATEGORY&nbsp;LEADERS</div>
      </div>
    </section>
  );
}
