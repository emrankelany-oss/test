"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const PARTICLE_COUNT = 60;
const DPR_CAP = 2;

/**
 * Whisper-subtle "flow current" behind the MOTION MATTERS section.
 *
 * Hard rule: this layer must never alter the filament. It uses
 * mix-blend-mode: screen (can only add light) and clears to full
 * transparency each frame (no dark trail fill). It owns its OWN
 * ScrollTrigger — it never reads or writes the filament's trigger.
 */
export default function V20FlowField() {
  const canvasRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  // Scroll signals written by our own ScrollTrigger, read by the rAF loop.
  const progressRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;

    const ctx2d = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

    let width = 0;
    let height = 0;
    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();

    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    const rand = (a, b) => a + Math.random() * (b - a);
    const spawn = () => ({ x: rand(0, width), y: rand(0, height), life: rand(40, 160) });
    const particles = Array.from({ length: PARTICLE_COUNT }, spawn);

    const lerp = (a, b, n) => a + (b - a) * n;
    let flowSpeed = 0.5; // multiplier on time advance
    let glow = 0.05; // stroke alpha
    let t = 0;
    const field = (x, y) =>
      Math.sin(y * 0.012 + t * 0.6) * 0.8 + Math.cos(x * 0.008 - t * 0.3) * 0.5;

    // Our OWN trigger — independent of the filament. No scrub, no tween;
    // it only records progress + velocity into refs.
    let active = false;
    let rafId = 0;

    // Define render before gsap.context so onToggle / st.isActive can reference it.
    function render() {
      // Targets derived from scroll, clamped to whisper bounds.
      const speedTarget = 0.4 + velocityRef.current * 0.9; // 0.4 .. 1.3
      const glowTarget = 0.05 + progressRef.current * 0.04; // 0.05 .. 0.09
      flowSpeed = lerp(flowSpeed, speedTarget, 0.04);
      glow = lerp(glow, glowTarget, 0.04);
      velocityRef.current *= 0.92; // decay toward calm when not scrolling

      t += 0.006 * flowSpeed;
      ctx2d.clearRect(0, 0, width, height); // full transparency — never darkens

      ctx2d.lineWidth = 1.1;
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
      if (active) rafId = requestAnimationFrame(render);
    }

    const gsapCtx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: ".v20-mm",
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          progressRef.current = self.progress;
          velocityRef.current = Math.min(1, Math.abs(self.getVelocity()) / 3000);
        },
        onToggle: (self) => {
          if (self.isActive && !active) {
            active = true;
            rafId = requestAnimationFrame(render);
          } else if (!self.isActive) {
            active = false;
          }
        },
      });
      // Kick off immediately if already in view at mount.
      if (st.isActive) {
        active = true;
        rafId = requestAnimationFrame(render);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      gsapCtx.revert();
    };
  }, [reduced]);

  if (reduced) {
    return <div className="v20-mm-flow v20-mm-flow--static" aria-hidden="true" />;
  }
  return <canvas ref={canvasRef} className="v20-mm-flow" aria-hidden="true" />;
}
