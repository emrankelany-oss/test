"use client";
import { useEffect, useRef } from "react";
import { parallaxOffset, transform3d } from "./relief/parallax.js";

// One RAF owner. sectionRef = the hero section (defines progress range:
// progress 0 when its top hits viewport bottom, 1 when its bottom hits viewport top).
// captionRef = element that receives the parallax transform.
// onScroll(y) = forward smoothed scroll to the engine.
export function useScrollProgress({ sectionRef, captionRef, onScroll, factor = 0.1, disabled }) {
  const onScrollRef = useRef(onScroll);

  useEffect(() => {
    onScrollRef.current = onScroll;
  }, [onScroll]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (disabled) return;
    let raf = 0;
    let lastY = -1;
    let lastT = "";

    const frame = () => {
      const y = window.scrollY || 0;
      if (y !== lastY) {
        lastY = y;
        if (onScrollRef.current) onScrollRef.current(y);
        const section = sectionRef.current;
        const cap = captionRef.current;
        if (section && cap) {
          const r = section.getBoundingClientRect();
          const vh = window.innerHeight || 1;
          // progress: 0 when section top at viewport bottom, 1 when section bottom at top
          const total = r.height + vh;
          const progress = (vh - r.top) / total;
          const px = parallaxOffset({
            progress, factor, vh, sign: 1, viewportWidth: window.innerWidth || 1280,
          });
          const tf = transform3d(Math.round(px * 100) / 100);
          if (tf !== lastT) { cap.style.transform = tf; lastT = tf; } // epsilon dedupe
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [sectionRef, captionRef, factor, disabled]);
}
