"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { featuredZoom } from "@/data/featured-zoom";

/**
 * V5 Zoom-Tour — scroll-scrubbed dive into the first featured projects.
 *
 * The Layout-C grid (replica, reusing .v5-grid-inner/.v5-grid-slot) is the
 * persistent home. Each project's focus layer lifts out of its exact slot
 * rect to full-bleed + a curated panel, then settles back into the slot.
 * scrollYProgress is split into equal segments (project i owns
 * [i/N,(i+1)/N]); inside each: lift 0→0.30, hold 0.30→0.70, return →1.
 *
 * Reuses the global Lenis from SmoothScroll (no second Lenis), no GSAP.
 */
const N = featuredZoom.length; // 2 this round
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const lerp = (a, b, t) => a + (b - a) * t;

// Trapezoid 0→1→1→0 across a project's local progress [0..1].
function liftAmt(lp) {
  if (lp <= 0 || lp >= 1) return 0;
  if (lp < 0.3) return lp / 0.3;
  if (lp > 0.7) return (1 - lp) / 0.3;
  return 1;
}
// Panel visible only mid-hold, with short ramps.
function panelAmt(lp) {
  if (lp < 0.34 || lp > 0.66) return 0;
  if (lp < 0.4) return (lp - 0.34) / 0.06;
  if (lp > 0.6) return (0.66 - lp) / 0.06;
  return 1;
}
const localProgress = (v, i) => clamp((v - i / N) / (1 / N));

const ACTIVE_SLOTS = new Set(featuredZoom.map((p) => p.slotIndex));
const GRID_TILES = [0, 1, 2, 3, 4];

function PanelInner({ p }) {
  return (
    <>
      <span className="v5-zt-kicker">
        {p.num} — {p.client} · {p.project}
      </span>
      <h2 className="v5-zt-headline">{p.headline}</h2>
      <p className="v5-zt-intro">{p.intro}</p>
      <div className="v5-zt-metrics">
        {p.metrics.map((m) => (
          <div className="v5-zt-metric" key={m.l}>
            <em>{m.v}</em>
            <span>{m.l}</span>
          </div>
        ))}
      </div>
      <blockquote className="v5-zt-quote">
        "{p.quote}"<span>{p.quoteBy}</span>
      </blockquote>
      <a
        className="v5-zt-cta"
        href={p.href}
        aria-label={`View full case: ${p.client} ${p.project}`}
      >
        View full case →
      </a>
    </>
  );
}

function ZoomProject({ p, i, scrollYProgress, rectsRef, stageRef }) {
  const stageW = () => (stageRef.current ? stageRef.current.clientWidth : 1);
  const stageH = () => (stageRef.current ? stageRef.current.clientHeight : 1);
  const compute = (key) => (v) => {
    const rect = rectsRef.current[i];
    if (!rect) return 0;
    const a = liftAmt(localProgress(v, i));
    if (key === "left") return lerp(rect.x, 0, a);
    if (key === "top") return lerp(rect.y, 0, a);
    if (key === "width") return lerp(rect.w, stageW(), a);
    return lerp(rect.h, stageH(), a); // height
  };
  const left = useTransform(scrollYProgress, compute("left"));
  const top = useTransform(scrollYProgress, compute("top"));
  const width = useTransform(scrollYProgress, compute("width"));
  const height = useTransform(scrollYProgress, compute("height"));
  const pOpacity = useTransform(scrollYProgress, (v) =>
    panelAmt(localProgress(v, i))
  );
  const pY = useTransform(scrollYProgress, (v) =>
    lerp(24, 0, panelAmt(localProgress(v, i)))
  );
  return (
    <>
      <motion.div
        className="v5-zt-focus"
        style={{ left, top, width, height }}
      >
        <img src={p.image} alt={`${p.client} — ${p.project}`} />
      </motion.div>
      <motion.div
        className="v5-zt-panel"
        aria-hidden="true"
        style={{ opacity: pOpacity, y: pY }}
      >
        <PanelInner p={p} />
      </motion.div>
    </>
  );
}

export default function V5ZoomTour() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const slotRefs = useRef([]);
  const rectsRef = useRef(featuredZoom.map(() => null));
  const [, force] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const s = stage.getBoundingClientRect();
      featuredZoom.forEach((p, idx) => {
        const el = slotRefs.current[idx];
        if (!el) return;
        const r = el.getBoundingClientRect();
        rectsRef.current[idx] = {
          x: r.left - s.left,
          y: r.top - s.top,
          w: r.width,
          h: r.height,
        };
      });
      force((n) => n + 1);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const dim = useTransform(scrollYProgress, (v) => {
    let m = 0;
    for (let i = 0; i < N; i++) m = Math.max(m, liftAmt(localProgress(v, i)));
    return 1 - 0.72 * m;
  });

  return (
    <section className="v5-zt" ref={containerRef} data-section="v5-zoom-tour">
      <div className="v5-zt-stage" ref={stageRef}>
        <div className="v5-zt-grid" aria-hidden="true">
          <div className="container v5-grid-inner">
            {GRID_TILES.map((slot) => {
              const projIdx = featuredZoom.findIndex(
                (p) => p.slotIndex === slot
              );
              const ref =
                projIdx >= 0
                  ? (el) => (slotRefs.current[projIdx] = el)
                  : undefined;
              return (
                <div
                  key={slot}
                  className="v5-grid-slot"
                  data-slot-index={slot}
                  ref={ref}
                >
                  {!ACTIVE_SLOTS.has(slot) && (
                    <motion.div className="v5-zt-tile" style={{ opacity: dim }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {featuredZoom.map((p, i) => (
          <ZoomProject
            key={p.id}
            p={p}
            i={i}
            scrollYProgress={scrollYProgress}
            rectsRef={rectsRef}
            stageRef={stageRef}
          />
        ))}
      </div>

      <div className="v5-zt-rm">
        {featuredZoom.map((p) => (
          <div className="v5-zt-rm-item" key={p.id}>
            <img src={p.image} alt={`${p.client} — ${p.project}`} />
            <div className="v5-zt-panel">
              <PanelInner p={p} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
