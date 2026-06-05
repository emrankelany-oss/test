"use client";
import { useRef } from "react";
import { useV24Reveal } from "./useV24Reveal";

export default function V24Hero() {
  const titleRef = useRef(null);
  const mediaRef = useRef(null);
  useV24Reveal(titleRef, { start: "top 95%", end: "top 70%" });
  useV24Reveal(mediaRef, { start: "top 92%", end: "top 60%" });

  return (
    <section className="v24-section v24-hero" data-v24-section="hero">
      <p className="v24-eyebrow">The Motion Agency — Riyadh · Amman</p>
      <h1 ref={titleRef} className="v24-title v24-hero-title v24-rv">
        We don't just design. We bring brands into{" "}
        <em className="v24-ital">motion</em>.
      </h1>
      <div ref={mediaRef} className="v24-hero-media v24-rv">
        <video poster="/assets/v5/slide8-poster.jpg" autoPlay muted loop playsInline aria-hidden="true">
          <source src="/assets/v5/slide8-loop.webm" type="video/webm" />
          <source src="/assets/v5/slide8-loop.mp4" type="video/mp4" />
        </video>
      </div>
    </section>
  );
}
