"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function V6Interlude({ line }) {
  const sectionRef = useRef(null);
  const lineRef = useRef(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(lineRef.current, { autoAlpha: 1 });
        return;
      }
      gsap.set(lineRef.current, { autoAlpha: 0, letterSpacing: "0.4em" });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 75%",
        end: "bottom 25%",
        once: false,
        onEnter: () =>
          gsap.to(lineRef.current, {
            autoAlpha: 1,
            letterSpacing: "0.08em",
            duration: 0.7,
            ease: "power2.out",
          }),
        onLeave: () =>
          gsap.to(lineRef.current, {
            autoAlpha: 0,
            duration: 0.4,
            ease: "power2.in",
          }),
        onEnterBack: () =>
          gsap.to(lineRef.current, {
            autoAlpha: 1,
            letterSpacing: "0.08em",
            duration: 0.6,
            ease: "power2.out",
          }),
        onLeaveBack: () =>
          gsap.to(lineRef.current, {
            autoAlpha: 0,
            duration: 0.4,
            ease: "power2.in",
          }),
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="v6-interlude"
      data-section="v6-interlude"
      aria-label="Interlude"
    >
      <p ref={lineRef} className="v6-interlude-line">{line}</p>
    </section>
  );
}
