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

export default function V5ZoomTour() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const slotRefs = useRef([]);
  const rectsRef = useRef(featuredZoom.map(() => null));
  const [, force] = useState(0);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
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

  const stageW = () => (stageRef.current ? stageRef.current.clientWidth : 1);
  const stageH = () => (stageRef.current ? stageRef.current.clientHeight : 1);

  const focus = featuredZoom.map((p, i) => {
    const box = (key) =>
      useTransform(scrollYProgress, (v) => {
        const rect = rectsRef.current[i];
        if (!rect) return 0;
        const a = liftAmt(localProgress(v, i));
        const full = { x: 0, y: 0, w: stageW(), h: stageH() };
        if (key === "left") return lerp(rect.x, full.x, a);
        if (key === "top") return lerp(rect.y, full.y, a);
        if (key === "width") return lerp(rect.w, full.w, a);
        return lerp(rect.h, full.h, a);
      });
    const pOpacity = useTransform(scrollYProgress, (v) =>
      panelAmt(localProgress(v, i))
    );
    const pY = useTransform(scrollYProgress, (v) =>
      lerp(24, 0, panelAmt(localProgress(v, i)))
    );
    return {
      left: box("left"),
      top: box("top"),
      width: box("width"),
      height: box("height"),
      pOpacity,
      pY,
    };
  });

  const dim = useTransform(scrollYProgress, (v) => {
    let m = 0;
    for (let i = 0; i < N; i++) m = Math.max(m, liftAmt(localProgress(v, i)));
    return 1 - 0.72 * m;
  });

  const activeIdx = new Set(featuredZoom.map((p) => p.slotIndex));
  const gridTiles = [0, 1, 2, 3, 4];

  return (
    <section className="v5-zt" ref={containerRef} data-section="v5-zoom-tour">
      <div className="v5-zt-stage" ref={stageRef}>
        <div className="v5-zt-grid" aria-hidden="true">
          <div className="container v5-grid-inner">
            {gridTiles.map((slot) => {
              const proj = featuredZoom.find((p) => p.slotIndex === slot);
              const ref = proj
                ? (el) => (slotRefs.current[featuredZoom.indexOf(proj)] = el)
                : undefined;
              return (
                <div
                  key={slot}
                  className="v5-grid-slot"
                  data-slot-index={slot}
                  ref={ref}
                >
                  {!activeIdx.has(slot) && (
                    <motion.div className="v5-zt-tile" style={{ opacity: dim }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {featuredZoom.map((p, i) => (
          <div key={p.id}>
            <motion.div
              className="v5-zt-focus"
              style={{
                left: focus[i].left,
                top: focus[i].top,
                width: focus[i].width,
                height: focus[i].height,
              }}
            >
              <img src={p.image} alt={`${p.client} — ${p.project}`} />
            </motion.div>

            <motion.div
              className="v5-zt-panel"
              style={{ opacity: focus[i].pOpacity, y: focus[i].pY }}
            >
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
              <a className="v5-zt-cta" href={p.href}>
                View full case →
              </a>
            </motion.div>
          </div>
        ))}
      </div>

      <div className="v5-zt-rm">
        {featuredZoom.map((p) => (
          <div className="v5-zt-rm-item" key={p.id}>
            <img src={p.image} alt={`${p.client} — ${p.project}`} />
            <div className="v5-zt-panel">
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
              <a className="v5-zt-cta" href={p.href}>
                View full case →
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
