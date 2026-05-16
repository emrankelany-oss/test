"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { philosophy } from "@/data/portfolio-v12.js";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Philosophy() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray(".v12-phil-line");
      gsap.set(lines, { opacity: 0, scale: 1.25, filter: "blur(14px)" });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top top", end: "+=300%", pin: true, scrub: 1 },
      });
      lines.forEach((l) => {
        tl.to(l, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1 })
          .to(l, { opacity: 0, scale: 0.85, filter: "blur(10px)", duration: 1 }, "+=0.6");
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} aria-label="Philosophy">
      <div className="v12-pin" style={{ position: "relative" }}>
        {philosophy.map((line, i) => (
          <p
            key={i}
            className="v12-phil-line v12-h"
            style={{ position: "absolute", maxWidth: "16ch", textAlign: "center" }}
          >
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
