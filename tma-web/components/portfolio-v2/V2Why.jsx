"use client";
import { useRef } from "react";
import { useScrollProgress } from "@/lib/useScrollProgress";

export default function V2Why() {
  const ref = useRef(null);
  useScrollProgress(ref, [{ name: "--progress", start: 0, end: 1 }]);

  return (
    <section
      ref={ref}
      className="v2-why"
      data-section="why"
      data-lenis-scroll-snap-align="start"
    >
      <div className="v2-why-inner">
        <div className="v2-section-num">
          <span className="dot" />
          02 / Manifesto
        </div>
        <h2 className="v2-why-title">
          We don&apos;t pitch. <br /> We <span className="ital">embed.</span>
        </h2>
        <p className="v2-why-body">
          From understanding your product inside-out to identifying pain points and growth
          levers, we think strategically, creatively, and with ROI at the core of every
          project. Our strength is transforming B2B brands into culturally relevant,
          emotionally engaging, business-driven experiences.
        </p>
      </div>
    </section>
  );
}
