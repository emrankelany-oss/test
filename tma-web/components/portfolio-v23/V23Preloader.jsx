"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { WORK_GRID, FEATURED } from "./projects";
import V23Logo from "./V23Logo";

// Real critical assets to preload before revealing (hero loop + above-the-fold
// imagery + featured lead films) so the draw is paced by genuine loading.
function criticalAssets() {
  const imgs = new Set(["/assets/v5/slide8-poster.jpg"]);
  WORK_GRID.slice(0, 10).forEach((c) => c.image && imgs.add(c.image));
  FEATURED.forEach((f) => f.media[0]?.poster && imgs.add(f.media[0].poster));
  const vids = new Set([
    "/assets/v5/slide8-loop.mp4",
    ...FEATURED.map((f) => f.media.find((m) => m.kind === "video")?.src).filter(Boolean),
  ]);
  return { images: [...imgs], videos: [...vids] };
}

export default function V23Preloader() {
  const rootRef = useRef(null);
  const logoRef = useRef(null);
  const numRef = useRef(null);
  const paths = useRef([]);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const root = rootRef.current;
    const logo = logoRef.current;
    if (!root || !logo) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || window.__V23_SKIP_PRELOADER) {
      document.documentElement.classList.remove("v23-loading");
      setMounted(false);
      return;
    }

    const docEl = document.documentElement;
    docEl.classList.add("v23-loading");
    docEl.style.overflow = "hidden";

    // ── set up the stroke-draw: order paths top→bottom, left→right ──
    const els = paths.current.filter(Boolean);
    const ordered = els
      .map((el) => ({ el, box: el.getBBox() }))
      .sort((a, b) => (Math.round(a.box.y / 20) - Math.round(b.box.y / 20)) || (a.box.x - b.box.x));
    const lens = ordered.map(({ el }) => {
      const L = el.getTotalLength();
      el.style.strokeDasharray = `${L}`;
      el.style.strokeDashoffset = `${L}`;
      return L;
    });
    const N = ordered.length;
    const STAGGER = 0.07; // cascade between strokes
    const drawTo = (p) => {
      ordered.forEach(({ el }, i) => {
        const lp = gsap.utils.clamp(0, 1, (p - i * STAGGER) / (1 - (N - 1) * STAGGER));
        el.style.strokeDashoffset = `${lens[i] * (1 - lp)}`;
      });
    };

    // ── real asset preload ──
    const { images, videos } = criticalAssets();
    const total = images.length + videos.length + 1;
    let done = 0;
    const bump = () => { done = Math.min(total, done + 1); };
    const loadImg = (src) => new Promise((res) => { const im = new Image(); im.onload = im.onerror = () => { bump(); res(); }; im.src = src; });
    const loadVid = (src) => new Promise((res) => {
      const v = document.createElement("video"); v.muted = true; v.preload = "metadata";
      let s = false; const fin = () => { if (s) return; s = true; bump(); res(); };
      v.onloadedmetadata = fin; v.oncanplay = fin; v.onerror = fin; setTimeout(fin, 3500); v.src = src;
    });
    const fontsP = (document.fonts ? document.fonts.ready : Promise.resolve()).then(bump);
    Promise.all([fontsP, ...images.map(loadImg), ...videos.map(loadVid)]).catch(() => {});

    const start = performance.now();
    const MIN_MS = 1700; // keep the draw legible on fast loads
    let shown = 0, raf = 0, revealed = false;

    const tick = () => {
      const real = (done / total) * 100;
      shown += (real - shown) * 0.07;
      const elapsed = performance.now() - start;
      let display = Math.min(shown, done >= total && elapsed >= MIN_MS ? 100 : 99);
      drawTo(display / 100);
      if (numRef.current) numRef.current.textContent = String(Math.round(display));
      if (display >= 99.6 && !revealed) { revealed = true; reveal(); return; }
      raf = requestAnimationFrame(tick);
    };

    // ── reveal: fill the logo, then fly it into the navbar slot ──
    const reveal = () => {
      drawTo(1);
      if (numRef.current) numRef.current.textContent = "100";
      const navLogo = document.querySelector(".v23-page .nav-logo");
      const tl = gsap.timeline();
      tl.add(() => root.classList.add("is-filled")) // stroke → solid fill
        .to(".v23-pl-count", { opacity: 0, y: -10, duration: 0.4, ease: "power2.in" }, 0.25)
        .add(() => {
          if (!navLogo) return;
          const from = logo.getBoundingClientRect();
          const to = navLogo.getBoundingClientRect();
          gsap.set(logo, { transformOrigin: "0 0" });
          gsap.to(logo, {
            x: to.left - from.left,
            y: to.top - from.top,
            scale: to.width / from.width,
            duration: 0.95,
            ease: "expo.inOut",
          });
        }, 0.5)
        .to(root, { backgroundColor: "rgba(0,0,0,0)", duration: 0.8, ease: "power2.inOut" }, 0.7)
        .add(() => {
          docEl.classList.remove("v23-loading"); // navbar logo fades in under the flown mark
          docEl.style.overflow = "";
          window.dispatchEvent(new CustomEvent("v23:loaded"));
        }, 1.45)
        .add(() => setMounted(false), 1.55);
    };

    raf = requestAnimationFrame(tick);
    const hardStop = setTimeout(() => { done = total; }, 8000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hardStop);
      docEl.classList.remove("v23-loading");
      docEl.style.overflow = "";
    };
  }, []);

  if (!mounted) return null;
  return (
    <div className="v23-preloader" ref={rootRef} aria-hidden="true">
      <div className="v23-pl-stage">
        <V23Logo
          className="v23-pl-logo"
          draw
          svgRef={logoRef}
          pathRef={(el, i) => { paths.current[i] = el; }}
        />
        <div className="v23-pl-count"><span ref={numRef}>0</span><i>%</i></div>
      </div>
    </div>
  );
}
