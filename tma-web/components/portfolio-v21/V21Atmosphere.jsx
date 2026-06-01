"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { atmoSignal } from "./atmoSignal";

/**
 * Continuous "atmosphere" for V21 — a single persistent cyan bloom behind the
 * whole work lane that swells to its peak over MOTION MATTERS, plus a smoothed
 * scroll-velocity signal. ONE writer: each frame it computes --atmo-bloom and
 * --atmo-vel, writes them to <html> (CSS readers: the bloom layer + the comet
 * glow) and to the shared atmoSignal object (JS readers: the flow-field + the
 * filament comet). The RAF pauses when the work lane is fully off-screen.
 */
export default function V21Atmosphere() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const root = document.documentElement;
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

    // Reduced motion: a calm static bloom, no velocity, no RAF.
    if (reduced) {
      root.style.setProperty("--atmo-bloom", "0");
      root.style.setProperty("--atmo-vel", "0");
      atmoSignal.bloom = 0;
      atmoSignal.vel = 0;
      return;
    }

    let rafId = 0;
    let velSmoothed = 0;
    let decayTimer = 0;
    let alive = true;

    // Write vel to CSS + signal object (called from both scroll and decay).
    const writeVel = (v) => {
      velSmoothed = v;
      root.style.setProperty("--atmo-vel", v.toFixed(4));
      atmoSignal.vel = v;
    };

    // Decay ladder: fires via setTimeout so it runs even between rAF ticks
    // (e.g. during Playwright waitForTimeout). Each step multiplies vel by 0.3
    // every 60ms, reaching < 0.001 after ~5 steps (~300ms silence).
    const stepDecay = () => {
      if (!alive) return;
      const next = velSmoothed * 0.3;
      if (next < 0.001) { writeVel(0); return; }
      writeVel(next);
      decayTimer = setTimeout(stepDecay, 60);
    };

    // Scroll listener: attack vel toward 1 on each scroll event, reschedule decay.
    const onScroll = () => {
      if (!alive) return;
      // Soft attack: move vel 40% toward 1 each scroll event (multiple events
      // fire per frame with Lenis, so vel builds quickly during active scrolling).
      const next = clamp01(velSmoothed + (1 - velSmoothed) * 0.4);
      writeVel(next);
      clearTimeout(decayTimer);
      // Reschedule decay after 120ms of scroll silence.
      decayTimer = setTimeout(stepDecay, 120);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tick = () => {
      if (!alive) return;

      const vh = window.innerHeight || 900;
      const mm = document.querySelector(".v21-mm");

      // bloom: proximity of MOTION MATTERS centre to viewport centre.
      let bloom = 0;
      if (mm) {
        const r = mm.getBoundingClientRect();
        const mmCenter = r.top + r.height / 2;
        bloom = clamp01(1 - Math.abs(mmCenter - vh / 2) / (1.2 * vh));
      }

      root.style.setProperty("--atmo-bloom", bloom.toFixed(4));
      atmoSignal.bloom = bloom;
      // vel is managed by onScroll/stepDecay; just sync atmoSignal.
      atmoSignal.vel = velSmoothed;

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      clearTimeout(decayTimer);
      window.removeEventListener("scroll", onScroll);
      root.style.removeProperty("--atmo-bloom");
      root.style.removeProperty("--atmo-vel");
      atmoSignal.bloom = 0;
      atmoSignal.vel = 0;
    };
  }, [reduced]);

  return <div className="v21-atmosphere" aria-hidden="true" />;
}
