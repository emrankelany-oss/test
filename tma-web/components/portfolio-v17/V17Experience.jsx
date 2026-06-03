"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import V17Preloader from "./V17Preloader";
import V17Journey from "./V17Journey";
import V17TextWall from "./V17TextWall";
import "./v17.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Composition root for portfolio-v17.
 *
 * Owns the page-level concerns so individual sections stay presentational:
 *  - Lenis smooth scroll, linked to GSAP ScrollTrigger via the gsap ticker
 *
 * The pointer uses the regular OS cursor; pointer interactivity lives in the
 * journey (the prism drifts/ripples toward the cursor). Lenis is disabled
 * under prefers-reduced-motion (native scroll). The whole experience is one
 * connected journey: a tall scroll track + a sticky persistent stage.
 */
export default function V17Experience() {
  const lenisRef = useRef(null);
  const [booted, setBooted] = useState(false);

  // Lenis + ScrollTrigger (created stopped; the preloader unlocks it)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      touchMultiplier: 1.2,
      wheelMultiplier: 0.95,
    });
    lenisRef.current = lenis;
    lenis.stop(); // locked until the preloader hands off

    lenis.on("scroll", ScrollTrigger.update);
    const onTick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.off("scroll", ScrollTrigger.update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Unlock scroll once booted
  useEffect(() => {
    if (booted) lenisRef.current?.start();
  }, [booted]);

  return (
    <div className="v17-root">
      <V17Preloader onDone={() => setBooted(true)} />
      <V17Journey booted={booted} />
      <V17TextWall />
    </div>
  );
}
