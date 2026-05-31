"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
// NOTE: the flow-current background (V20FlowField) is mounted at the
// work-lane level in app/portfolio-v20/page.jsx — BEFORE <V20Filament/> — so
// it paints BEHIND the filament and the drawn line stays clearly on top.

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function V20MotionMatters() {
  const sectionRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        // Pin for 2 viewports so the user has time to see the entire
        // "MOTION MATTERS" word drawn AND the line continue smoothly past
        // the last letter before the panel releases.
        end: "+=200%",
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      });
    }, el);

    // Refresh ScrollTrigger after pin registration so the lane filament's
    // existing trigger picks up the new scroll length.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(id);
      ctx.revert();
    };
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className="v20-mm"
      aria-label="Motion matters"
      data-v20-mm
    >
      {/* The filament uses this box's geometry to compute where to
          place the drawn letters. The box is invisible but layout-bearing. */}
      <div className="v20-mm-text-box" data-v20-mm-box />
    </section>
  );
}
