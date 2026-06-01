"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * V21Cursor — a small lerp-followed dot that replaces the native cursor on
 * fine-pointer devices. Grows + shows a "play" glyph over [data-cursor="play"]
 * elements. Disabled entirely on coarse/touch and reduced-motion (native cursor used).
 */
export default function V21Cursor() {
  const dotRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [fine, setFine] = useState(false);

  /* Gate 1: detect pointer capability; drives both the render and effect below. */
  useEffect(() => {
    const isFine = !reduced && typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
    setFine(isFine);
  }, [reduced]);

  /* Gate 2: set up rAF + listener only when the cursor div is mounted (fine=true). */
  useEffect(() => {
    if (!fine) return;
    const dot = dotRef.current;
    if (!dot) return;

    document.documentElement.classList.add("v21-has-cursor");

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      const playable = e.target && e.target.closest && e.target.closest('[data-cursor="play"]');
      dot.classList.toggle("is-play", !!playable);
    };
    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      dot.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("v21-has-cursor");
    };
  }, [fine]);

  if (!fine) return null;
  return (
    <div ref={dotRef} className="v21-cursor" aria-hidden="true">
      <span className="v21-cursor-label">▶</span>
    </div>
  );
}
