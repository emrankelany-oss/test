"use client";

import { useEffect, useRef } from "react";
import Scene from "./Scene";
import { useV10Scroll } from "./useV10Scroll";

const BEATS = [
  { id: "b1", label: "DESCENT", from: 0.0, to: 0.22 },
  { id: "b2", label: "TOUCHDOWN · STAND A", from: 0.22, to: 0.36 },
  { id: "b3", label: "TRAVERSE", from: 0.36, to: 0.6 },
  { id: "b4", label: "RE-ENTRY", from: 0.6, to: 0.86 },
  { id: "b5", label: "TOUCHDOWN · STAND B", from: 0.86, to: 1.0 },
];

export default function V10Experience() {
  const progressRef = useRef(0);
  const progressBarRef = useRef(null);
  const beatLabelRef = useRef(null);
  const beatNumRef = useRef(null);
  const tlRef = useRef(null);

  useV10Scroll(progressRef);

  // Drive HUD updates off the same RAF that Scene reads from
  useEffect(() => {
    let raf = 0;
    let lastIdx = -1;
    const update = () => {
      const p = progressRef.current || 0;
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${p})`;
      }
      let idx = 0;
      for (let i = 0; i < BEATS.length; i++) {
        if (p >= BEATS[i].from) idx = i;
      }
      if (idx !== lastIdx) {
        lastIdx = idx;
        if (beatLabelRef.current) beatLabelRef.current.textContent = BEATS[idx].label;
        if (beatNumRef.current)
          beatNumRef.current.textContent = String(idx + 1).padStart(2, "0");
        // refresh chip active state
        if (tlRef.current) {
          tlRef.current.querySelectorAll(".v10-tl-chip").forEach((el, i) => {
            el.classList.toggle("is-active", i === idx);
            el.classList.toggle("is-past", i < idx);
          });
        }
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div className="v10-stage" aria-hidden="true">
        <Scene progressRef={progressRef} />
        <div className="v10-stage-vignette" />
        <div className="v10-stage-grain" />
      </div>

      {/* Top telemetry bar */}
      <div className="v10-topbar">
        <div className="v10-topbar-meta">
          <span className="v10-mono">TMA · BOOSTER 01</span>
          <span className="v10-mono v10-blink">● TELEMETRY LIVE</span>
        </div>
        <div className="v10-topbar-progress" aria-hidden="true">
          <div className="v10-topbar-progress-fill" ref={progressBarRef} />
        </div>
        <div className="v10-topbar-meta v10-topbar-meta-right">
          <span className="v10-mono">FLIGHT PATH</span>
          <span className="v10-mono">001 / 001</span>
        </div>
      </div>

      {/* Left HUD — current beat */}
      <aside className="v10-hud" aria-hidden="true">
        <span className="v10-mono v10-hud-tag">CURRENT BEAT</span>
        <span className="v10-hud-num" ref={beatNumRef}>
          01
        </span>
        <span className="v10-mono v10-hud-label" ref={beatLabelRef}>
          DESCENT
        </span>
        <span className="v10-hud-line" />
        <span className="v10-mono v10-hud-hint">SCROLL TO BOOST</span>
      </aside>

      {/* Right timeline — beat chips */}
      <aside className="v10-timeline" ref={tlRef} aria-hidden="true">
        {BEATS.map((b, i) => (
          <div key={b.id} className={`v10-tl-chip ${i === 0 ? "is-active" : ""}`}>
            <span className="v10-mono">{String(i + 1).padStart(2, "0")}</span>
            <span className="v10-mono v10-tl-chip-label">{b.label}</span>
          </div>
        ))}
      </aside>

      {/* Bottom corner mark */}
      <div className="v10-mark" aria-hidden="true">
        <span className="v10-mark-dot" />
        <span className="v10-mono">LIFTOFF · V10</span>
      </div>

      {/* Scroll hint (fades after a bit of scroll) */}
      <div className="v10-scrollhint" aria-hidden="true">
        <span className="v10-mono">SCROLL</span>
        <span className="v10-scrollhint-wheel">
          <span className="v10-scrollhint-dot" />
        </span>
      </div>

      {/* Spacer that gives the page its scroll length (600vh).
          The 3D stage is fixed, so this is what the user actually scrolls. */}
      <div className="v10-scroll-spacer" aria-hidden="true" />

      {/* Footer reveal at the end */}
      <footer className="v10-foot">
        <div className="v10-foot-row">
          <span className="v10-mono">© THE MOTION AGENCY</span>
          <span className="v10-mono">AMMAN · RIYADH</span>
          <span className="v10-mono">PORTFOLIO · V10</span>
        </div>
      </footer>
    </>
  );
}
