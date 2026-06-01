"use client";

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { buildMotionMattersStructure } from "./mmGlyphs";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const MOBILE_MAX = 820;

/* Build the HEAD path (M 0 0 → FEATURED crossing → descent through cards →
   end at the first M's bottom-left with tangent UP). Returns the `d` plus
   substrings of cumulative arc-length up to the start/end of FEATURED so
   the renderer can drive the FEATURED colour wipe off head progress. */
function buildHeadPath(w, h, fw, fNarr, mm, letterEntry) {
  const cx = w / 2;
  if (!fw || !letterEntry) {
    const d = `M 0 0 C ${w * 0.12} ${h * 0.1}, ${cx} ${h * 0.4}, ${cx} ${h}`;
    return { d, sFeatStart: d, sFeatEnd: d };
  }

  const fy = fw.cy;
  const fGuard = Math.max(fw.r, fNarr ? fNarr.r : fw.r);
  const fRight = Math.min(w - w * 0.04, fGuard + w * 0.05);
  // a generous proxy for the vertical span the head has to descend through;
  // mm.cy is the panel center, which lies between FEATURED and OUR WORK.
  const span = Math.max(letterEntry.y - fy, 100);

  const headEndX = letterEntry.x;
  const headEndY = letterEntry.y;
  const scale = mm ? Math.min((mm.r - mm.l) * 0.8, (mm.b - mm.t) * 1.2) : 80;
  const HOOK_HEIGHT = mm ? Math.max(60, scale * 0.12) : 80;
  const UP_LEAD = mm ? Math.max(12, scale * 0.018) : 80;
  const plateauX = headEndX;
  const plateauY = headEndY - HOOK_HEIGHT;

  const headSweep =
    w <= MOBILE_MAX
      ? `M 0 0 C ${fw.l * 0.4} ${fy * 0.5}, ${fw.l * 0.75} ${fy}, ${fw.l} ${fy} `
      : `M 0 0 C ${fw.l * 0.3} ${fy * 0.45}, ${fw.l * 0.72} ${fy}, ${fw.l} ${fy} `;
  const featCross = `L ${fw.r} ${fy} `;

  // Descent: right rail (only on desktop) → sweep to plateau → hook to M.
  const headDescent = mm
    ? (w <= MOBILE_MAX
        ? `C ${fRight} ${fy}, ${plateauX} ${plateauY}, ${plateauX} ${plateauY} `
        : `C ${fRight} ${fy}, ${fRight} ${fy + span * 0.05}, ${fRight} ${fy + span * 0.15} ` +
          `C ${fRight} ${plateauY}, ${plateauX} ${plateauY - 60}, ${plateauX} ${plateauY} `) +
      `C ${plateauX} ${plateauY + HOOK_HEIGHT * 0.45}, ${headEndX} ${headEndY + UP_LEAD}, ${headEndX} ${headEndY}`
    : (w <= MOBILE_MAX
        ? `C ${fRight} ${fy + span * 0.2}, ${headEndX} ${headEndY - 80}, ${headEndX} ${headEndY}`
        : `C ${fRight} ${fy}, ${fRight} ${fy + span * 0.22}, ${fRight} ${fy + span * 0.38} ` +
          `C ${fRight} ${fy + span * 0.58}, ${headEndX} ${headEndY - 80}, ${headEndX} ${headEndY}`);

  return {
    d: headSweep + featCross + headDescent,
    sFeatStart: headSweep,
    sFeatEnd: headSweep + featCross,
  };
}

/* Build the TAIL path (last S's bottom-right → curve out → OUR WORK crossing
   → descend to lane bottom). Returns the `d` plus cumulative substrings
   for the start/end of the OUR WORK crossing, so the renderer can drive
   the OUR + work colour wipes off tail progress. */
function buildTailPath(w, h, ourW, workE, letterExit, mm) {
  const cx = w / 2;
  if (!ourW || !letterExit) {
    const d = `M ${cx} 0 L ${cx} ${h}`;
    return { d, sOurStart: d, sOurEnd: d };
  }
  const oy = ourW.cy;
  const ourL = ourW.l;
  const workR = workE ? workE.r : ourW.r;
  const owRight = Math.min(w - w * 0.04, Math.max(workR, ourL) + w * 0.04);

  const scale = mm ? Math.min((mm.r - mm.l) * 0.8, (mm.b - mm.t) * 1.2) : 80;
  const EXIT_LEAD = mm ? Math.max(50, scale * 0.11) : 80;

  const penX = letterExit.x;
  const penY = letterExit.y;
  const tailCp1X = penX + EXIT_LEAD * 0.81;
  const tailCp1Y = penY + EXIT_LEAD * 0.58;

  const tailHead = `M ${penX} ${penY}`;
  const tailApproach =
    w <= MOBILE_MAX
      ? ` C ${tailCp1X} ${tailCp1Y}, ${ourL * 0.7} ${oy}, ${ourL} ${oy} `
      : ` C ${tailCp1X} ${tailCp1Y}, ${ourL * 0.72} ${oy}, ${ourL} ${oy} `;
  const ourCross = `L ${workR} ${oy} `;
  const tailDescent =
    w <= MOBILE_MAX
      ? `C ${owRight} ${oy}, ${cx} ${oy + (h - oy) * 0.5}, ${cx} ${oy + (h - oy) * 0.75} ` +
        `S ${cx} ${h * 0.92}, ${cx} ${h}`
      : `C ${owRight} ${oy}, ${owRight} ${oy + (h - oy) * 0.28}, ${owRight} ${oy + (h - oy) * 0.48} ` +
        `C ${owRight} ${h * 0.82}, ${cx} ${h * 0.9}, ${cx} ${h}`;

  return {
    d: tailHead + tailApproach + ourCross + tailDescent,
    sOurStart: tailHead + tailApproach,
    sOurEnd: tailHead + tailApproach + ourCross,
  };
}

const DEFAULT_STOPS = [
  { offset: "0%", color: "#6fd3ff", opacity: 0.0 },
  { offset: "5%", color: "#9fe0ff", opacity: 0.9 },
  { offset: "33%", color: "#bfe9ff", opacity: 0.95 },
  { offset: "52%", color: "#7fd0ff", opacity: 0.95 },
  { offset: "74%", color: "#3f93d8", opacity: 0.95 },
  { offset: "100%", color: "#1f6fc0", opacity: 0.92 },
];

const SVG_NS = "http://www.w3.org/2000/svg";

export default function V21Filament({
  laneSelector = ".v21-worklane",
  featuredWordSel = ".v21fw-title-word",
  featuredEmSel = ".v21fw-title em",
  ourWordSel = ".v21ow-title-word",
  workSel = ".v21ow-title em",
  stops = DEFAULT_STOPS,
} = {}) {
  const rootRef = useRef(null);
  const svgRef = useRef(null);
  const groupRef = useRef(null); // <g> containing all filament paths
  const reduced = usePrefersReducedMotion();
  const gradId = "v21-filament-grad-" + useId().replace(/:/g, "");

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    const group = groupRef.current;
    if (!root || !svg || !group) return;

    const lane = root.closest(laneSelector) || root.parentElement;
    if (!lane) return;

    const fwEl = lane.querySelector(featuredWordSel);
    const fNarrEl = lane.querySelector(featuredEmSel);
    const ourEl = lane.querySelector(ourWordSel);
    const workEl = lane.querySelector(workSel);

    const wipeEls = [fwEl, ourEl, workEl].filter(Boolean);
    const clearWipes = () =>
      wipeEls.forEach((el) => el.style.removeProperty("--v21-wipe"));
    const setWipe = (el, frac) =>
      el && el.style.setProperty("--v21-wipe", (frac * 100).toFixed(2) + "%");
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

    // Hidden sibling path for measuring arc lengths of substrings.
    const mpath = document.createElementNS(SVG_NS, "path");
    mpath.setAttribute("fill", "none");
    mpath.setAttribute("stroke", "none");
    svg.appendChild(mpath);
    const lenOf = (sub) => {
      if (!sub) return 0;
      mpath.setAttribute("d", sub);
      return mpath.getTotalLength();
    };

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

    // Make / configure one <path> element. Reused across rebuilds.
    const makePath = () => {
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", `url(#${gradId})`);
      p.setAttribute("stroke-width", "8");
      p.setAttribute("stroke-linecap", "round");
      p.classList.add("v21-filament-path");
      group.appendChild(p);
      return p;
    };

    // Pools of path elements indexed by role. Lazily grown as needed; we
    // never shrink — surplus paths get their `d` cleared so they render
    // nothing without churning the DOM.
    const headEl = makePath();
    const tailEl = makePath();
    const letterEls = [];
    const connectorEls = [];

    // --- comet head: a spark that rides the current draw frontier ----------
    const comet = document.createElementNS(SVG_NS, "g");
    comet.setAttribute("class", "v21-comet");
    comet.style.display = "none";
    const cometFlareH = document.createElementNS(SVG_NS, "line");
    cometFlareH.setAttribute("x1", "-9");
    cometFlareH.setAttribute("y1", "0");
    cometFlareH.setAttribute("x2", "9");
    cometFlareH.setAttribute("y2", "0");
    cometFlareH.setAttribute("class", "v21-comet-flare");
    const cometFlareV = document.createElementNS(SVG_NS, "line");
    cometFlareV.setAttribute("x1", "0");
    cometFlareV.setAttribute("y1", "-9");
    cometFlareV.setAttribute("x2", "0");
    cometFlareV.setAttribute("y2", "9");
    cometFlareV.setAttribute("class", "v21-comet-flare");
    const cometCore = document.createElementNS(SVG_NS, "circle");
    cometCore.setAttribute("r", "3");
    cometCore.setAttribute("class", "v21-comet-core");
    comet.appendChild(cometFlareH);
    comet.appendChild(cometFlareV);
    comet.appendChild(cometCore);
    group.appendChild(comet); // last child of <g> → paints on top of the stroke

    const ptOf = (el, L, prog) => {
      const p = prog < 0 ? 0 : prog > 1 ? 1 : prog;
      if (!el || p <= 0 || L <= 0) return null;
      try {
        return el.getPointAtLength(L * p);
      } catch {
        return null;
      }
    };
    const placeComet = (pt) => {
      if (!pt) {
        comet.style.display = "none";
        return;
      }
      comet.setAttribute(
        "transform",
        `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`
      );
      comet.style.display = "";
    };

    const ensurePool = (pool, count) => {
      while (pool.length < count) pool.push(makePath());
      for (let i = count; i < pool.length; i++) pool[i].setAttribute("d", "");
    };

    // Live geometry: per-path lengths + arc-length markers for wipes.
    const geom = {
      headLen: 0, headFeatStart: 0, headFeatEnd: 0,
      tailLen: 0, tailOurStart: 0, tailOurEnd: 0,
      letterLens: [],
      connectorLens: [],
      fw: null, ourW: null, workE: null,
      ourL: 0, workR: 0,
    };

    const setPathLen = (el, dStr) => {
      el.setAttribute("d", dStr || "");
      const L = dStr ? el.getTotalLength() : 0;
      el.style.strokeDasharray = String(L);
      el.style.strokeDashoffset = String(L);
      return L;
    };

    // Rebuild everything from the current layout.
    const rebuild = () => {
      const w = lane.clientWidth;
      const h = lane.scrollHeight || lane.clientHeight;
      if (!w || !h) return;

      const fw = boxIn(fwEl);
      const fNarr = boxIn(fNarrEl);
      const ourW = boxIn(ourEl);
      const workE = boxIn(workEl);
      const mm = boxIn(lane.querySelector("[data-v21-mm-box]"));

      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      // Letters + connectors (only if MM panel + boxes exist).
      const mmStruct = mm ? buildMotionMattersStructure(mm) : null;
      const letters = mmStruct ? mmStruct.letters : [];
      const connectors = mmStruct ? mmStruct.connectors : [];
      const letterEntry = mmStruct ? mmStruct.entry : null;
      const letterExit = mmStruct ? mmStruct.exit : null;

      ensurePool(letterEls, letters.length);
      ensurePool(connectorEls, connectors.length);

      geom.letterLens = [];
      geom.connectorLens = [];
      for (let i = 0; i < letters.length; i++) {
        geom.letterLens.push(setPathLen(letterEls[i], letters[i].d));
      }
      for (let i = 0; i < connectors.length; i++) {
        geom.connectorLens.push(setPathLen(connectorEls[i], connectors[i].d));
      }

      // Head + tail.
      const head = buildHeadPath(w, h, fw, fNarr, mm, letterEntry);
      const tail = buildTailPath(w, h, ourW, workE, letterExit, mm);
      geom.headLen = setPathLen(headEl, head.d);
      geom.tailLen = setPathLen(tailEl, tail.d);
      geom.headFeatStart = lenOf(head.sFeatStart);
      geom.headFeatEnd = lenOf(head.sFeatEnd);
      geom.tailOurStart = lenOf(tail.sOurStart);
      geom.tailOurEnd = lenOf(tail.sOurEnd);

      geom.fw = fw; geom.ourW = ourW; geom.workE = workE;
      geom.ourL = ourW ? ourW.l : 0;
      geom.workR = workE ? workE.r : ourW ? ourW.r : 0;
    };

    // Wipes — Featured driven off head's tip arc, OUR/work off tail's tip arc.
    const paintWipes = (headTipArc, tailTipArc) => {
      const frac = (t, a, b) => (b > a ? clamp01((t - a) / (b - a)) : t >= b ? 1 : 0);
      if (geom.fw) setWipe(fwEl, frac(headTipArc, geom.headFeatStart, geom.headFeatEnd));
      const span = geom.workR - geom.ourL;
      if (span > 0) {
        const arcOfX = (x) =>
          geom.tailOurStart + clamp01((x - geom.ourL) / span) * (geom.tailOurEnd - geom.tailOurStart);
        if (geom.ourW) setWipe(ourEl, frac(tailTipArc, arcOfX(geom.ourW.l), arcOfX(geom.ourW.r)));
        if (geom.workE) setWipe(workEl, frac(tailTipArc, arcOfX(geom.workE.l), arcOfX(geom.workE.r)));
      }
    };

    // Find the MOTION MATTERS pin trigger so we can anchor letter timing.
    let pinTrigger = null;
    const getPin = () => {
      if (pinTrigger && pinTrigger.trigger && pinTrigger.trigger.isConnected)
        return pinTrigger;
      pinTrigger =
        ScrollTrigger.getAll().find(
          (t) =>
            t.vars &&
            t.vars.pin &&
            t.trigger &&
            t.trigger.classList &&
            t.trigger.classList.contains("v21-mm")
        ) || null;
      return pinTrigger;
    };

    // Within each letter's pin sub-slot, the connector reveals during the
    // first CONN_FRAC of the slot, then the letter reveals during the rest.
    const CONN_FRAC = 0.22;

    // Linear interpolation used by the piecewise scroll → progress maps.
    const seg = (x, x0, x1, p0, p1) =>
      x <= x0 ? p0 : x >= x1 ? p1 : p0 + (p1 - p0) * ((x - x0) / (x1 - x0));

    const draw = (scroll) => {
      rebuild();
      if (!geom.headLen) return;

      const Vh = window.innerHeight || 900;
      const laneRect = lane.getBoundingClientRect();
      const laneTopAbs = laneRect.top + window.scrollY;
      const laneBottomAbs = laneTopAbs + (lane.scrollHeight || lane.clientHeight);

      const featCenterAbs = geom.fw ? laneTopAbs + geom.fw.cy : laneTopAbs;
      const ourCenterAbs = geom.ourW ? laneTopAbs + geom.ourW.cy : laneBottomAbs;
      const pin = getPin();
      const pinStart = pin ? pin.start : ourCenterAbs - Vh;
      const pinEnd = pin ? pin.end : pinStart + 2 * Vh;

      // Three head sub-windows in scroll-space (strictly increasing):
      //   drawBegin   → featCrossStart : line sweeps in toward FEATURED
      //   featCrossStart → featCrossEnd : line crosses FEATURED + colour wipe
      //                                    (DEDICATED scroll runway so the
      //                                    user actually watches the wipe;
      //                                    ~0.35*Vh ≈ 315px of scroll)
      //   featCrossEnd → pinStart       : descent through the cards
      let drawBegin = laneTopAbs - 0.55 * Vh;
      let featCrossStart = featCenterAbs - 0.5 * Vh;
      let featCrossEnd = featCenterAbs - 0.18 * Vh;
      let aPinStart = pinStart;
      let aPinEnd = pinEnd;
      // OUR sub-window: prefer the "OUR in view" position, but if that
      // would overlap the pin (because the pin spacer pushes OUR down so
      // it enters view DURING the pin, not after), anchor relative to
      // aPinEnd so the wipe still gets ≥ 280px of dedicated scroll runway.
      const OUR_WIPE_RUNWAY = Math.max(280, 0.3 * Vh);
      let ourCrossStart = Math.max(ourCenterAbs - 0.55 * Vh, aPinEnd + 40);
      let ourCrossEnd = Math.max(ourCenterAbs - 0.2 * Vh, ourCrossStart + OUR_WIPE_RUNWAY);
      let drawEnd = laneBottomAbs - Vh;
      featCrossStart = Math.max(featCrossStart, drawBegin + 1);
      featCrossEnd = Math.max(featCrossEnd, featCrossStart + 1);
      aPinStart = Math.max(aPinStart, featCrossEnd + 1);
      aPinEnd = Math.max(aPinEnd, aPinStart + 1);
      ourCrossStart = Math.max(ourCrossStart, aPinEnd + 1);
      ourCrossEnd = Math.max(ourCrossEnd, ourCrossStart + 1);
      drawEnd = Math.max(drawEnd, ourCrossEnd + 1);

      // HEAD: 3-segment piecewise. Segment 2 dedicates a comfortable scroll
      // range to the FEATURED arc range [headFeatStart, headFeatEnd], so the
      // visible line tip crawls across FEATURED at a watchable pace and the
      // colour wipe (tied to the tip arc) fills the word visibly. Segments 1
      // and 3 cover empty-space sweep and descent — speed there is fine.
      const fHeadFeatStart = geom.headLen > 0 ? geom.headFeatStart / geom.headLen : 0;
      const fHeadFeatEnd = geom.headLen > 0 ? geom.headFeatEnd / geom.headLen : 0;
      let headProg;
      if (scroll <= drawBegin) headProg = 0;
      else if (scroll <= featCrossStart)
        headProg = seg(scroll, drawBegin, featCrossStart, 0, fHeadFeatStart);
      else if (scroll <= featCrossEnd)
        headProg = seg(scroll, featCrossStart, featCrossEnd, fHeadFeatStart, fHeadFeatEnd);
      else headProg = seg(scroll, featCrossEnd, aPinStart, fHeadFeatEnd, 1);
      headProg = clamp01(headProg);
      headEl.style.strokeDashoffset = String(geom.headLen * (1 - headProg));

      // LETTERS + CONNECTORS: pin window divided into N equal sub-slots.
      const N = geom.letterLens.length;
      if (N > 0) {
        const pinW = aPinEnd - aPinStart;
        const slotW = pinW / N;
        for (let i = 0; i < N; i++) {
          const slotStart = aPinStart + i * slotW;
          const slotEnd = slotStart + slotW;
          if (i > 0 && connectorEls[i - 1]) {
            const connEnd = slotStart + slotW * CONN_FRAC;
            const cProg = clamp01((scroll - slotStart) / (connEnd - slotStart));
            connectorEls[i - 1].style.strokeDashoffset = String(
              geom.connectorLens[i - 1] * (1 - cProg)
            );
          }
          // letter reveals over either the full slot (i=0) or after the connector.
          const lStart = i === 0 ? slotStart : slotStart + slotW * CONN_FRAC;
          const lProg = clamp01((scroll - lStart) / (slotEnd - lStart));
          letterEls[i].style.strokeDashoffset = String(
            geom.letterLens[i] * (1 - lProg)
          );
        }
      }

      // TAIL: 3-segment piecewise mirroring the head's pattern. The OUR WORK
      // arc range [tailOurStart, tailOurEnd] gets its own dedicated scroll
      // sub-window so the wipe across OUR + WORK is watchable too.
      const fTailOurStart = geom.tailLen > 0 ? geom.tailOurStart / geom.tailLen : 0;
      const fTailOurEnd = geom.tailLen > 0 ? geom.tailOurEnd / geom.tailLen : 0;
      let tailProg;
      if (scroll <= aPinEnd) tailProg = 0;
      else if (scroll <= ourCrossStart)
        tailProg = seg(scroll, aPinEnd, ourCrossStart, 0, fTailOurStart);
      else if (scroll <= ourCrossEnd)
        tailProg = seg(scroll, ourCrossStart, ourCrossEnd, fTailOurStart, fTailOurEnd);
      else tailProg = seg(scroll, ourCrossEnd, drawEnd, fTailOurEnd, 1);
      tailProg = clamp01(tailProg);
      tailEl.style.strokeDashoffset = String(geom.tailLen * (1 - tailProg));

      paintWipes(headProg * geom.headLen, tailProg * geom.tailLen);

      // Comet rides the furthest-drawn frontier: tail → letters (during the
      // pin) → head → parked at head end (head done, pin not yet begun). Reads
      // the ACTUAL drawn length so the head→letters→tail handoff has no jump.
      // (The slot math here mirrors the LETTERS loop above; keep them in sync.)
      let tip = null;
      if (tailProg > 0 && tailProg < 0.999) {
        tip = ptOf(tailEl, geom.tailLen, tailProg);
      } else if (scroll >= aPinStart && scroll <= aPinEnd && N > 0) {
        const cSlotW = (aPinEnd - aPinStart) / N;
        let idx = Math.floor((scroll - aPinStart) / cSlotW);
        if (idx < 0) idx = 0;
        else if (idx > N - 1) idx = N - 1;
        const slotStart = aPinStart + idx * cSlotW;
        const slotEnd = slotStart + cSlotW;
        const connEnd = slotStart + cSlotW * CONN_FRAC;
        if (idx > 0 && scroll < connEnd && connectorEls[idx - 1]) {
          const cProg = clamp01((scroll - slotStart) / (connEnd - slotStart));
          tip = ptOf(connectorEls[idx - 1], geom.connectorLens[idx - 1], cProg);
        } else {
          const lStart = idx === 0 ? slotStart : connEnd;
          const lProg = clamp01((scroll - lStart) / (slotEnd - lStart));
          tip = ptOf(letterEls[idx], geom.letterLens[idx], lProg);
        }
        // Seam guard: at a slot/connector start the sub-progress is 0 (→ null);
        // park the spark at the head end (= where the first letter begins) so
        // the head→letters seam stays continuous.
        if (!tip) tip = ptOf(headEl, geom.headLen, 1);
      } else if (headProg > 0 && headProg < 1) {
        tip = ptOf(headEl, geom.headLen, headProg);
      } else if (headProg >= 1 && scroll < aPinStart) {
        tip = ptOf(headEl, geom.headLen, 1);
      }
      placeComet(tip);
    };

    const drawStaticFull = () => {
      rebuild();
      headEl.style.strokeDashoffset = "0";
      tailEl.style.strokeDashoffset = "0";
      for (let i = 0; i < geom.letterLens.length; i++)
        letterEls[i].style.strokeDashoffset = "0";
      for (let i = 0; i < geom.connectorLens.length; i++)
        connectorEls[i].style.strokeDashoffset = "0";
      paintWipes(geom.headLen, geom.tailLen);
    };

    const ctx = gsap.context(() => {
      if (reduced) {
        drawStaticFull();
        return;
      }
      rebuild();
      ScrollTrigger.create({
        trigger: lane,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => draw(self.scroll()),
        onRefresh: () => draw(window.scrollY),
      });
    }, root);

    let rafId = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (reduced) drawStaticFull();
        else ScrollTrigger.refresh();
      });
    });
    ro.observe(lane);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      ctx.revert();
      clearWipes();
      mpath.remove();
      comet.remove();
      // Remove all created paths from the DOM.
      headEl.remove();
      tailEl.remove();
      letterEls.forEach((el) => el.remove());
      connectorEls.forEach((el) => el.remove());
    };
  }, [reduced, laneSelector, featuredWordSel, featuredEmSel, ourWordSel, workSel]);

  return (
    <div ref={rootRef} className="v21-filament" aria-hidden="true">
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
        <g ref={groupRef} />
      </svg>
    </div>
  );
}
