"use client";
import { useEffect, useRef } from "react";

/**
 * Persistent cinematic background shared by the hero, deck transition,
 * and featured grid sections. Fixed full-viewport, DOM-only — no canvas,
 * no per-frame work beyond CSS animations and a single rAF loop that
 * nudges three slow gradient blobs based on scroll progress so the
 * atmosphere "breathes" with the page.
 */
export default function V5Background() {
  const wrapRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const wrap = wrapRef.current;
    if (!wrap) return;

    let raf = 0;
    let last = 0;
    const tick = () => {
      const y = window.scrollY || window.pageYOffset;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const p = Math.min(1, Math.max(0, y / maxScroll));
      if (Math.abs(p - last) > 0.001) {
        last = p;
        wrap.style.setProperty("--v5-bg-progress", p.toFixed(4));
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="v5-bg" aria-hidden="true">
      <div className="v5-bg-noise" />
      <div className="v5-bg-grid" />
      <div className="v5-bg-vignette" />
      <div className="v5-bg-fog" />
      <div className="v5-bg-blob v5-bg-blob--violet" />
      <div className="v5-bg-blob v5-bg-blob--cyan" />
      <div className="v5-bg-blob v5-bg-blob--ember" />
      <svg className="v5-bg-curves" viewBox="0 0 1600 900" preserveAspectRatio="none">
        <defs>
          <linearGradient id="v5CurveA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="v5CurveB" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <path
          className="v5-bg-curve v5-bg-curve--a"
          d="M -50 620 C 280 480, 560 760, 880 540 S 1480 420, 1700 580"
          fill="none"
          stroke="url(#v5CurveA)"
          strokeWidth="1"
        />
        <path
          className="v5-bg-curve v5-bg-curve--b"
          d="M -50 320 C 340 180, 640 420, 940 240 S 1480 120, 1700 280"
          fill="none"
          stroke="url(#v5CurveB)"
          strokeWidth="1"
        />
      </svg>
      <div className="v5-bg-particles">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} style={{ "--i": i }} />
        ))}
      </div>
    </div>
  );
}
