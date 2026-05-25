"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function V20MotionMatters() {
  const sectionRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // Pin behaviour added in Task 6. Intentional no-op for now.
    return () => {};
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
