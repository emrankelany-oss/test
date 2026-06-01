"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { atmoSignal } from "./atmoSignal";

/**
 * Continuous "atmosphere" for V21 — a single persistent cyan bloom behind the
 * whole work lane that swells to its peak over MOTION MATTERS, plus a smoothed
 * scroll-velocity signal. ONE writer: each frame it computes --atmo-bloom and
 * --atmo-vel, writes them to <html> (CSS readers: the bloom layer + the comet
 * glow) and mirrors them on the shared atmoSignal object (its JS reader, the
 * flow-field, is wired up in Task 3).
 *
 * Velocity: attack on scroll events (Lenis fires many per frame while moving,
 * so it builds toward 1 quickly), then a smooth per-frame decay back to rest
 * inside the rAF — keeps the tail 60fps-smooth, which the comet glow depends on.
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
    let alive = true;
    let vel = 0;

    // Attack: each scroll event eases vel toward 1; the rAF decays it back.
    // NOTE: depends on Lenis (SmoothScroll) re-emitting native window "scroll"
    // events, which it does by default. If that changes, --atmo-vel flatlines
    // to 0 (graceful — bloom/comet just stop reacting to speed).
    const onScroll = () => {
      vel = clamp01(vel + (1 - vel) * 0.4);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tick = () => {
      if (!alive) return;
      const vh = window.innerHeight || 900;

      // bloom: proximity of MOTION MATTERS centre to viewport centre.
      let bloom = 0;
      const mm = document.querySelector(".v21-mm");
      if (mm) {
        const r = mm.getBoundingClientRect();
        const mmCenter = r.top + r.height / 2;
        bloom = clamp01(1 - Math.abs(mmCenter - vh / 2) / (1.2 * vh));
      }

      // velocity: smooth per-frame decay toward 0 (attack happens in onScroll).
      vel += (0 - vel) * 0.08;
      if (vel < 0.001) vel = 0;

      root.style.setProperty("--atmo-bloom", bloom.toFixed(4));
      root.style.setProperty("--atmo-vel", vel.toFixed(4));
      atmoSignal.bloom = bloom;
      atmoSignal.vel = vel;

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      root.style.removeProperty("--atmo-bloom");
      root.style.removeProperty("--atmo-vel");
      atmoSignal.bloom = 0;
      atmoSignal.vel = 0;
    };
  }, [reduced]);

  return <div className="v21-atmosphere" aria-hidden="true" />;
}
