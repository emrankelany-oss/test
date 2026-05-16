"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useV9Scroll } from "./useV9Scroll";
import SignalCanvas from "./SignalCanvas";
import SignalAtmosphere from "./SignalAtmosphere";
import SignalProjects from "./SignalProjects";
import {
  ChapterHero,
  ChapterEvolution,
  ChapterSystems,
  ChapterSync,
  ChapterInfinite,
} from "./SignalChapters";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const CHAPTER_IDS = [
  { id: "signal-birth", label: "BIRTH" },
  { id: "signal-evolution", label: "EVOLUTION" },
  { id: "signal-projects", label: "MANIFESTATION" },
  { id: "signal-systems", label: "SYSTEMS" },
  { id: "signal-sync", label: "SYNC" },
  { id: "signal-infinite", label: "INFINITE" },
];

export default function V9Experience() {
  useV9Scroll();
  const progressRef = useRef(0);
  const progressBarRef = useRef(null);
  const chapterMarkRef = useRef(null);
  const hudChapterRef = useRef(null);

  // Persistent chapter HUD update + progress bar
  useEffect(() => {
    let raf = 0;
    let lastIdx = -1;
    const update = () => {
      const p = progressRef.current || 0;
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${p})`;
      }
      const idx = Math.min(
        CHAPTER_IDS.length - 1,
        Math.floor(p * CHAPTER_IDS.length + 0.0001),
      );
      if (idx !== lastIdx && hudChapterRef.current) {
        lastIdx = idx;
        const ch = CHAPTER_IDS[idx];
        hudChapterRef.current.querySelector("[data-num]").textContent = String(
          idx + 1,
        ).padStart(2, "0");
        hudChapterRef.current.querySelector("[data-label]").textContent = ch.label;
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Run ScrollTrigger refresh once layout settles (video stage + dynamic content)
  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Persistent cinematic backbone */}
      <SignalCanvas progressRef={progressRef} />
      <SignalAtmosphere progressRef={progressRef} />

      {/* Top progress signal bar */}
      <div className="v9-topbar" aria-hidden="true">
        <div className="v9-topbar-meta">
          <span className="v9-mono">THE.SIGNAL</span>
          <span className="v9-mono">— LIVE FEED —</span>
          <span className="v9-mono v9-blink">● REC</span>
        </div>
        <div className="v9-topbar-progress">
          <div className="v9-topbar-progress-fill" ref={progressBarRef} />
        </div>
        <div className="v9-topbar-meta v9-topbar-meta-right">
          <span className="v9-mono">PORTFOLIO · V9</span>
          <span className="v9-mono">THE MOTION AGENCY</span>
        </div>
      </div>

      {/* Persistent chapter HUD */}
      <aside className="v9-hud" ref={hudChapterRef} aria-hidden="true">
        <span className="v9-mono v9-hud-tag">CHAPTER</span>
        <span className="v9-hud-num" data-num>01</span>
        <span className="v9-mono v9-hud-label" data-label>BIRTH</span>
        <span className="v9-hud-line" />
        <div className="v9-hud-chapters">
          {CHAPTER_IDS.map((c, i) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="v9-hud-chip"
              data-i={i}
            >
              <span className="v9-mono">{String(i + 1).padStart(2, "0")}</span>
              <span className="v9-mono v9-hud-chip-label">{c.label}</span>
            </a>
          ))}
        </div>
      </aside>

      {/* Persistent corner mark */}
      <div className="v9-mark" aria-hidden="true">
        <span className="v9-mark-dot" />
        <span className="v9-mono">SIGNAL.LOCKED</span>
      </div>

      <main className="v9-main" ref={chapterMarkRef}>
        <ChapterHero />
        <ChapterEvolution />
        <SignalProjects />
        <ChapterSystems />
        <ChapterSync />
        <ChapterInfinite />
      </main>
    </>
  );
}
