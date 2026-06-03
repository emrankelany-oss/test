"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * V17 — Section 2: Featured carousel.
 *
 * Five cards (2 photo case-studies + 3 brand logo cards) land into a scattered
 * layout (the 2 featured continue the hero's downward motion). ◀ ▶ cycle which
 * card is centred; the counter tracks it. Scrolling zooms the centred card to
 * full-bleed — "entering the project's world" — reveals its info, then a clean
 * portal zoom-out hands off to the next section.
 *
 * Two independent transform layers avoid GSAP conflicts:
 *  - the scatter layer (arrow-driven positioning, any time)
 *  - the zoom layer  (scroll-driven full-bleed enter/exit)
 *
 * Reduced motion → static stack with info, arrows still cycle, no pin/zoom.
 */

const ITEMS = [
  {
    key: "foodics",
    kind: "photo",
    name: "Foodics",
    media: "/assets/case-foodics-boundless.png",
    tint: "linear-gradient(150deg,#4E008E,#250048)",
    metric: "$2M → $1B",
    sector: "F&B TECH · BOUNDLESS",
    disciplines: "Brand · Events · GTM",
    story:
      "From a $2M raise to a $1B unicorn — brand reputation & positioning, the flagship Boundless events, and GTM across Egypt, Kuwait, UAE & Jordan.",
    stats: ["8K → 32K+ merchants", "35% KSA market share", "$1B unicorn"],
  },
  {
    key: "zid",
    kind: "photo",
    name: "Zid",
    media: "/assets/case-zid-ripple.png",
    tint: "linear-gradient(150deg,#1f7ae0,#072a63)",
    metric: "+200% YoY",
    sector: "TOTAL COMMERCE · RIPPLE",
    disciplines: "Brand · Event · Campaigns",
    story:
      "Rebuilt the marketing org, launched a new brand & site, and created Ripple 2024 — Zid’s first product event. 200% growth in a year.",
    stats: ["+200% growth", "12K+ merchants", "Diriyah · 1000+ guests"],
  },
  {
    key: "burger-king",
    kind: "logo",
    name: "Burger King",
    media: "/assets/logos/burger-king.png",
    tint: "linear-gradient(150deg,#7a2410,#2c0d04)",
    metric: "KSA",
    sector: "QSR · NATIONAL CAMPAIGN",
    disciplines: "Campaign · OOH · TVC",
    story:
      "“Royal Taste” — a national KSA campaign across OOH, TVC, Ramadan and Drive-Thru.",
    stats: ["OOH at scale", "TVC", "Ramadan & Drive-Thru"],
  },
  {
    key: "electrolux",
    kind: "logo",
    name: "Electrolux",
    media: "/assets/logos/electrolux.png",
    tint: "linear-gradient(150deg,#0a3b6b,#04162b)",
    metric: "GLOBAL",
    sector: "CONSUMER · PRODUCT",
    disciplines: "Product Marketing · Content",
    story:
      "Product marketing & content — photography, brochures and brand-script collateral.",
    stats: ["Product photography", "Brochures", "Brand collateral"],
  },
  {
    key: "aramco",
    kind: "logo",
    name: "Aramco",
    media: "/assets/logos/aramco.png",
    tint: "linear-gradient(150deg,#0a6b3c,#04261a)",
    metric: "ENTERPRISE",
    sector: "ENERGY · ENTERPRISE",
    disciplines: "Brand · Communications",
    story: "Enterprise brand & communications work.",
    stats: ["Brand", "Communications", "Enterprise"],
  },
];

// scatter slots as fractions of the stage, by offset from the centred card
const SLOTS = [
  { x: 0, y: -0.01, s: 1, z: 50, o: 1 }, // 0 = focused
  { x: -0.4, y: -0.28, s: 0.42, z: 20, o: 0.8 },
  { x: 0.42, y: -0.22, s: 0.4, z: 20, o: 0.8 },
  { x: -0.43, y: 0.3, s: 0.4, z: 20, o: 0.8 },
  { x: 0.43, y: 0.28, s: 0.46, z: 20, o: 0.8 },
];
const N = ITEMS.length;

export default function V17Featured() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const scatterRef = useRef(null);
  const zoomRef = useRef(null);
  const cardEls = useRef([]);
  const [center, setCenter] = useState(0);
  const [reduced, setReduced] = useState(false);
  const centerRef = useRef(0);
  centerRef.current = center;

  // place every scatter card at its slot for the current centre
  const layout = useCallback((animate) => {
    const stage = stageRef.current;
    if (!stage) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    cardEls.current.forEach((el, i) => {
      if (!el) return;
      const slot = SLOTS[(i - centerRef.current + N) % N];
      const props = {
        x: slot.x * w,
        y: slot.y * h,
        scale: slot.s,
        autoAlpha: slot.o,
        zIndex: slot.z,
      };
      if (animate) {
        gsap.to(el, { ...props, duration: 0.7, ease: "power3.inOut" });
      } else {
        gsap.set(el, props);
      }
    });
  }, []);

  const go = useCallback(
    (dir) => setCenter((c) => (c + dir + N) % N),
    []
  );

  // detect reduced motion once
  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  // re-layout when the centred card changes (animated)
  useEffect(() => {
    if (reduced) return;
    layout(true);
  }, [center, reduced, layout]);

  // pin + scroll timeline (assemble → browse → zoom → portal)
  useEffect(() => {
    if (typeof window === "undefined" || reduced) return;
    const section = sectionRef.current;
    const scatter = scatterRef.current;
    const zoom = zoomRef.current;
    if (!section || !scatter || !zoom) return;

    const ctx = gsap.context(() => {
      layout(false); // initial slot placement
      gsap.set(scatter, { autoAlpha: 0, y: 80 });
      gsap.set(zoom, { autoAlpha: 0, scale: 1.18 });
      gsap.set(".v17-zoom-info", { autoAlpha: 0, y: 30 });
      // head + arrows stay visible/clickable through the whole browse;
      // they only fade once the zoom takes over (handled at 3.2 below).

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=2600",
          pin: true,
          scrub: true,
          anticipatePin: 1,
        },
      });

      // assemble — scatter rises in (featured cards continue hero motion)
      tl.to(scatter, { autoAlpha: 1, y: 0, ease: "power2.out", duration: 1 }, 0);

      // hold for browsing (1 → 3.2) — arrows/head remain clickable here
      tl.to({}, { duration: 2.2 });

      // hand off scatter → zoom
      tl.to(scatter, { autoAlpha: 0, scale: 0.96, duration: 0.7 }, 3.2);
      tl.to(
        ".v17-fx-head, .v17-fx-arrow, .v17-fx-count",
        { autoAlpha: 0, duration: 0.6 },
        3.2
      );

      // zoom in — enter the project's world
      tl.to(
        zoom,
        { autoAlpha: 1, scale: 1, duration: 1.1, ease: "power2.out" },
        3.5
      );
      tl.to(
        ".v17-zoom-info",
        { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" },
        4.0
      );

      // hold inside the world
      tl.to({}, { duration: 1.4 });

      // portal out — clean zoom-out hand-off
      tl.to(".v17-zoom-info", { autoAlpha: 0, y: -24, duration: 0.7 }, 6.2);
      tl.to(
        zoom,
        { scale: 1.32, autoAlpha: 0, duration: 1.1, ease: "power2.in" },
        6.4
      );
    }, sectionRef);

    const onResize = () => layout(false);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, [reduced, layout]);

  const focused = ITEMS[center];

  return (
    <section
      className={`v17-featured${reduced ? " is-static" : ""}`}
      ref={sectionRef}
      aria-label="Featured work"
    >
      <div className="v17-fx-stage" ref={stageRef}>
        <div className="v17-fx-head">
          <span className="v17-fx-kicker">FEATURED WORK</span>
          <span className="v17-fx-count">
            {String(center + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
          </span>
        </div>

        <div className="v17-scatter" ref={scatterRef}>
          {ITEMS.map((it, i) => (
            <article
              key={it.key}
              ref={(el) => (cardEls.current[i] = el)}
              className={`v17-fxcard v17-fxcard--${it.kind}${
                i === center ? " is-focus" : ""
              }`}
              style={{ backgroundImage: it.tint }}
              onClick={() => setCenter(i)}
            >
              <div
                className="v17-fxcard-media"
                style={{
                  backgroundImage: `url(${it.media})`,
                }}
              />
              <div className="v17-fxcard-foot">
                <span className="v17-fxcard-name">{it.name}</span>
                <span className="v17-fxcard-metric">{it.metric}</span>
              </div>
            </article>
          ))}
        </div>

        <button
          className="v17-fx-arrow v17-fx-arrow--prev"
          onClick={() => go(-1)}
          aria-label="Previous project"
        >
          ←
        </button>
        <button
          className="v17-fx-arrow v17-fx-arrow--next"
          onClick={() => go(1)}
          aria-label="Next project"
        >
          →
        </button>

        <div
          className="v17-zoom"
          ref={zoomRef}
          aria-hidden="true"
          style={{ backgroundImage: focused.tint }}
        >
          <div
            className={`v17-zoom-media v17-zoom-media--${focused.kind}`}
            style={{ backgroundImage: `url(${focused.media})` }}
          />
          <div className="v17-zoom-info">
            <span className="v17-zoom-sector">{focused.sector}</span>
            <h2 className="v17-zoom-name">{focused.name}</h2>
            <p className="v17-zoom-story">{focused.story}</p>
            <ul className="v17-zoom-stats">
              {focused.stats.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <span className="v17-zoom-disc">{focused.disciplines}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
