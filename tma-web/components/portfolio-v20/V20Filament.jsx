"use client";

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { buildMotionMattersPath } from "./mmGlyphs";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const MOBILE_MAX = 820;

/* ONE continuous path spanning the whole work lane (Featured + Our Work).
   It sweeps into "Featured" and crosses it, weaves down through the
   featured cards, continues into Our Work, crosses "OUR WORK", then
   weaves on to the bottom of the lane. Coordinates are in lane space. */
function buildLanePath(w, h, fw, ourW, workE, fNarr, mm) {
  const cx = w / 2;
  if (!fw || !ourW) {
    return `M 0 0 C ${w * 0.12} ${h * 0.1}, ${cx} ${h * 0.4}, ${cx} ${h}`;
  }

  const fy = fw.cy;
  const oy = ourW.cy;
  const ourL = ourW.l;
  const workR = workE ? workE.r : ourW.r;
  const fGuard = Math.max(fw.r, fNarr ? fNarr.r : fw.r);
  const fRight = Math.min(w - w * 0.04, fGuard + w * 0.05);
  const owRight = Math.min(w - w * 0.04, Math.max(workR, ourL) + w * 0.04);
  const span = oy - fy;

  // ---- Pre-Featured + Featured crossing + descent through cards ----
  let head;
  if (w <= MOBILE_MAX) {
    head =
      `M 0 0 ` +
      `C ${fw.l * 0.4} ${fy * 0.5}, ${fw.l * 0.75} ${fy}, ${fw.l} ${fy} ` +
      `L ${fw.r} ${fy} ` +
      `C ${fRight} ${fy + span * 0.2}, ${cx} ${fy + span * 0.5}, ${cx} ${fy + span * 0.72}`;
  } else {
    head =
      `M 0 0 ` +
      `C ${fw.l * 0.3} ${fy * 0.45}, ${fw.l * 0.72} ${fy}, ${fw.l} ${fy} ` +
      `L ${fw.r} ${fy} ` +
      `C ${fRight} ${fy}, ${fRight} ${fy + span * 0.22}, ${fRight} ${fy + span * 0.38} ` +
      `C ${fRight} ${fy + span * 0.58}, ${w * 0.3} ${fy + span * 0.52}, ${w * 0.3} ${fy + span * 0.74}`;
  }

  // Pen position at end of `head` for both branches:
  let penX = w <= MOBILE_MAX ? cx : w * 0.3;
  let penY = w <= MOBILE_MAX ? fy + span * 0.72 : fy + span * 0.74;

  // ---- MOTION MATTERS letter strokes (optional) ----
  let mmPart = "";
  if (mm) {
    // Approach the panel from above: smooth curve from current pen to
    // the top-center of the panel, then drop into the assembler.
    const mmCx = mm.l + (mm.r - mm.l) / 2;
    const approachY = mm.t + (mm.b - mm.t) * 0.15;
    mmPart =
      ` C ${penX} ${penY + (mm.t - penY) * 0.5}, ${mmCx} ${mm.t}, ${mmCx} ${approachY}`;
    const built = buildMotionMattersPath(mm, { x: mmCx, y: approachY });
    mmPart += built.d;
    penX = built.exit.x;
    penY = built.exit.y;
  }

  // ---- Approach to Our Work + cross OUR WORK + descend to bottom ----
  let tail;
  if (w <= MOBILE_MAX) {
    tail =
      ` C ${penX} ${(penY + oy) * 0.5}, ${ourL * 0.7} ${oy}, ${ourL} ${oy} ` +
      `L ${workR} ${oy} ` +
      `C ${owRight} ${oy}, ${cx} ${oy + (h - oy) * 0.5}, ${cx} ${oy + (h - oy) * 0.75} ` +
      `S ${cx} ${h * 0.92}, ${cx} ${h}`;
  } else {
    tail =
      ` C ${penX} ${(penY + oy) * 0.5}, ${ourL * 0.72} ${oy}, ${ourL} ${oy} ` +
      `L ${workR} ${oy} ` +
      `C ${owRight} ${oy}, ${owRight} ${oy + (h - oy) * 0.28}, ${owRight} ${oy + (h - oy) * 0.48} ` +
      `C ${owRight} ${h * 0.82}, ${cx} ${h * 0.9}, ${cx} ${h}`;
  }

  return head + mmPart + tail;
}

const DEFAULT_STOPS = [
  { offset: "0%", color: "#6fd3ff", opacity: 0.0 },
  { offset: "5%", color: "#9fe0ff", opacity: 0.9 },
  { offset: "33%", color: "#bfe9ff", opacity: 0.95 },
  { offset: "52%", color: "#7fd0ff", opacity: 0.95 },
  { offset: "74%", color: "#3f93d8", opacity: 0.95 },
  { offset: "100%", color: "#1f6fc0", opacity: 0.92 },
];

export default function V20Filament({
  laneSelector = ".v20-worklane",
  featuredWordSel = ".v20fw-title-word",
  featuredEmSel = ".v20fw-title em",
  ourWordSel = ".v20ow-title-word",
  workSel = ".v20ow-title em",
  stops = DEFAULT_STOPS,
} = {}) {
  const rootRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const gradId = "v20-filament-grad-" + useId().replace(/:/g, "");

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!root || !svg || !path) return;

    const lane = root.closest(laneSelector) || root.parentElement;
    if (!lane) return;

    const fwEl = lane.querySelector(featuredWordSel);
    const fNarrEl = lane.querySelector(featuredEmSel); // for avoidance, not a wipe
    const ourEl = lane.querySelector(ourWordSel);
    const workEl = lane.querySelector(workSel);

    // wipe targets: each fills with its --v20-lit colour as the line tip
    // crosses it. window = arc-length range where the path is inside its box.
    const targets = [fwEl, ourEl, workEl]
      .filter(Boolean)
      .map((el) => ({ el, s1: -1, s2: -1, ready: false }));

    const clearWipes = () =>
      targets.forEach((t) => t.el.style.removeProperty("--v20-wipe"));
    const setWipe = (t, frac) =>
      t.el.style.setProperty("--v20-wipe", (frac * 100).toFixed(2) + "%");

    const geom = { len: 0 };

    const boxIn = (el) => {
      if (!el) return null;
      const s = lane.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        l: r.left - s.left,
        r: r.right - s.left,
        t: r.top - s.top,
        b: r.bottom - s.top,
        cy: r.top - s.top + r.height / 2,
      };
    };

    const measure = (resetOffset = true) => {
      const w = lane.clientWidth;
      const h = lane.scrollHeight || lane.clientHeight;
      if (!w || !h) return;

      const fw = boxIn(fwEl);
      const fNarr = boxIn(fNarrEl);
      const ourW = boxIn(ourEl);
      const workE = boxIn(workEl);
      const mmEl = lane.querySelector("[data-v20-mm-box]");
      const mm = boxIn(mmEl);

      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      path.setAttribute("d", buildLanePath(w, h, fw, ourW, workE, fNarr, mm));
      const len = path.getTotalLength();
      geom.len = len;

      const boxes = [fw, ourW, workE].filter(Boolean);
      targets.forEach((t) => {
        t.ready = false;
        t.s1 = -1;
        t.s2 = -1;
      });
      if (len) {
        // Bump sample count proportional to path length so wipe windows stay
        // accurate as the path grows with the letter strokes.
        const N = Math.max(520, Math.ceil(len / 6));
        for (let i = 0; i <= N; i++) {
          const s = (len * i) / N;
          const pt = path.getPointAtLength(s);
          targets.forEach((t, ti) => {
            const b = boxes[ti];
            if (!b) return;
            const inX = pt.x >= b.l - 1 && pt.x <= b.r + 1;
            const inY = pt.y >= b.t - 2 && pt.y <= b.b + 2;
            if (inX && inY) {
              if (t.s1 < 0) t.s1 = s;
              t.s2 = s;
            }
          });
        }
        targets.forEach((t) => {
          if (t.s1 >= 0 && t.s2 > t.s1) t.ready = true;
        });
      }

      if (resetOffset) {
        gsap.set(path, {
          strokeDasharray: len,
          strokeDashoffset: reduced ? 0 : len,
        });
      } else {
        gsap.set(path, { strokeDasharray: len });
      }

      if (reduced) targets.forEach((t) => setWipe(t, 1));
    };

    const applyWipes = (p) => {
      const len = geom.len;
      if (!len) return;
      targets.forEach((t) => {
        if (!t.ready) return;
        const a = t.s1 / len;
        const b = t.s2 / len;
        const frac = Math.min(1, Math.max(0, (p - a) / (b - a)));
        setWipe(t, frac);
      });
    };

    const ctx = gsap.context(() => {
      measure();
      if (!reduced) {
        const state = { p: 0 };
        gsap.to(state, {
          p: 1,
          ease: "none",
          scrollTrigger: {
            trigger: lane,
            // head-start the draw so the line has already filled ~75% of the
            // "Featured" word by the time the section lands in view.
            start: "top 130%",
            end: "bottom bottom",
            // scrub:true links the draw DIRECTLY to the scrollbar (no catch-up
            // lag), so the tip is always at the scroll position — visibly
            // crossing the words in real time, never "arriving late".
            scrub: true,
          },
          onUpdate: () => {
            const p = state.p;
            path.style.strokeDashoffset = String(geom.len * (1 - p));
            applyWipes(p);
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
    ro.observe(lane);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      ctx.revert();
      clearWipes();
    };
  }, [reduced, laneSelector, featuredWordSel, featuredEmSel, ourWordSel, workSel]);

  return (
    <div ref={rootRef} className="v20-filament" aria-hidden="true">
      <svg
        ref={svgRef}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            {stops.map((s, i) => (
              <stop
                key={i}
                offset={s.offset}
                stopColor={s.color}
                stopOpacity={s.opacity}
              />
            ))}
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          className="v20-filament-path"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
