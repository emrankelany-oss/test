"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Scoped Lenis instance for V10. Writes normalized scroll progress (0..1)
// into progressRef.current. Velocity is derived per-frame inside the R3F
// scene from progress deltas, so no velocity ref is needed here.
export function useV10Scroll(progressRef) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({
      duration: reduce ? 0.6 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduce,
      smoothTouch: false,
      touchMultiplier: 1.2,
      wheelMultiplier: 0.95,
    });

    const compute = () => {
      const limit = lenis.limit || (document.documentElement.scrollHeight - window.innerHeight);
      const p = limit > 0 ? lenis.scroll / limit : 0;
      progressRef.current = Math.max(0, Math.min(1, p));
    };

    lenis.on("scroll", compute);
    // initial
    compute();

    let raf = 0;
    const tick = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => compute();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      lenis.off("scroll", compute);
      lenis.destroy();
    };
  }, [progressRef]);
}
