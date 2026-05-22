"use client";

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const MOBILE_MAX = 820; // matches the .v19fw-grid single-column breakpoint

/* Build a cubic-bezier path string for the measured section size.
   Starts at the section's top-left corner, sweeps into the "Featured" word
   (word/narr are boxes in section coords, or null pre-measure), crosses it
   horizontally (the straight L segment that the wipe tracks), then exits to
   the right of the "narratives" word and weaves down through the grid. */
function buildPath(w, h, word, narr) {
  const cx = w / 2;

  if (!word) {
    // graceful fallback before the title is measured
    return `M 0 0 C ${w * 0.1} ${h * 0.2}, ${w * 0.4} ${h * 0.3}, ${cx} ${h}`;
  }

  // drop the line down to the right of "narratives" so it never overlaps it
  const guard = narr ? Math.max(narr.r, word.r) : word.r;
  const rightEdge = Math.min(w - w * 0.04, guard + w * 0.05);
  const dropY = (narr ? narr.b : word.cy) + h * 0.03;

  if (w <= MOBILE_MAX) {
    return (
      `M 0 0 ` +
      `C ${word.l * 0.4} ${word.cy * 0.5}, ${word.l * 0.75} ${word.cy}, ${word.l} ${word.cy} ` +
      `L ${word.r} ${word.cy} ` +
      `C ${rightEdge} ${word.cy + h * 0.03}, ${cx} ${dropY}, ${cx} ${h * 0.55} ` +
      `S ${cx} ${h * 0.85}, ${cx} ${h}`
    );
  }

  const g1 = w * 0.34;
  const g2 = w * 0.66;
  return (
    `M 0 0 ` +
    `C ${word.l * 0.3} ${word.cy * 0.45}, ${word.l * 0.72} ${word.cy}, ${word.l} ${word.cy} ` +
    `L ${word.r} ${word.cy} ` +
    `C ${rightEdge} ${word.cy}, ${rightEdge} ${word.cy + (dropY - word.cy) * 0.5}, ${rightEdge} ${dropY} ` +
    `C ${rightEdge} ${h * 0.5}, ${g2} ${h * 0.5}, ${g2} ${h * 0.58} ` +
    `C ${g2} ${h * 0.72}, ${g1} ${h * 0.74}, ${g1} ${h * 0.86} ` +
    `C ${g1} ${h * 0.94}, ${cx} ${h * 0.96}, ${cx} ${h}`
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

    const wordEl = section.querySelector(".v19fw-title-word");
    const narrEl = section.querySelector(".v19fw-title em");

    const setWipe = (frac) => {
      if (wordEl) {
        wordEl.style.setProperty("--v19-wipe", (frac * 100).toFixed(2) + "%");
      }
    };

    // shared geometry, updated on (re)measure and read by the scroll tween
    const geom = { len: 0, p1: 0, p2: 1, ready: false };

    const boxIn = (el) => {
      if (!el) return null;
      const s = section.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        l: r.left - s.left,
        r: r.right - s.left,
        t: r.top - s.top,
        b: r.bottom - s.top,
        cy: r.top - s.top + r.height / 2,
      };
    };

    // resetOffset=true on first measure; false on resize so an already-drawn
    // line is not snapped back to hidden (scrub re-drives it from scroll pos).
    const measure = (resetOffset = true) => {
      const w = section.clientWidth;
      const h = section.clientHeight;
      if (!w || !h) return;

      const word = boxIn(wordEl);
      const narr = boxIn(narrEl);

      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      path.setAttribute("d", buildPath(w, h, word, narr));
      const len = path.getTotalLength();
      geom.len = len;

      // arc-length window where the drawn tip is over the "Featured" box —
      // this maps the eased scroll progress to the left-to-right wipe.
      geom.ready = false;
      if (word && len) {
        const N = 360;
        let s1 = -1;
        let s2 = -1;
        for (let i = 0; i <= N; i++) {
          const s = (len * i) / N;
          const pt = path.getPointAtLength(s);
          const inX = pt.x >= word.l - 1 && pt.x <= word.r + 1;
          const inY = pt.y >= word.t - 2 && pt.y <= word.b + 2;
          if (inX && inY) {
            if (s1 < 0) s1 = s;
            s2 = s;
          }
        }
        if (s1 >= 0 && s2 > s1) {
          geom.p1 = s1 / len;
          geom.p2 = s2 / len;
          geom.ready = true;
        }
      }

      if (resetOffset) {
        gsap.set(path, {
          strokeDasharray: len,
          strokeDashoffset: reduced ? 0 : len,
        });
      } else {
        gsap.set(path, { strokeDasharray: len });
      }

      if (reduced) setWipe(1); // static end-state: full line, word fully lit
    };

    const ctx = gsap.context(() => {
      measure();
      if (!reduced) {
        // one eased value drives BOTH the dash draw and the word wipe, so the
        // colour fill stays locked to the (scrub-lagged) visible line tip.
        const state = { p: 0 };
        gsap.to(state, {
          p: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "bottom bottom",
            // low scrub = the line tracks the scroll closely, so it stays
            // visible crossing the text even during fast scrolls (was 2.5,
            // which lagged so far behind you'd scroll past before it drew).
            scrub: 0.5,
          },
          onUpdate: () => {
            const p = state.p;
            path.style.strokeDashoffset = String(geom.len * (1 - p));
            if (geom.ready) {
              const frac = Math.min(
                1,
                Math.max(0, (p - geom.p1) / (geom.p2 - geom.p1))
              );
              setWipe(frac);
            }
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
      if (wordEl) wordEl.style.removeProperty("--v19-wipe");
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
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
