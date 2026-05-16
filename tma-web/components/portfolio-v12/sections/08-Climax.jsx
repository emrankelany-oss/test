"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { climax } from "@/data/portfolio-v12.js";

if (typeof window !== "undefined") { gsap.registerPlugin(ScrollTrigger); }

export default function Climax() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray(".v12-climax-line");
      gsap.set(lines, { opacity: 0, scale: 1.3 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top top", end: "+=250%", pin: true, scrub: 1 },
      });
      lines.forEach((l) => tl.to(l, { opacity: 1, scale: 1, duration: 1 }).to(l, { opacity: 0, duration: 1 }, "+=0.7"));
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} aria-label="Climax">
      <div className="v12-pin" style={{ position: "relative", textAlign: "center" }}>
        {climax.map((line) => (
          <h2 key={line} className="v12-climax-line v12-h" style={{ position: "absolute", maxWidth: "14ch" }}>
            {line}
          </h2>
        ))}
      </div>
    </section>
  );
}
