"use client";
import "./obsidian-hero.css";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { fraunces, grotesk } from "./fonts.js";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion.js";
import { useReliefLamp } from "./useReliefLamp.js";
import { useScrollProgress } from "./useScrollProgress.js";

export default function ObsidianHero({
  headlineTop = "Motion",
  headlineMain = "in every frame",
  reliefSrc = "/assets/obsidian-engine.webp",
  engineSrc = "/assets/obsidian-engine-cut.webp",
  footLeft = "The Motion Agency — Reel 2026",
  frameLeftSrc = "/assets/case-foodics-boundless.png",
  frameRightSrc = "/assets/case-zid-ripple.png",
  parallaxFactor = 0.08,
  className = "",
}) {
  const reduced = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  const disabled = reduced || failed;

  const rootRef = useRef(null);
  const captionRef = useRef(null);
  const { canvasRef, engineRef } = useReliefLamp({ imageSrc: reliefSrc, disabled, onFail });

  // One scroll value -> relief engine + engine push/scale + scroll-cue state.
  const onScroll = useCallback(
    (y) => {
      if (engineRef.current) engineRef.current.setScroll(y);
      const root = rootRef.current;
      if (!root) return;
      const vh = window.innerHeight || 1;
      const p = Math.max(0, Math.min(1, y / vh));
      root.style.setProperty("--eng-y", `${-p * 64}px`);
      root.style.setProperty("--eng-s", `${1 + p * 0.06}`);
      root.dataset.scrolled = y > 40 ? "true" : "false";
    },
    [engineRef]
  );

  useScrollProgress({
    sectionRef: rootRef,
    captionRef,
    onScroll,
    factor: parallaxFactor,
    disabled,
  });

  // Entrance — serif lines clip-reveal, engine floats up, scaffolding fades in.
  useEffect(() => {
    if (disabled) return;
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.set(".oh-in", { yPercent: 115 });
      gsap.set(".oh-engine", { opacity: 0 });
      gsap.set([".oh-lockup", ".oh-nav", ".oh-menu", ".oh-cap", ".oh-foot", ".oh-frame"], { opacity: 0 });
      gsap.set(root, { "--eng-enter": "70px" });

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.to(root, { "--eng-enter": "0px", duration: 1.5 }, 0)
        .to(".oh-engine", { opacity: 1, duration: 1.2 }, 0.05)
        .to(".oh-in", { yPercent: 0, duration: 1.25, stagger: 0.12 }, 0.2)
        .to(".oh-frame", { opacity: 1, duration: 1.4, stagger: 0.1 }, 0.35)
        .to(
          [".oh-lockup", ".oh-nav", ".oh-menu", ".oh-cap", ".oh-foot"],
          { opacity: 1, duration: 1.0, stagger: 0.05 },
          0.5
        );
    }, root);
    return () => ctx.revert();
  }, [disabled]);

  return (
    <section
      ref={rootRef}
      className={`oh-root ${fraunces.variable} ${grotesk.variable} ${className}`}
      data-scrolled="false"
    >
      {!disabled && (
        <div className="oh-canvas-wrap" aria-hidden="true">
          <canvas ref={canvasRef} />
        </div>
      )}

      <svg className="oh-orbit" viewBox="0 0 1740 1010" fill="none" aria-hidden="true">
        <ellipse cx="870" cy="505" rx="866" ry="500" stroke="url(#oh-og)" strokeWidth="1" />
        <defs>
          <linearGradient id="oh-og" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7FD5EE" stopOpacity="0" />
            <stop offset=".5" stopColor="#7FD5EE" stopOpacity=".4" />
            <stop offset="1" stopColor="#7FD5EE" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="oh-frame oh-frame--bl" aria-hidden="true">
        <img src={frameLeftSrc} alt="" decoding="async" />
      </div>
      <div className="oh-frame oh-frame--br" aria-hidden="true">
        <img src={frameRightSrc} alt="" decoding="async" />
      </div>

      <div className="oh-engine oh-engine--back" aria-hidden="true">
        <img src={engineSrc} alt="" decoding="async" />
      </div>

      <h1 className="oh-h oh-h--1" aria-label={`${headlineTop} ${headlineMain}`}>
        <span className="oh-mask"><span className="oh-in">{headlineTop}</span></span>
      </h1>
      <p className="oh-h oh-h--2" aria-hidden="true">
        <span className="oh-mask"><span className="oh-in"><b>{headlineMain}</b></span></span>
      </p>

      <div className="oh-engine oh-engine--front" aria-hidden="true">
        <img src={engineSrc} alt="" decoding="async" />
      </div>

      <div className="oh-lockup">
        The Motion<br />Agency
        <span className="oh-sm">Studio · est. 2026</span>
      </div>
      <nav className="oh-nav" aria-label="Primary">
        <span className="oh-pill">Work</span>
        <span className="oh-pill">Studio</span>
      </nav>
      <div className="oh-menu" role="button" tabIndex={0}>
        <span className="oh-bars" aria-hidden="true"><i /><i /></span> Menu
      </div>

      <div className="oh-cap oh-cap--l">
        A studio built<br />for <span className="oh-em">motion</span>
      </div>
      <div className="oh-cap oh-cap--r">
        Showreel<br /><span className="oh-em">2026</span>
      </div>

      <div className="oh-foot oh-foot--l oh-caption" ref={captionRef}>{footLeft}</div>
      <div className="oh-foot oh-foot--r"><span className="oh-ln" /> Scroll to enter</div>

      <div className="oh-vignette" aria-hidden="true" />
      <div className="oh-grain" aria-hidden="true" />
    </section>
  );
}
