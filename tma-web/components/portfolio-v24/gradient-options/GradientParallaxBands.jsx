"use client";
import { useEffect, useRef } from "react";
import { GALAXY_STOPS } from "@/components/portfolio-v24/data";

// Option 3 — parallax color bands. Several soft diagonal brand-gradient bands
// translate at DIFFERENT speeds on scroll, so the layers visibly slide past
// each other (clear differential parallax).
export default function GradientParallaxBands() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bands = [...root.querySelectorAll(".go-band")];
    const speeds = [0.55, 0.3, 0.16, 0.42, 0.24];
    const rots = [-14, -7, 0, 7, 14];
    const place = (y) => bands.forEach((b, i) => {
      b.style.transform = `translate3d(0, ${(-y * speeds[i % speeds.length]).toFixed(1)}px, 0) rotate(${rots[i % rots.length]}deg)`;
    });
    place(window.scrollY);
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; place(window.scrollY); });
    };
    if (!reduce) window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  const S = GALAXY_STOPS;
  const bands = [
    { top: "-12%", a: S[0], b: S[2] },
    { top: "14%", a: S[3], b: S[5] },
    { top: "40%", a: S[6], b: S[8] },
    { top: "66%", a: S[9], b: S[10] },
    { top: "90%", a: S[4], b: S[1] },
  ];
  return (
    <div className="go-bg" aria-hidden="true" ref={ref}>
      {bands.map((bd, i) => (
        <div
          key={i}
          className="go-band"
          style={{ top: bd.top, background: `linear-gradient(90deg, transparent, ${bd.a}, ${bd.b}, transparent)` }}
        />
      ))}
    </div>
  );
}
