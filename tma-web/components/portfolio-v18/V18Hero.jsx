"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

/**
 * V18Hero
 *
 * Mirrors the home-page hero composition (meta row → big title → blurb + stats
 * → scroll cue) but the background is alive: prism cones, a cursor-following
 * spotlight, and floating glyphs all parallax to the mouse with gsap.quickTo
 * lerps. Three different durations + amplitudes = depth.
 *
 * Title entrance is gated on `booted` so it rises in step with the preloader
 * lifting off.
 */
const reelTiles = [
  { cls: "stripe", label: "REEL · BOUNDLESS '23" },
  { cls: "dim", label: "FILM · ZID RIPPLE" },
  { cls: "bright", label: "STAGE · DIRIYAH" },
  { cls: "dot", label: "MOTION · LOOP 04" },
  { cls: "bright", label: "BTS · SHOOT DAY 2" },
  { cls: "stripe", label: "TITLE CARD · 04" },
  { cls: "dim", label: "PORTRAIT · CEO" },
  { cls: "dot", label: "PRODUCT · POS" },
  { cls: "stripe", label: "EVENT · KEYNOTE" },
  { cls: "bright", label: "REEL · BOUNDLESS '22" },
  { cls: "dim", label: "AERIAL · RIYADH" },
  { cls: "dot", label: "ID · LOGO LOOP" },
];

export default function V18Hero({ booted }) {
  const rootRef = useRef(null);
  const titleRef = useRef(null);
  const blueRef = useRef(null);
  const warmRef = useRef(null);
  const rimRef = useRef(null);
  const spotRef = useRef(null);
  const gridRef = useRef(null);
  const titleStageRef = useRef(null);
  const glyphsRef = useRef(null);

  // Mouse parallax — every layer gets its own quickTo (amplitude + ease).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const opts = (dur) => ({ duration: dur, ease: "power3" });
    const setters = {
      blueX: gsap.quickTo(blueRef.current, "x", opts(1.1)),
      blueY: gsap.quickTo(blueRef.current, "y", opts(1.1)),
      warmX: gsap.quickTo(warmRef.current, "x", opts(1.4)),
      warmY: gsap.quickTo(warmRef.current, "y", opts(1.4)),
      rimX: gsap.quickTo(rimRef.current, "x", opts(0.9)),
      rimY: gsap.quickTo(rimRef.current, "y", opts(0.9)),
      titleX: gsap.quickTo(titleStageRef.current, "x", opts(0.7)),
      titleY: gsap.quickTo(titleStageRef.current, "y", opts(0.7)),
      gridX: gsap.quickTo(gridRef.current, "x", opts(1.8)),
      gridY: gsap.quickTo(gridRef.current, "y", opts(1.8)),
      glyphsX: gsap.quickTo(glyphsRef.current, "x", opts(0.85)),
      glyphsY: gsap.quickTo(glyphsRef.current, "y", opts(0.85)),
      spotX: gsap.quickTo(spotRef.current, "--sx", { duration: 0.4, ease: "power2" }),
      spotY: gsap.quickTo(spotRef.current, "--sy", { duration: 0.4, ease: "power2" }),
    };

    const onMove = (e) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nx = e.clientX / w - 0.5; // -0.5 .. 0.5
      const ny = e.clientY / h - 0.5;

      setters.blueX(nx * 70);
      setters.blueY(ny * 50);
      setters.warmX(nx * -90);
      setters.warmY(ny * -60);
      setters.rimX(nx * 120);
      setters.rimY(ny * 80);
      setters.titleX(nx * -14);
      setters.titleY(ny * -10);
      setters.gridX(nx * -22);
      setters.gridY(ny * -16);
      setters.glyphsX(nx * 40);
      setters.glyphsY(ny * 28);

      if (spotRef.current) {
        spotRef.current.style.setProperty("--sx", `${e.clientX}px`);
        spotRef.current.style.setProperty("--sy", `${e.clientY}px`);
      }
    };

    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Lock initial state on mount so SSR and React Strict Mode double-fire are
  // both safe. GSAP owns the inline transforms from here on.
  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const words = rootRef.current.querySelectorAll(".v18-hero-word > span");
    gsap.set(words, { yPercent: 110 });
    gsap.set(
      rootRef.current.querySelectorAll(
        ".v18-hero-meta, .v18-hero-bottom, .v18-hero-scroll"
      ),
      { y: 24, opacity: 0 }
    );
  }, []);

  // Title entrance — synced with the preloader's curtain lift. `overwrite: true`
  // means a stale tween from a strict-mode double-fire gets killed cleanly,
  // and we deliberately do NOT call ctx.revert in cleanup — reverting yanks
  // GSAP's inline transforms back to their CSS rule and the words appear stuck.
  useEffect(() => {
    if (!booted || !rootRef.current) return;
    const words = rootRef.current.querySelectorAll(".v18-hero-word > span");
    gsap.to(words, {
      yPercent: 0,
      duration: 1.05,
      ease: "expo.out",
      stagger: 0.08,
      overwrite: true,
    });
    gsap.to(
      rootRef.current.querySelectorAll(
        ".v18-hero-meta, .v18-hero-bottom, .v18-hero-scroll"
      ),
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.25,
        overwrite: true,
      }
    );
  }, [booted]);

  return (
    <header
      ref={rootRef}
      className={`v18-hero ${booted ? "is-live" : ""}`}
      id="top"
    >
      <div className="v18-hero-bg">
        <div className="v18-hero-prism" aria-hidden>
          <div ref={blueRef} className="v18-hero-cone v18-hero-cone--blue" />
          <div ref={warmRef} className="v18-hero-cone v18-hero-cone--warm" />
          <div ref={rimRef} className="v18-hero-cone v18-hero-cone--rim" />
        </div>

        <div ref={glyphsRef} className="v18-hero-glyphs" aria-hidden>
          <span className="g g1">+</span>
          <span className="g g2">·</span>
          <span className="g g3">+</span>
          <span className="g g4">/</span>
          <span className="g g5">·</span>
          <span className="g g6">+</span>
          <span className="g g7">·</span>
        </div>

        <div ref={gridRef} className="v18-hero-grid" />

        <div className="v18-hero-reel" aria-hidden>
          {reelTiles.map((t, i) => (
            <div
              key={i}
              className={`v18-hero-reel-tile ${t.cls}`}
              data-label={t.label}
            >
              {i % 4 === 0 && <span className="pulse" />}
            </div>
          ))}
        </div>

        <div ref={spotRef} className="v18-hero-spot" aria-hidden />
        <div className="v18-hero-grain" aria-hidden />
        <div className="v18-hero-vignette" aria-hidden />
      </div>

      <div className="container v18-hero-container">
        <div className="v18-hero-meta">
          <div className="block">
            <span>EST.</span>
            <span className="v">2019</span>
          </div>
          <div className="block">
            <span>AMMAN</span>
            <span className="v">·</span>
            <span>RIYADH</span>
          </div>
          <div className="block">
            <span>PORTFOLIO</span>
            <span className="v">V18</span>
          </div>
        </div>

        <h1 ref={titleStageRef} className="v18-hero-title-stage">
          <span ref={titleRef} className="v18-hero-title">
            <span className="v18-hero-word">
              <span>THE</span>
            </span>{" "}
            <span className="v18-hero-word">
              <span>WORK</span>
            </span>
            <br />
            <span className="v18-hero-word">
              <span className="ital">DOES</span>
            </span>{" "}
            <span className="v18-hero-word">
              <span>THE</span>
            </span>
            <br />
            <span className="v18-hero-word">
              <span>TALKING.</span>
            </span>
          </span>
        </h1>

        <div className="v18-hero-bottom">
          <p className="v18-hero-blurb">
            <b>A selected reel</b> from the brands we've embedded with —
            strategy, design, and motion compounded into category leadership
            across the GCC. Every frame earned. Every result receipt-backed.
          </p>
          <div className="v18-hero-stats">
            <div className="stat">
              <div className="num">178%</div>
              <div className="lbl">Client growth</div>
            </div>
            <div className="stat">
              <div className="num">$1B</div>
              <div className="lbl">Unicorn built</div>
            </div>
            <div className="stat">
              <div className="num">30+</div>
              <div className="lbl">Brand partners</div>
            </div>
            <div className="stat">
              <div className="num">500+</div>
              <div className="lbl">Businesses created</div>
            </div>
          </div>
        </div>
      </div>

      <div className="v18-hero-scroll">
        Scroll <span className="line" /> 01 / —
      </div>
    </header>
  );
}
