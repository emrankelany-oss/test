"use client";
import { useEffect, useRef } from "react";

const clamp01 = (n) => Math.max(0, Math.min(1, n));

/**
 * useScrollProgress — pump scroll-driven CSS variables onto a section element.
 *
 * Inspired by lenis.dev's pattern: JS writes one number per frame to an inline
 * CSS variable on the section, and CSS does all the animation math with var().
 *
 * Usage:
 *   const ref = useRef(null);
 *   useScrollProgress(ref, [
 *     { name: '--progress1', start: 0,   end: 0.55 }, // ramps over first 55% of section scroll
 *     { name: '--progress2', start: 0.55, end: 1.0 },
 *   ]);
 *
 * The "section progress" is measured as how far the section has scrolled
 * past the top of the viewport relative to its total scroll range
 * (its own height minus one viewport). 0 = section just hit viewport top.
 * 1 = section fully scrolled, bottom touching viewport top.
 *
 * Each entry remaps that 0..1 to its own slice, clamped to 0..1.
 */
export function useScrollProgress(ref, ramps = [{ name: "--progress", start: 0, end: 1 }]) {
  const rafRef = useRef(0);
  const lastValsRef = useRef({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const update = () => {
      rafRef.current = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const elH = el.offsetHeight;
      // travel = total scrollable distance over the section. We use (elH - vh)
      // so progress=1 when the section's bottom hits the viewport bottom.
      const travel = Math.max(1, elH - vh);
      // local = how many px we've scrolled past the section's top
      const local = -rect.top; // negative when section is below the viewport
      const t = clamp01(local / travel);

      for (const r of ramps) {
        const span = r.end - r.start;
        if (span <= 0) continue;
        const v = clamp01((t - r.start) / span);
        if (lastValsRef.current[r.name] !== v) {
          el.style.setProperty(r.name, v.toFixed(4));
          lastValsRef.current[r.name] = v;
        }
      }
    };

    const requestUpdate = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(update);
    };

    // Initial set
    update();

    if (reduced) {
      // Pin everything to 1 so the final visual state renders without motion
      for (const r of ramps) el.style.setProperty(r.name, "1");
      return;
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    // ResizeObserver to catch layout shifts inside the section
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(requestUpdate) : null;
    if (ro) ro.observe(el);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (ro) ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // ramps is a stable config — re-running on every render isn't desired; caller passes a stable array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}

/**
 * useWindowScrollProgress — same idea, but progress is measured against the
 * entire document scroll position. Useful for page-level effects (theme flip,
 * background tint shifts) where you want to react to scroll regardless of
 * which section is visible.
 *
 * The callback receives ({ scroll, limit, progress }) each frame.
 */
export function useWindowScrollProgress(cb) {
  const rafRef = useRef(0);
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const update = () => {
      rafRef.current = 0;
      const scroll = window.scrollY;
      const limit = document.documentElement.scrollHeight - window.innerHeight;
      const progress = limit > 0 ? scroll / limit : 0;
      cbRef.current?.({ scroll, limit, progress });
    };

    const requestUpdate = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(update);
    };

    update();
    if (reduced) return;

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
}
