"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Fade-up on enter, fade-down on leave (bidirectional, scroll-scrubbed).
// Subtle: opacity 0->1, y 24px->0. Reduced-motion shows content immediately.
export function useV24Reveal(ref, { start = "top 88%", end = "top 55%" } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }
    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: el, start, end, scrub: true },
      }
    );
    return () => {
      tween.scrollTrigger && tween.scrollTrigger.kill();
      tween.kill();
    };
  }, [ref, start, end]);
}
