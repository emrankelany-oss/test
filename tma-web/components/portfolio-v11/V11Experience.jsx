"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useV11Scroll } from "./useV11Scroll";
import FrameBackdrop from "./FrameBackdrop";
import POVAnchor from "./POVAnchor";
import {
  HeroPanel,
  FeaturedGrid,
  WorkRiver,
  StatsCounters,
  QuotesPanel,
  CTAPanel,
} from "./Sections";

export default function V11Experience() {
  const progressRef = useRef(0);
  const progressBarRef = useRef(null);
  const chapterNumRef = useRef(null);
  const chapterLabelRef = useRef(null);
  const scrollPctRef = useRef(null);
  const scrollHintRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [preload, setPreload] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);

  useV11Scroll(progressRef);

  const onReady = useCallback(() => setReady(true), []);
  const onProgress = useCallback((p) => setPreload(p), []);

  // HUD driver — single RAF reads progressRef and writes the DOM directly,
  // avoiding React re-renders 60x/sec.
  useEffect(() => {
    const CHAPTERS = [
      { from: 0.00, label: "HERO" },
      { from: 0.12, label: "FEATURED" },
      { from: 0.38, label: "WORK · 039" },
      { from: 0.70, label: "STATS" },
      { from: 0.82, label: "QUOTES" },
      { from: 0.92, label: "LAUNCH" },
    ];

    let raf = 0;
    let lastIdx = -1;
    let lastPct = -1;
    let hintFaded = false;

    const update = () => {
      const p = progressRef.current || 0;

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${p})`;
      }

      const pct = Math.round(p * 100);
      if (pct !== lastPct) {
        lastPct = pct;
        if (scrollPctRef.current) {
          scrollPctRef.current.textContent = `${String(pct).padStart(2, "0")}%`;
        }
      }

      let idx = 0;
      for (let i = 0; i < CHAPTERS.length; i++) {
        if (p >= CHAPTERS[i].from) idx = i;
      }
      if (idx !== lastIdx) {
        lastIdx = idx;
        if (chapterNumRef.current)
          chapterNumRef.current.textContent = String(idx + 1).padStart(2, "0");
        if (chapterLabelRef.current)
          chapterLabelRef.current.textContent = CHAPTERS[idx].label;
        // Chapter changes ~6x total — cheap to drive the POV anchor via
        // state (vs the 60fps refs the rest of this RAF uses).
        setActiveChapter(idx);
      }

      // Fade the scroll hint after the user has scrolled past the cold-open
      // (300px of raw scroll, regardless of virtualized progress).
      const shouldFade = (window.scrollY || 0) > 300;
      if (shouldFade !== hintFaded) {
        hintFaded = shouldFade;
        if (scrollHintRef.current) {
          scrollHintRef.current.classList.toggle("is-faded", shouldFade);
        }
      }

      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Lock body scroll while the first frames decode so the user can't see jank.
  useEffect(() => {
    if (ready) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [ready]);

  return (
    <>
      {/* Cinematic backdrop — fixed canvas, scroll-scrubbed frame swap */}
      <FrameBackdrop
        progressRef={progressRef}
        onReady={onReady}
        onProgress={onProgress}
      />

      {/* Vignette + grain layered above the canvas */}
      <div className="v11-stage-fx" aria-hidden="true">
        <div className="v11-stage-vignette" />
        <div className="v11-stage-grain" />
      </div>

      {/* Persistent letterbox frame outline */}
      <div className="v11-frame-outline" aria-hidden="true" />

      {/* Boot overlay — hides while the first frames decode */}
      {!ready && (
        <div className="v11-preboot" role="status" aria-live="polite">
          <div className="v11-preboot-frame">
            <div className="v11-preboot-meta">
              <span>BOOSTER · WARMING UP</span>
              <span>{Math.round(preload * 100)}%</span>
            </div>
            <div className="v11-preboot-bar">
              <div
                className="v11-preboot-bar-fill"
                style={{ transform: `scaleX(${Math.min(1, preload)})` }}
              />
            </div>
            <div className="v11-preboot-foot">
              <span>DECODING SIGNAL FRAMES</span>
              <span>VEO · 450</span>
            </div>
          </div>
        </div>
      )}

      {/* Top telemetry bar */}
      <div className="v11-topbar">
        <div className="v11-topbar-meta">
          <span className="v11-mono">TMA · BOOSTER</span>
          <span className="v11-mono v11-blink">● TELEMETRY</span>
        </div>
        <div className="v11-topbar-progress" aria-hidden="true">
          <div className="v11-topbar-progress-fill" ref={progressBarRef} />
        </div>
        <div className="v11-topbar-meta v11-topbar-meta-right">
          <span className="v11-mono">PORTFOLIO</span>
          <span className="v11-mono">THE MOTION AGENCY</span>
        </div>
      </div>

      {/* Persistent left HUD — chapter number + label */}
      <aside className="v11-hud" aria-hidden="true">
        <POVAnchor index={activeChapter} />
        <span className="v11-mono v11-hud-tag">CHAPTER</span>
        <span className="v11-hud-num" ref={chapterNumRef}>
          01
        </span>
        <span className="v11-mono v11-hud-label" ref={chapterLabelRef}>
          HERO
        </span>
        <span className="v11-hud-line" />
        <span className="v11-mono v11-hud-hint">SCROLL TO LAUNCH</span>
      </aside>

      {/* Bottom-right corner mark + live scroll percent */}
      <div className="v11-mark" aria-hidden="true">
        <span className="v11-mark-dot" />
        <span className="v11-mono">SIGNAL · LIVE</span>
        <span className="v11-mark-sep" />
        <span className="v11-mono v11-mark-pct" ref={scrollPctRef}>
          00%
        </span>
      </div>

      {/* Bottom-center scroll hint — fades after 300px of real scroll */}
      <div className="v11-scrollhint" ref={scrollHintRef} aria-hidden="true">
        <span>SCROLL</span>
        <span className="v11-scrollhint-line" />
      </div>

      {/* Foreground story — sits over the fixed canvas */}
      <main className="v11-main">
        <HeroPanel />
        <FeaturedGrid />
        <WorkRiver />
        <StatsCounters />
        <QuotesPanel />
        <CTAPanel />
      </main>
    </>
  );
}
