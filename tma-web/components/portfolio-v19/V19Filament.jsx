"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!root || !svg || !path) return;

    const section = root.closest(".v19fw") || root.parentElement;
    if (!section) return;

    let st = null;

    const measure = () => {
      const w = section.clientWidth;
      const h = section.clientHeight;
      if (!w || !h) return;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      path.setAttribute("d", buildPath(w, h));
      const len = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: len,
        strokeDashoffset: reduced ? 0 : len,
      });
      return len;
    };

    const ctx = gsap.context(() => {
      measure();
      if (!reduced) {
        const tween = gsap.to(path, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 0.6,
          },
        });
        st = tween.scrollTrigger;
      }
    }, root);

    const ro = new ResizeObserver(() => {
      measure();
      // re-pin the draw to current scroll after a layout change
      if (st) {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len });
      }
      ScrollTrigger.refresh();
    });
    ro.observe(section);

    return () => {
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
          <linearGradient id="v19-filament-grad" x1="0" y1="0" x2="0" y2="1">
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
          stroke="url(#v19-filament-grad)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
