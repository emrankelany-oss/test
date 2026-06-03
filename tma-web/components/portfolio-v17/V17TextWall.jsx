"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * V17 — Section 3: the white text wall.
 *
 * After the suction hand-off, the world goes white. A premium, restrained
 * editorial typographic section — the agency's own manifesto (verbatim from
 * the TMA portfolio deck, Slide 3). Big lines mask-reveal on scroll for the
 * "premium hook" feel. Reduced motion → all visible, no reveal.
 */

const KICKER = "THE MOTION AGENCY — MANIFESTO";
const LINES = [
  "We don’t just create campaigns —",
  "we become an extension of your team.",
  "We build brands with purpose.",
  "We create work that matters.",
  "We don’t just deliver value —",
  "we become part of your success story.",
];
const FOOT =
  "A creative powerhouse — Amman ↔ Riyadh — delivering bold ideas and meaningful results across the GCC.";

export default function V17TextWall() {
  const rootRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray(".v17-tw-line > span").forEach((line) => {
        gsap.from(line, {
          yPercent: 115,
          ease: "expo.out",
          duration: 1,
          scrollTrigger: {
            trigger: line,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        });
      });
      gsap.from(".v17-tw-kicker, .v17-tw-foot", {
        autoAlpha: 0,
        y: 18,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: rootRef.current, start: "top 70%" },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="v17-textwall" ref={rootRef} aria-label="Manifesto">
      <div className="v17-tw-inner">
        <span className="v17-tw-kicker">{KICKER}</span>
        <h2 className="v17-tw-head">
          {LINES.map((l, i) => (
            <span className="v17-tw-line" key={i}>
              <span>{l}</span>
            </span>
          ))}
        </h2>
        <p className="v17-tw-foot">{FOOT}</p>
      </div>
    </section>
  );
}
