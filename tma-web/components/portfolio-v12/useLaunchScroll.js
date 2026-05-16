"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLaunchStore } from "./LaunchSequenceContext.jsx";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Mounts Lenis smooth scroll, drives GSAP ScrollTrigger from it, and writes
 * page scroll progress (0..1) into LaunchSequenceContext. Respects
 * prefers-reduced-motion by skipping Lenis (native scroll) but still tracking progress.
 */
export function useLaunchScroll(rootRef) {
  const { setProgress } = useLaunchStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis;
    // Hoist raf so both gsap.ticker.add and gsap.ticker.remove use the exact
    // same function reference (fixes the reference-mismatch bug in the original snippet).
    let raf;

    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      raf = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      ScrollTrigger.defaults({ scroller: window });
    }

    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };

    const st = ScrollTrigger.create({ start: 0, end: "max", onUpdate: update });
    update();
    const refreshId = setTimeout(() => ScrollTrigger.refresh(), 300);
    window.addEventListener("resize", update);

    return () => {
      clearTimeout(refreshId);
      window.removeEventListener("resize", update);
      st.kill();
      if (lenis) {
        // Remove the exact same `raf` reference that was added above.
        gsap.ticker.remove(raf);
        lenis.destroy();
      }
    };
  }, [rootRef, setProgress]);
}
