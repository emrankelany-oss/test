"use client";
import { useEffect, useRef } from "react";
import { GALAXY_STOPS } from "@/components/portfolio-v24/data";

// Option 4 — scroll-progress hue wash. One big full-bleed brand-spectrum
// gradient (300% tall) shifts vertically as scroll progresses, so the whole
// field travels through blue → violet → red, tied 1:1 to scroll.
export default function GradientHueWash() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const m = document.documentElement.scrollHeight - window.innerHeight;
        const p = m > 0 ? window.scrollY / m : 0;
        el.style.setProperty("--p", p.toFixed(4));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const grad = `linear-gradient(165deg, ${GALAXY_STOPS.join(", ")})`;
  return (
    <div className="go-bg go-wash" aria-hidden="true" ref={ref} style={{ "--grad": grad }}>
      <div className="go-wash-layer" />
    </div>
  );
}
