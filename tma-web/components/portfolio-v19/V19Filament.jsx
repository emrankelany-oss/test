"use client";

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const MOBILE_MAX = 820; // matches the .v19fw-grid single-column breakpoint

/* Build a cubic-bezier path string for the measured section size.
   Control points are fractions of w/h so the curve scales responsively
   and threads BETWEEN the 3-column grid (gutters ~ 0.34w and 0.66w). */
function buildPath(w, h) {
  const cx = w / 2;

  if (w <= MOBILE_MAX) {
    const amp = w * 0.18;
    return (
      `M ${cx} 0 ` +
      `C ${cx + amp} ${h * 0.2}, ${cx - amp} ${h * 0.36}, ${cx} ${h * 0.5} ` +
      `S ${cx + amp} ${h * 0.82}, ${cx} ${h}`
    );
  }

  const g1 = w * 0.34;
  const g2 = w * 0.66;
  return (
    `M ${cx} 0 ` +
    `C ${cx} ${h * 0.08}, ${g1} ${h * 0.1}, ${g1} ${h * 0.2} ` +
    `C ${g1} ${h * 0.34}, ${g2} ${h * 0.38}, ${g2} ${h * 0.52} ` +
    `C ${g2} ${h * 0.66}, ${g1} ${h * 0.7}, ${g1} ${h * 0.82} ` +
    `C ${g1} ${h * 0.92}, ${cx} ${h * 0.94}, ${cx} ${h}`
  );
}

export default function V19Filament() {
  const rootRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const gradId = "v19-filament-grad-" + useId().replace(/:/g, "");

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!root || !svg || !path) return;

    const section = root.closest(".v19fw") || root.parentElement;
    if (!section) return;

    // resetOffset=true on first measure; false on resize so an already-drawn
    // line is not snapped back to hidden (scrub re-drives it from scroll pos).
    const measure = (resetOffset = true) => {
      const w = section.clientWidth;
      const h = section.clientHeight;
      if (!w || !h) return;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      path.setAttribute("d", buildPath(w, h));
      const len = path.getTotalLength();
      if (resetOffset) {
        gsap.set(path, {
          strokeDasharray: len,
          strokeDashoffset: reduced ? 0 : len,
        });
      } else {
        gsap.set(path, { strokeDasharray: len });
      }
    };

    const ctx = gsap.context(() => {
      measure();
      if (!reduced) {
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 0.6,
          },
        });
      }
    }, root);

    let rafId = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        measure(false);
        if (!reduced) ScrollTrigger.refresh();
      });
    });
    ro.observe(section);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      ctx.revert();
    };
  }, [reduced]);

  return (
    <div ref={rootRef} className="v19-filament" aria-hidden="true">
      <svg
        ref={svgRef}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6fd3ff" stopOpacity="0.0" />
            <stop offset="12%" stopColor="#6fd3ff" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#bfe9ff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          className="v19-filament-path"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
