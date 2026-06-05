"use client";
import { useEffect, useRef } from "react";
import { GALAXY_STOPS } from "./data";

// "Swimming in a galaxy" background: drifting nebula clouds (brand slide-7
// palette) + a parallax starfield, on black, screen-blended. Drifts
// continuously; the whole galaxy swims/accelerates with scroll velocity and
// travels with scroll progress. Reduced-motion renders one static frame.
export default function V24GradientField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Cache scroll position here (in the passive scroll handler) so the rAF
    // render loop never reads layout-dependent geometry. Reading window.scrollY
    // inside frame() forces a synchronous full-document layout every frame —
    // catastrophic during the preloader reveal when the whole page first lays
    // out, which starved GSAP's main-thread logo flight and caused the snap.
    let scrollN = 0, curY = window.scrollY;
    const onScroll = () => {
      curY = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollN = max > 0 ? curY / max : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // deterministic pseudo-random so the layout is stable across reloads
    let seed = 1234567;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

    const clouds = Array.from({ length: 5 }, (_, i) => ({
      bx: rnd(), by: rnd(),
      rad: 0.32 + rnd() * 0.22,
      ax: 0.10 + rnd() * 0.12, ay: 0.10 + rnd() * 0.12,
      sx: 0.18 + rnd() * 0.25, sy: 0.15 + rnd() * 0.22,
      ph: rnd() * Math.PI * 2,
      c1: GALAXY_STOPS[i % GALAXY_STOPS.length],
      c2: GALAXY_STOPS[(i * 3 + 2) % GALAXY_STOPS.length],
    }));

    const stars = Array.from({ length: 90 }, () => ({
      x: rnd(), y: rnd(), z: 0.3 + rnd() * 0.7, ph: rnd() * Math.PI * 2,
    }));

    const hexA = (hex, a) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    };

    const drawCloud = (c, p) => {
      const x = (c.bx + Math.sin(p * c.sx + c.ph) * c.ax) * W;
      const y = (c.by + Math.cos(p * c.sy + c.ph) * c.ay + (scrollN - 0.5) * 0.5) * H;
      const r = c.rad * Math.min(W, H) * (1 + 0.08 * Math.sin(p * 0.3 + c.ph));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, hexA(c.c1, 0.55));
      g.addColorStop(0.45, hexA(c.c2, 0.28));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.filter = "blur(60px)";
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawStars = (p) => {
      ctx.save();
      ctx.filter = "none";
      for (const s of stars) {
        const px = s.x * W;
        const py = (((s.y - scrollN * s.z * 0.6) % 1) + 1) % 1 * H;
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(p * (0.6 + s.z) + s.ph));
        ctx.globalAlpha = tw * s.z * 0.8;
        ctx.fillStyle = "#cfe0ff";
        ctx.beginPath(); ctx.arc(px, py, s.z * 1.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    };

    let raf = 0, last = 0, phase = 0, vel = 0, lastY = curY;
    const frame = (now) => {
      now = now || 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const y = curY; // cached in onScroll — never force layout in the render loop
      vel = vel * 0.88 + Math.abs(y - lastY); lastY = y;
      const swim = 1 + Math.min(vel * 0.04, 2.2); // scroll velocity accelerates the drift
      phase += dt * swim;
      ctx.clearRect(0, 0, W, H);
      for (const c of clouds) drawCloud(c, phase);
      drawStars(phase);
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    if (reduce) { cancelAnimationFrame(raf); frame(0); }

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduce) { last = 0; raf = requestAnimationFrame(frame); }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="v24-gradient-field" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
