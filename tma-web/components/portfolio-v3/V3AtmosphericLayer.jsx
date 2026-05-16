"use client";
import { useEffect, useRef } from "react";

/**
 * V3AtmosphericLayer — global fixed layer that lives BEHIND the R3F
 * engine and persists across every section. Components:
 *   - Faint horizontal timeline grid lines (drift vertically on scroll)
 *   - Two SVG motion-path curves (purple + cyan) that progressively
 *     draw via stroke-dashoffset as the user scrolls
 *   - Radial depth-fog mask (vignette toward viewport edges)
 *   - One extra magenta gradient blob (variety vs. the bg wash)
 *
 * Disabled on prefers-reduced-motion via CSS.
 */
export default function V3AtmosphericLayer() {
  const wrapRef = useRef(null);
  const gridRef = useRef(null);
  const path1Ref = useRef(null);
  const path2Ref = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      const y = window.scrollY;
      const docH = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const p = Math.max(0, Math.min(1, y / docH));

      // Grid drift — slow vertical translation
      if (gridRef.current) {
        gridRef.current.style.transform = `translate3d(0, ${(-y * 0.08).toFixed(1)}px, 0)`;
      }

      // Path 1 reveals over first 50% of scroll (pathLength normalized to 1)
      if (path1Ref.current) {
        const t = Math.max(0, Math.min(1, p / 0.5));
        path1Ref.current.style.strokeDashoffset = (1 - t).toFixed(4);
      }
      // Path 2 reveals from 30% to 100%
      if (path2Ref.current) {
        const t = Math.max(0, Math.min(1, (p - 0.3) / 0.7));
        path2Ref.current.style.strokeDashoffset = (1 - t).toFixed(4);
      }

      // Scroll progress indicator
      if (progressRef.current) {
        progressRef.current.style.height = `${(p * 100).toFixed(2)}%`;
      }

      raf = 0;
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="v3-atmos" aria-hidden="true">
      {/* Extra magenta gradient blob — variety vs. the bg wash */}
      <div className="v3-atmos__blob" />

      {/* Faint timeline grid lines */}
      <div ref={gridRef} className="v3-atmos__grid" />

      {/* SVG motion-path curves (drawn via stroke-dashoffset) */}
      <svg
        className="v3-atmos__curves"
        viewBox="0 0 1600 9000"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="v3-curve-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a96aff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#a96aff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="v3-curve-b" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#74d1ea" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#74d1ea" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          ref={path1Ref}
          d="M 1500 200 C 1400 1200, 200 1800, 800 3000 S 1500 4500, 200 5600 S 1400 7000, 1100 8800"
          fill="none"
          stroke="url(#v3-curve-a)"
          strokeWidth="1.2"
          strokeLinecap="round"
          pathLength="1"
          style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
        />
        <path
          ref={path2Ref}
          d="M 100 400 C 600 1500, 1300 2200, 700 3400 S 200 4900, 1400 6100 S 600 7400, 1300 8700"
          fill="none"
          stroke="url(#v3-curve-b)"
          strokeWidth="1"
          strokeLinecap="round"
          pathLength="1"
          style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
        />
      </svg>

      {/* Radial depth fog — vignettes the viewport edges */}
      <div className="v3-atmos__fog" />

      {/* Scroll progress indicator — thin cyan→purple line right edge */}
      <div ref={progressRef} className="v3-scroll-progress" />
    </div>
  );
}
