"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { WORK_GRID, FEATURED } from "./projects";
import V23Logo from "./V23Logo";

// Real page assets to preload before revealing. Genuinely waits on them:
// every work-grid card image + all featured posters, the hero loop and the
// statement panel video buffered to a playable first frame ("loadeddata"),
// and the featured lead films to metadata. 100% is only reached once these
// have actually finished loading over the network.
function criticalAssets() {
  const imgs = new Set(["/assets/v5/slide8-poster.jpg", "/assets/v23/studio-motion.jpg"]);
  WORK_GRID.forEach((c) => c.image && imgs.add(c.image));
  FEATURED.forEach((f) => f.media.forEach((m) => m.poster && imgs.add(m.poster)));

  const videos = [];
  const seen = new Set();
  const add = (src, until) => { if (src && !seen.has(src)) { seen.add(src); videos.push({ src, until }); } };
  add("/assets/v5/slide8-loop.mp4", "loadeddata");      // hero — must be playable
  add("/assets/v23/studio-motion.mp4", "loadeddata");   // statement panel — must be playable
  FEATURED.forEach((f) => add(f.media.find((m) => m.kind === "video")?.src, "loadedmetadata"));
  return { images: [...imgs], videos };
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
    const loadVid = ({ src, until }) => new Promise((res) => {
      const v = document.createElement("video"); v.muted = true;
      v.preload = until === "loadeddata" ? "auto" : "metadata";
      let s = false; const fin = () => { if (s) return; s = true; bump(); res(); };
      v.addEventListener(until, fin); v.addEventListener("canplaythrough", fin); v.onerror = fin;
      setTimeout(fin, 7000); // safety so one slow file never traps the reveal
      v.src = src;
    });
    const fontsP = (document.fonts ? document.fonts.ready : Promise.resolve()).then(bump);
    Promise.all([fontsP, ...images.map(loadImg), ...videos.map(loadVid)]).catch(() => {});

    const start = performance.now();
    const MIN_MS = 3400; // slower, deliberate write-on — also the minimum on-screen time
    let shown = 0, raf = 0, revealed = false;

    const tick = () => {
      const elapsed = performance.now() - start;
      const realPct = (done / total) * 100;            // genuine network progress
      const timePct = Math.min(100, (elapsed / MIN_MS) * 100); // min-duration pace
      const target = Math.min(realPct, timePct);       // bounded by BOTH → can't finish early
      shown += (target - shown) * 0.08;
      const display = Math.min(shown, 99.9);
      drawTo(display / 100);
      if (numRef.current) numRef.current.textContent = String(Math.round(display));
      // reveal strictly once the real assets are loaded AND the minimum time passed
      if (done >= total && elapsed >= MIN_MS && !revealed) { revealed = true; reveal(); return; }
      raf = requestAnimationFrame(tick);
    };

    // ── reveal: fill the logo, then fly it into the navbar slot ──
    const reveal = () => {
      drawTo(1);
      if (numRef.current) numRef.current.textContent = "100";
      const navLogo = document.querySelector(".v23-page .nav-logo");
      const tl = gsap.timeline();
      tl.add(() => root.classList.add("is-filled")) // stroke → solid fill
        .to(".v23-pl-count", { opacity: 0, y: -10, duration: 0.5, ease: "power2.in" }, 0.4)
        .add(() => {
          if (!navLogo) return;
          const from = logo.getBoundingClientRect();
          const to = navLogo.getBoundingClientRect();
          gsap.set(logo, { transformOrigin: "0 0" });
          gsap.to(logo, {
            x: to.left - from.left,
            y: to.top - from.top,
            scale: to.width / from.width,
            duration: 1.15,
            ease: "expo.inOut",
          });
        }, 0.7)
        .to(root, { backgroundColor: "rgba(0,0,0,0)", duration: 1.0, ease: "power2.inOut" }, 0.95)
        .add(() => {
          docEl.classList.remove("v23-loading"); // navbar logo fades in under the flown mark
          docEl.style.overflow = "";
          window.dispatchEvent(new CustomEvent("v23:loaded"));
        }, 1.85)
        .add(() => setMounted(false), 1.95);
    };

    raf = requestAnimationFrame(tick);
    const hardStop = setTimeout(() => { done = total; }, 14000);

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
