"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Lenis from "lenis";
import V18Preloader from "./V18Preloader";
import V18Hero from "./V18Hero";
import "./v18.css";

/**
 * Composition root for portfolio-v18.
 *
 * Owns page-level concerns so sections stay presentational:
 *  - Lenis smooth scroll, started locked, unlocked once the preloader hands off
 *  - One shared frame loop (gsap.ticker) drives Lenis — no clock drift
 *
 * Boot sequence:
 *  1. Mount preloader (covers viewport, locks scroll via Lenis.stop())
 *  2. Preloader animates 0 → 100, then plays its exit and calls onDone
 *  3. onDone flips `booted` → Lenis starts + hero plays its entrance
 */
export default function V18Experience() {
  const lenisRef = useRef(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });
    lenisRef.current = lenis;
    lenis.stop();

    const onTick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (booted) lenisRef.current?.start();
  }, [booted]);

  return (
    <div className="v18-root">
      <V18Preloader onDone={() => setBooted(true)} />
      <V18Hero booted={booted} />
    </div>
  );
}
