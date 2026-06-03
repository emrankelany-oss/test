"use client";

import { useEffect, useRef, useState } from "react";
import { PROJECTS } from "./projects";
import { useProjectDrawer } from "./useProjectDrawer";
import { useTileTilt } from "./useTileTilt";

/* =====================================================================
   V21 — Our Work
   ---------------------------------------------------------------------
   Real PDF content sourced via projects.js (the full TMA roster).
   - Two draggable reels (Part 1) auto-scroll in opposite directions.
   - A divider, then a filterable clean 3-up grid (Part 2) showing EVERY
     project, with a hover effect and hover-to-play video on the ones
     that have a film.
   Every tile opens the project drawer with its full PDF content.
   ===================================================================== */

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

function findProject(slug) {
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p) throw new Error(`[V21OurWork] unknown project slug: ${slug}`);
  return p;
}

/* ---- Filter buckets. Every project maps to exactly one group. ---- */
const FILTERS = ["All", "Film & Motion", "Branding", "Campaigns", "Digital"];
function groupOf(p) {
  const c = (p.category || "").toLowerCase();
  if (p.video || /film|tvc|animation|motion/.test(c)) return "Film & Motion";
  if (/identity|brand/.test(c)) return "Branding";
  if (/landing|product|app|web|display/.test(c)) return "Digital";
  return "Campaigns"; // event, social, launch, ooh, campaign…
}

export default function V21OurWork() {
  // one document-level listener handles tilt for every reel slide
  useTileTilt(".v21ow-slide");

  return (
    <section className="v21ow">
      <header className="v21ow-header container">
        <span className="v21ow-eyebrow">
          <span className="v21ow-eyebrow-tick" />
          The archive · selected clients
        </span>
        <h2 className="v21ow-title">
          <span className="v21ow-title-word">Our</span> <em>work</em>
        </h2>
        <p className="v21ow-lede">
          Campaigns, identities and films across the GCC — drag the reel,
          click any tile to read the full story.
        </p>
      </header>

      <WorkSlider items={REEL_A} showHint />
      <WorkSlider items={REEL_B} reverse />

      <div className="v21ow-divider container" aria-hidden="true">
        <span className="v21ow-divider-label">The full archive</span>
      </div>

      <WorkGrid items={PROJECTS} />
    </section>
  );
}

/* ---------- Part 1: looping draggable slider ---------- */
function WorkSlider({ items, reverse = false, showHint = false }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const { open } = useProjectDrawer();
  const downRef = useRef({ x: 0, y: 0, moved: false });

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let setWidth = 0;
    let x = 0;
    let vel = 0;
    let dragging = false;
    let lastX = 0;
    let rafId = 0;
    const AUTO = 0.9;
    const dir = reverse ? -1 : 1;

    const measure = () => {
      const first = track.children[0];
      const mid = track.children[items.length];
      setWidth =
        first && mid ? mid.offsetLeft - first.offsetLeft : track.scrollWidth / 2;
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
    const onUp = () => {
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

  const openIfNotDragging = (project, triggerEl) => {
    if (downRef.current.moved) return;
    open(project.slug, triggerEl);
  };

  const loop = [...items, ...items];

  return (
    <div ref={viewportRef} className="v21ow-slider" aria-label="Selected work reel">
      <ul ref={trackRef} className="v21ow-track">
        {loop.map((p, i) => {
          const isClone = i >= items.length;
          return (
            <li
              key={`${p.slug}-${i}`}
              className="v21ow-slide"
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
              <div className="v21ow-slide-media">
                <DualLayerImage src={p.thumb || p.hero} alt={`${p.client} — ${p.title}`} />
                <span className="v21ow-slide-tint" aria-hidden="true" />
              </div>
              <div className="v21ow-slide-info">
                <span className="v21ow-slide-client">{p.client}</span>
                <span className="v21ow-slide-title">{p.title}</span>
                <span className="v21ow-slide-tag">{p.category}</span>
              </div>
            </li>
          );
        })}
      </ul>
      {showHint && (
        <span className="v21ow-drag-hint" aria-hidden="true">
          ↤ drag · click to open ↦
        </span>
      )}
    </div>
  );
}

/* ---------- Part 2: filterable clean grid ---------- */
function WorkGrid({ items }) {
  const gridRef = useRef(null);
  const [filter, setFilter] = useState("All");

  const visible =
    filter === "All" ? items : items.filter((p) => groupOf(p) === filter);

  // Bidirectional page-flip reveal: cards flip IN as they scroll into view
  // and flip back OUT (the opposite) as they leave on scroll-up. Re-runs on
  // filter change so freshly shown tiles are observed.
  useEffect(() => {
    const root = gridRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tiles = Array.from(root.querySelectorAll(".v21ow-gtile"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          e.target.classList.toggle("is-revealed", e.isIntersecting);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );
    tiles.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [filter]);

  return (
    <div className="v21ow-archive container">
      <div className="v21ow-filters" role="tablist" aria-label="Filter work by type">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            className={`v21ow-filter${filter === f ? " is-active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div ref={gridRef} className="v21ow-grid">
        {visible.map((p) => (
          <GridTile key={p.slug} p={p} />
        ))}
      </div>
    </div>
  );
}

/* A single archive tile. Films autoplay (muted/looping); on hover the same
   frosted glass pill as the reels (Part 1) rises into view. */
function GridTile({ p }) {
  const { open } = useProjectDrawer();
  const hasVideo = !!p.video;

  return (
    <button
      type="button"
      className={`v21ow-gtile${hasVideo ? " has-video" : ""}`}
      data-cursor="read-more"
      data-cursor-label={`READ · ${p.client.toUpperCase()}`}
      onClick={(e) => open(p.slug, e.currentTarget)}
      aria-label={`Read more: ${p.client} — ${p.title}`}
    >
      <span className="v21ow-gtile-media">
        {hasVideo ? (
          <>
            <img
              className="v21ow-gtile-img"
              src={p.thumb || p.hero}
              alt={`${p.client} — ${p.title}`}
              loading="lazy"
              decoding="async"
              draggable="false"
            />
            <video
              className="v21ow-gtile-video"
              src={p.video}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              aria-hidden="true"
            />
          </>
        ) : (
          <DualLayerImage src={p.thumb || p.hero} alt={`${p.client} — ${p.title}`} />
        )}
        <span className="v21ow-gtile-tint" aria-hidden="true" />
      </span>
      <span className="v21ow-gtile-cap">
        <span className="v21ow-gtile-client">{p.client}</span>
        <span className="v21ow-gtile-cat">{p.category}</span>
      </span>
    </button>
  );
}

/* Studio-Clim-style dual-layer image used by the reels. */
function DualLayerImage({ src, alt = "" }) {
  return (
    <>
      <span className="v21ow-im-h" aria-hidden={alt ? undefined : "true"}>
        <img src={src} alt={alt} loading="lazy" decoding="async" draggable="false" />
      </span>
      <span className="v21ow-im-hv" aria-hidden="true">
        <img src={src} alt="" loading="lazy" decoding="async" draggable="false" />
      </span>
    </>
  );
}

