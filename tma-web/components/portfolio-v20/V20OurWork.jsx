"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { PROJECTS } from "./projects";
import { useProjectDrawer } from "./useProjectDrawer";
import { useTileTilt } from "./useTileTilt";

/* =====================================================================
   V20 — Our Work
   ---------------------------------------------------------------------
   Real PDF content sourced via projects.js.
   - Two draggable reels (Part 1) split the roster into two ribbons that
     auto-scroll in opposite directions.
   - Scroll-parallax 4-column archive (Part 2) presents 12 hero tiles
     that drift at differential speeds.
   Every tile carries data-cursor="read-more" + onClick → opens the
   project drawer with the project's full PDF content.
   ===================================================================== */

/* Split projects into the three surfaces. Deep cases land in the
   prominent parallax columns; reels carry the supporting brand work. */
const REEL_A = [
  "foodics-boundless",
  "rubicon-exotic",
  "sol-brand",
  "zaintech-drones",
  "salasa-2034",
  "mawani-vision-2030",
  "lsc-vision-2034",
  "world-government-summit",
  "burger-king-krispier",
  "vanellis",
  "lg-lifes-good",
  "avis",
  "foodics-egypt-ooh",
  "almarai",
  "mixy",
].map(findProject);

const REEL_B = [
  "zid-ripple",
  "linc-card",
  "invoiceq-identity",
  "investcorp-capital",
  "transform-identity",
  "sharjah-data-smart-gov",
  "fraed-international",
  "family-development-finance",
  "vodafone-global",
  "buffalo-wild-wings",
  "foodics-pay",
  "tawasol",
  "foodics-display",
  "electrolux",
].map(findProject);

const PARALLAX = [
  ["foodics-boundless", "investcorp-capital",  "fraed-international"],
  ["zid-ripple",        "zaintech-drones",     "burger-king-krispier"],
  ["rubicon-exotic",    "invoiceq-identity",   "vodafone-global"],
  ["mawani-vision-2030","transform-identity",  "lsc-vision-2034"],
].map((col) => col.map(findProject));

function findProject(slug) {
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p) throw new Error(`[V20OurWork] unknown project slug: ${slug}`);
  return p;
}

export default function V20OurWork() {
  // one document-level listener handles tilt for every tile in this section
  useTileTilt(".v20ow-ptile, .v20ow-slide");

  return (
    <section className="v20ow">
      <header className="v20ow-header container">
        <span className="v20ow-eyebrow">
          <span className="v20ow-eyebrow-tick" />
          The archive · selected clients
        </span>
        <h2 className="v20ow-title">
          <span className="v20ow-title-word">Our</span> <em>work</em>
        </h2>
        <p className="v20ow-lede">
          Campaigns, identities and films across the GCC — drag the reel,
          click any tile to read the full story.
        </p>
      </header>

      <WorkSlider items={REEL_A} showHint />
      <WorkSlider items={REEL_B} reverse />
      <WorkParallax columns={PARALLAX} />
    </section>
  );
}

/* ---------- Part 1: looping draggable slider ---------- */
function WorkSlider({ items, reverse = false, showHint = false }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const { open } = useProjectDrawer();
  // tracks drag distance per pointerdown so click is suppressed when dragging
  const downRef = useRef({ x: 0, y: 0, moved: false });

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let setWidth = 0; // exact width of one copy (period of the loop)
    let x = 0;
    let vel = 0; // momentum after a drag throw
    let dragging = false;
    let lastX = 0;
    let rafId = 0;
    const AUTO = 0.9; // px/frame idle drift
    const dir = reverse ? -1 : 1; // -1 flips drift so the row scrolls the other way

    const measure = () => {
      const first = track.children[0];
      const mid = track.children[items.length];
      setWidth =
        first && mid
          ? mid.offsetLeft - first.offsetLeft
          : track.scrollWidth / 2;
    };

    const wrap = () => {
      if (setWidth <= 0) return;
      while (x <= -setWidth) x += setWidth;
      while (x > 0) x -= setWidth;
    };

    const tick = () => {
      if (!dragging) {
        x -= AUTO * dir;
        x += vel;
        vel *= 0.92;
        if (Math.abs(vel) < 0.01) vel = 0;
      }
      wrap();
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      rafId = requestAnimationFrame(tick);
    };

    const onDown = (e) => {
      dragging = true;
      vel = 0;
      lastX = e.clientX;
      downRef.current = { x: e.clientX, y: e.clientY, moved: false };
      viewport.classList.add("is-dragging");
      // NB: deliberately NOT using setPointerCapture here — capturing the
      // pointer on the viewport redirects the synthesized `click` away from
      // the tile, which stops tiles from opening. Drag still works because
      // move/up are bound on window below.
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      x += dx;
      vel = dx;
      const d = downRef.current;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) d.moved = true;
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove("is-dragging");
    };

    measure();
    if (reduce) track.style.transform = "translate3d(0,0,0)";
    rafId = requestAnimationFrame(tick);

    viewport.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    return () => {
      cancelAnimationFrame(rafId);
      viewport.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      ro.disconnect();
    };
  }, [items.length]);

  // open project only if pointer didn't move past the drag threshold
  const openIfNotDragging = (project, triggerEl) => {
    if (downRef.current.moved) return;
    open(project.slug, triggerEl);
  };

  // two copies back-to-back for a seamless loop
  const loop = [...items, ...items];

  return (
    <div ref={viewportRef} className="v20ow-slider" aria-label="Selected work reel">
      <ul ref={trackRef} className="v20ow-track">
        {loop.map((p, i) => {
          const isClone = i >= items.length;
          return (
            <li
              key={`${p.slug}-${i}`}
              className="v20ow-slide"
              aria-hidden={isClone}
              data-cursor="read-more"
              data-cursor-label={`READ · ${p.client.toUpperCase()}`}
              onClick={(e) => openIfNotDragging(p, e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open(p.slug, e.currentTarget);
                }
              }}
              role={isClone ? undefined : "button"}
              tabIndex={isClone ? -1 : 0}
            >
              <div className="v20ow-slide-media">
                <DualLayerImage
                  src={p.thumb || p.hero}
                  alt={`${p.client} — ${p.title}`}
                />
                <span className="v20ow-slide-tint" aria-hidden="true" />
                <GlassPill client={p.client} />
              </div>
              <div className="v20ow-slide-info">
                <span className="v20ow-slide-client">{p.client}</span>
                <span className="v20ow-slide-title">{p.title}</span>
                <span className="v20ow-slide-tag">{p.category}</span>
              </div>
            </li>
          );
        })}
      </ul>
      {showHint && (
        <span className="v20ow-drag-hint" aria-hidden="true">
          ↤ drag · click to open ↦
        </span>
      )}
    </div>
  );
}

/* ---------- Part 2: scroll-parallax archive (4-column wall) ---------- */
function WorkParallax({ columns }) {
  const galleryRef = useRef(null);
  const [vh, setVh] = useState(0);
  const [reduced, setReduced] = useState(false);

  const { scrollYProgress } = useScroll({
    target: galleryRef,
    offset: ["start end", "end start"],
  });

  const h = reduced ? 0 : vh;
  const y1 = useTransform(scrollYProgress, [0, 1], [0, h * 2]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, h * 3.3]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, h * 1.25]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, h * 3]);
  const ys = [y1, y2, y3, y4];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMQ = () => setReduced(mq.matches);
    const onResize = () => setVh(window.innerHeight);
    onMQ();
    onResize();
    mq.addEventListener?.("change", onMQ);
    window.addEventListener("resize", onResize);
    return () => {
      mq.removeEventListener?.("change", onMQ);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={galleryRef} className="v20ow-parallax">
      {columns.map((projects, i) => (
        <ParallaxColumn
          key={i}
          projects={projects}
          y={ys[i]}
          variant={i + 1}
        />
      ))}
    </div>
  );
}

/* Studio-Clim-style dual-layer image. The base (.v20ow-im-h) blurs + scales
   on hover; the overlay (.v20ow-im-hv) reveals through an expanding ellipse
   while rotating 150° (its inner img counter-rotates so the picture stays
   upright). All easing is the Clim cubic-bezier(.55, 0, .1, 1) signature.
   Animated entirely via CSS — see .v20ow-im-h / .v20ow-im-hv in v20.css. */
function DualLayerImage({ src, alt = "" }) {
  return (
    <>
      <span className="v20ow-im-h" aria-hidden={alt ? undefined : "true"}>
        <img src={src} alt={alt} loading="lazy" decoding="async" draggable="false" />
      </span>
      <span className="v20ow-im-hv" aria-hidden="true">
        <img src={src} alt="" loading="lazy" decoding="async" draggable="false" />
      </span>
    </>
  );
}

/* Frosted-glass pill that slides up from the bottom edge of a tile on hover.
   Animated entirely via CSS — see .v20ow-glass-pill in v20.css. */
function GlassPill({ client }) {
  return (
    <span className="v20ow-glass-pill" aria-hidden="true">
      <span className="v20ow-glass-pill-label">{client}</span>
      <svg
        className="v20ow-glass-pill-arrow"
        width="14"
        height="10"
        viewBox="0 0 14 10"
        fill="none"
      >
        <path
          d="M1 5h11.5M8.5 1l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function ParallaxColumn({ projects, y, variant }) {
  const { open } = useProjectDrawer();
  return (
    <motion.div className={`v20ow-pcol v20ow-pcol--${variant}`} style={{ y }}>
      {projects.map((p, i) => (
        <button
          type="button"
          key={`${p.slug}-${i}`}
          className="v20ow-ptile v20ow-ptile-link"
          data-cursor="read-more"
          data-cursor-label={`READ · ${p.client.toUpperCase()}`}
          onClick={(e) => open(p.slug, e.currentTarget)}
          aria-label={`Read more: ${p.client} — ${p.title}`}
        >
          <DualLayerImage src={p.thumb || p.hero} alt="" />
          <GlassPill client={p.client} />
        </button>
      ))}
    </motion.div>
  );
}
