"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Scoped Lenis instance — writes normalized scroll progress (0..1) to
// progressRef.current, and exposes ScrollTrigger updates for foreground tweens.
export function useV11Scroll(progressRef) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({
      duration: reduce ? 0.6 : 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduce,
      smoothTouch: false,
      touchMultiplier: 1.2,
      wheelMultiplier: 0.95,
    });

    const compute = () => {
      const limit =
        lenis.limit || document.documentElement.scrollHeight - window.innerHeight;
      const p = limit > 0 ? lenis.scroll / limit : 0;
      progressRef.current = Math.max(0, Math.min(1, p));
    };

    const onScroll = () => {
      compute();
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);
    compute();

    let raf = 0;
    const tick = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      compute();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    // Initial ScrollTrigger refresh once layout settles
    const settle = setTimeout(() => ScrollTrigger.refresh(), 250);

    return () => {
      clearTimeout(settle);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      lenis.off("scroll", onScroll);
      lenis.destroy();
    };
  }, [progressRef]);
}
