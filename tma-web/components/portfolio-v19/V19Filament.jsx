"use client";

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const MOBILE_MAX = 820;

/* ONE continuous path spanning the whole work lane (Featured + Our Work).
   It sweeps into "Featured" and crosses it, weaves down through the
   featured cards, continues into Our Work, crosses "OUR WORK", then
   weaves on to the bottom of the lane. Coordinates are in lane space. */
function buildLanePath(w, h, fw, ourW, workE) {
  const cx = w / 2;
  if (!fw || !ourW) {
    return `M 0 0 C ${w * 0.12} ${h * 0.1}, ${cx} ${h * 0.4}, ${cx} ${h}`;
  }

  const fy = fw.cy;
  const oy = ourW.cy;
  const ourL = ourW.l;
  const workR = workE ? workE.r : ourW.r;
  const fRight = Math.min(w - w * 0.04, fw.r + w * 0.05);
  const owRight = Math.min(w - w * 0.04, Math.max(workR, ourL) + w * 0.04);
  const span = oy - fy; // vertical gap between the two titles

  if (w <= MOBILE_MAX) {
    return (
      `M 0 0 ` +
      `C ${fw.l * 0.4} ${fy * 0.5}, ${fw.l * 0.75} ${fy}, ${fw.l} ${fy} ` +
      `L ${fw.r} ${fy} ` +
      `C ${fRight} ${fy + span * 0.2}, ${cx} ${fy + span * 0.5}, ${cx} ${fy + span * 0.72} ` +
      `C ${cx} ${oy - h * 0.015}, ${ourL * 0.7} ${oy}, ${ourL} ${oy} ` +
      `L ${workR} ${oy} ` +
      `C ${owRight} ${oy}, ${cx} ${oy + (h - oy) * 0.5}, ${cx} ${oy + (h - oy) * 0.75} ` +
      `S ${cx} ${h * 0.92}, ${cx} ${h}`
    );
  }

  return (
    `M 0 0 ` +
    // sweep into "Featured" and cross it
    `C ${fw.l * 0.3} ${fy * 0.45}, ${fw.l * 0.72} ${fy}, ${fw.l} ${fy} ` +
    `L ${fw.r} ${fy} ` +
    // drop off the right, weave down through the featured cards
    `C ${fRight} ${fy}, ${fRight} ${fy + span * 0.22}, ${fRight} ${fy + span * 0.38} ` +
    `C ${fRight} ${fy + span * 0.58}, ${w * 0.3} ${fy + span * 0.52}, ${w * 0.3} ${fy + span * 0.74} ` +
    // continue into Our Work and sweep into "OUR"
    `C ${w * 0.3} ${oy - h * 0.02}, ${ourL * 0.72} ${oy}, ${ourL} ${oy} ` +
    // cross BOTH "OUR" and "WORK"
    `L ${workR} ${oy} ` +
    // exit right and weave down to the bottom of Our Work
    `C ${owRight} ${oy}, ${owRight} ${oy + (h - oy) * 0.28}, ${owRight} ${oy + (h - oy) * 0.48} ` +
    `C ${owRight} ${h * 0.82}, ${cx} ${h * 0.9}, ${cx} ${h}`
  );
}

const LEAD_SEED_PX = 10; // always-drawn nub at Design so the start stays visible

/* LEAD segment (hero): starts at the left border of "Design", crosses it
   horizontally (wipe), then descends to the hero bottom-left seam (0,h)
   where the work-lane path's "M 0 0" picks up. design = hero-coord box. */
function buildLeadPath(w, h, design) {
  if (!design) {
    return `M ${w * 0.04} ${h * 0.5} C ${w * 0.04} ${h * 0.7}, 0 ${h * 0.85}, 0 ${h}`;
  }
  const dl = design.l;
  const dr = design.r;
  const cy = design.cy;
  return (
    `M ${dl} ${cy} ` +
    `L ${dr} ${cy} ` +
    `C ${dr} ${cy + (h - cy) * 0.25}, ${w * 0.18} ${cy + (h - cy) * 0.45}, ${w * 0.12} ${cy + (h - cy) * 0.62} ` +
    `C ${w * 0.06} ${cy + (h - cy) * 0.8}, 0 ${h * 0.92}, 0 ${h}`
  );
}

const DEFAULT_STOPS = [
  { offset: "0%", color: "#6fd3ff", opacity: 0.0 },
  { offset: "5%", color: "#9fe0ff", opacity: 0.9 },
  { offset: "33%", color: "#bfe9ff", opacity: 0.95 },
  { offset: "52%", color: "#7fd0ff", opacity: 0.95 },
  { offset: "74%", color: "#3f93d8", opacity: 0.95 },
  { offset: "100%", color: "#1f6fc0", opacity: 0.92 },
];

export default function V19Filament({
  variant = "lane",
  laneSelector = ".v19-worklane",
  featuredWordSel = ".v19fw-title-word",
  ourWordSel = ".v19ow-title-word",
  workSel = ".v19ow-title em",
  designSel = ".v19-line-4 .v19-line-word",
  heroSelector = ".v19-hero",
  stops = DEFAULT_STOPS,
} = {}) {
  const isLead = variant === "lead";
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

    const container = isLead
      ? root.closest(heroSelector) || root.parentElement
      : root.closest(laneSelector) || root.parentElement;
    if (!container) return;

    const boxIn = (el) => {
      if (!el) return null;
      const s = container.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        l: r.left - s.left,
        r: r.right - s.left,
        t: r.top - s.top,
        b: r.bottom - s.top,
        cy: r.top - s.top + r.height / 2,
      };
    };

    if (isLead) {
      const designEl = container.querySelector(designSel);
      const wipe = { el: designEl, s1: -1, s2: -1, ready: false };
      const geom = { len: 0 };
      const setWipe = (frac) =>
        wipe.el && wipe.el.style.setProperty("--v19-wipe", (frac * 100).toFixed(2) + "%");

      const measure = (resetOffset = true) => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (!w || !h) return;
        const dBox = boxIn(designEl);
        if (!dBox) return;
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        path.setAttribute("d", buildLeadPath(w, h, dBox));
        const len = path.getTotalLength();
        geom.len = len;
        wipe.s1 = -1; wipe.s2 = -1; wipe.ready = false;
        const N = 320;
        for (let i = 0; i <= N; i++) {
          const s = (len * i) / N;
          const pt = path.getPointAtLength(s);
          if (pt.x >= dBox.l - 1 && pt.x <= dBox.r + 1 && pt.y >= dBox.t - 2 && pt.y <= dBox.b + 2) {
            if (wipe.s1 < 0) wipe.s1 = s;
            wipe.s2 = s;
          }
        }
        if (wipe.s1 >= 0 && wipe.s2 > wipe.s1) wipe.ready = true;
        const drawable = Math.max(0, len - LEAD_SEED_PX);
        if (resetOffset) {
          gsap.set(path, {
            strokeDasharray: len,
            strokeDashoffset: reduced ? 0 : drawable,
          });
        } else {
          gsap.set(path, { strokeDasharray: len });
        }
        if (reduced) setWipe(1);
      };

      const applyWipe = (p) => {
        if (!wipe.ready || !geom.len) return;
        const a = wipe.s1 / geom.len;
        const b = wipe.s2 / geom.len;
        setWipe(Math.min(1, Math.max(0, (p - a) / (b - a))));
      };

      const ctx = gsap.context(() => {
        measure();
        if (!reduced) {
          const state = { p: 0 };
          gsap.to(state, {
            p: 1,
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top top",
              end: "bottom top",
              scrub: 1.6,
            },
            onUpdate: () => {
              const p = state.p;
              const drawable = Math.max(0, geom.len - LEAD_SEED_PX);
              path.style.strokeDashoffset = String(drawable * (1 - p));
              applyWipe(p);
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
      ro.observe(container);

      return () => {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        ctx.revert();
        if (wipe.el) wipe.el.style.removeProperty("--v19-wipe");
      };
    }

    // ----- variant === "lane" (existing behaviour) -----
    const lane = container;
    if (!lane) return;

    const fwEl = lane.querySelector(featuredWordSel);
    const ourEl = lane.querySelector(ourWordSel);
    const workEl = lane.querySelector(workSel);

    // wipe targets: each fills with its --v19-lit colour as the line tip
    // crosses it. window = arc-length range where the path is inside its box.
    const targets = [fwEl, ourEl, workEl]
      .filter(Boolean)
      .map((el) => ({ el, s1: -1, s2: -1, ready: false }));

    const clearWipes = () =>
      targets.forEach((t) => t.el.style.removeProperty("--v19-wipe"));
    const setWipe = (t, frac) =>
      t.el.style.setProperty("--v19-wipe", (frac * 100).toFixed(2) + "%");

    const geom = { len: 0 };

    const measure = (resetOffset = true) => {
      const w = lane.clientWidth;
      const h = lane.scrollHeight || lane.clientHeight;
      if (!w || !h) return;

      const fw = boxIn(fwEl);
      const ourW = boxIn(ourEl);
      const workE = boxIn(workEl);

      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      path.setAttribute("d", buildLanePath(w, h, fw, ourW, workE));
      const len = path.getTotalLength();
      geom.len = len;

      // find the arc-length window each word occupies along the path
      const boxes = [fw, ourW, workE].filter(Boolean);
      targets.forEach((t, ti) => {
        t.ready = false;
        t.s1 = -1;
        t.s2 = -1;
      });
      if (len) {
        const N = 520;
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
            start: "top 80%",
            end: "bottom bottom",
            scrub: 2.5,
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
  }, [reduced, variant, laneSelector, featuredWordSel, ourWordSel, workSel, designSel, heroSelector]);

  return (
    <div
      ref={rootRef}
      className={`v19-filament${isLead ? " v19-filament--lead" : ""}`}
      aria-hidden="true"
    >
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
