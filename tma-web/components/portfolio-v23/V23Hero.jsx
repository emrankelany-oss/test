"use client";
import { useRef } from "react";
import { useLineReveal, useIrisReveal } from "./useV23Reveal";

export default function V23Hero() {
  const titleRef = useRef(null);
  const mediaRef = useRef(null);
  useLineReveal(titleRef, { start: "top 92%" });
  useIrisReveal(mediaRef, { start: "top 95%" });

  return (
    <section className="v23-section v23-hero" data-v23-section="hero">
      <div className="v23-grid">
        <p className="v23-eyebrow">The Motion Agency — Studio Original</p>
        <h1 ref={titleRef} className="v23-hero-title v23-rv" data-cursor="blob">
          Where strategy meets bold storytelling.
        </h1>
      </div>
      <div className="v23-hero-media v23-grid">
        <span ref={mediaRef} className="v23-im" data-cursor="blob">
          <video
            src="/assets/videos/hero1.mp4"
            poster="/assets/portfolio/foodics-boundless/hero.jpg"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
        </span>
      </div>
    </section>
  );
}
