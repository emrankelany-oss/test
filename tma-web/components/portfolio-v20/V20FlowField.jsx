"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const PARTICLE_COUNT = 220;
const DPR_CAP = 2;
// Per-frame fade. The canvas is mix-blend-mode: screen, so a BLACK fade
// contributes zero light (screen with 0 = backdrop unchanged) — it only
// fades this layer's own trail pixels, never darkening the filament/page.
const TRAIL_FADE = 0.06;

/**
 * "Flow current" background for the MOTION MATTERS section.
 *
 * Mounted at the WORK-LANE level (before <V20Filament/>) as a viewport-fixed
 * layer, so it paints BEHIND the filament: the scroll-drawn line and the
 * "MOTION MATTERS" tracing always sit clearly on TOP of it.
 *
 * Visibility is driven by the section's on-screen rect each frame (NOT a
 * ScrollTrigger). The section is pinned for +=200%, and a ScrollTrigger keyed
 * to its natural height would flip inactive ~one viewport before the pin
 * actually releases — which made the background vanish mid-draw. Reading the
 * live rect keeps it visible for the entire time the section is on screen.
 *
 * Hard rule: this layer never alters the filament — mix-blend-mode: screen
 * (adds light only) plus a black trail-fade (a no-op under screen).
 */
export default function V20FlowField() {
  const elRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const section = document.querySelector(".v20-mm");
    if (!section) return;

    let rafId = 0;
    let ro = null;
    let lastY = window.scrollY;
    let lastVisible = null;

    // Particle/canvas drawing is only set up for the animated (non-reduced)
    // path. `drawFrame(velocity)` advances and renders one frame.
    let drawFrame = null;
    if (!reduced) {
      const ctx2d = el.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

      let width = 0;
      let height = 0;
      const fit = () => {
        const rect = el.getBoundingClientRect();
        width = Math.max(1, Math.round(rect.width));
        height = Math.max(1, Math.round(rect.height));
        el.width = width * dpr;
        el.height = height * dpr;
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      fit();

      ro = new ResizeObserver(fit);
      ro.observe(el);

      const rand = (a, b) => a + Math.random() * (b - a);
      const spawn = () => ({ x: rand(0, width), y: rand(0, height), life: rand(40, 160) });
      const particles = Array.from({ length: PARTICLE_COUNT }, spawn);

      const lerp = (a, b, n) => a + (b - a) * n;
      let flowSpeed = 0.5; // multiplier on time advance
      let glow = 0.2; // stroke alpha
      let t = 0;
      const field = (x, y) =>
        Math.sin(y * 0.012 + t * 0.6) * 0.8 + Math.cos(x * 0.008 - t * 0.3) * 0.5;

      drawFrame = (velocity) => {
        // Always-visible base, brighter/faster while scrolling.
        const speedTarget = 0.45 + velocity * 0.95; // 0.45 .. 1.4
        const glowTarget = 0.2 + velocity * 0.14; // 0.20 .. 0.34
        flowSpeed = lerp(flowSpeed, speedTarget, 0.05);
        glow = lerp(glow, glowTarget, 0.05);

        t += 0.006 * flowSpeed;
        // Fade prior frame toward black to build flowing trails. Black is a
        // no-op under screen blend, so this never darkens the filament/page.
        ctx2d.fillStyle = `rgba(0, 0, 0, ${TRAIL_FADE})`;
        ctx2d.fillRect(0, 0, width, height);

        ctx2d.lineWidth = 1.3;
        ctx2d.lineCap = "round";
        ctx2d.strokeStyle = `rgba(95, 185, 255, ${glow})`;
        for (const p of particles) {
          const a = field(p.x, p.y);
          const nx = p.x + Math.cos(a) * 1.6 * flowSpeed;
          const ny = p.y + Math.sin(a) * 1.6 * flowSpeed;
          ctx2d.beginPath();
          ctx2d.moveTo(p.x, p.y);
          ctx2d.lineTo(nx, ny);
          ctx2d.stroke();
          p.x = nx;
          p.y = ny;
          p.life -= 1;
          if (p.life < 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
            Object.assign(p, spawn());
          }
        }
      };
    }

    const tick = () => {
      const y = window.scrollY;
      const velocity = Math.min(1, Math.abs(y - lastY) / 45);
      lastY = y;

      // Visible whenever the section overlaps the viewport — true for the
      // entire pin (rect stays top:0..bottom:vh while pinned). CSS opacity
      // transition smooths the fade at the edges.
      const r = section.getBoundingClientRect();
      const visible = r.top < window.innerHeight && r.bottom > 0;
      if (visible !== lastVisible) {
        el.style.opacity = visible ? "1" : "0";
        lastVisible = visible;
      }

      if (visible && drawFrame) drawFrame(velocity);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
    };
  }, [reduced]);

  if (reduced) {
    return <div ref={elRef} className="v20-mm-flow v20-mm-flow--static" aria-hidden="true" />;
  }
  return <canvas ref={elRef} className="v20-mm-flow" aria-hidden="true" />;
}
