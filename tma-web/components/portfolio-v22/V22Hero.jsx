"use client";
import { useRef } from "react";
import V22DotField from "./V22DotField";
import { useSplitReveal } from "./hooks/useSplitReveal";
import { useMagnetic } from "./hooks/useMagnetic";

export default function V22Hero() {
  const headingRef = useRef(null);
  const ctaRef = useRef(null);
  useSplitReveal(headingRef, { by: "chars", stagger: 0.02 });
  useMagnetic(ctaRef, { strength: 0.5 });

  return (
    <section className="v22-hero v22-section" id="v22-top">
      <div className="v22-hero-copy">
        <p className="v22-eyebrow">Founded 2015 · Riyadh · Cairo</p>
        <h1 ref={headingRef} className="v22-hero-title">
          Where strategy meets bold storytelling.
        </h1>
        <a
          ref={ctaRef}
          href="#v22-featured"
          className="v22-showreel"
          data-magnetic
          data-cursor="view"
          data-cursor-label="Showreel"
        >
          ▶ Watch the reel
        </a>
      </div>
      <V22DotField />
    </section>
  );
}
