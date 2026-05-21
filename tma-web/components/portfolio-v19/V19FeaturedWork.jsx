"use client";

import { useEffect, useRef, useState } from "react";
import V19Filament from "./V19Filament";

/* =====================================================================
   V19 — Featured Work
   ---------------------------------------------------------------------
   Three featured projects in a clean 3-column row. The poster stays
   static; on hover a small <video> tile follows the cursor with eased
   inertia (the ref.digital /work pattern). Cards rise in on scroll.
   ===================================================================== */

const PROJECTS = [
  {
    slug: "foodics-boundless",
    title: "Boundless",
    client: "Foodics",
    year: 2025,
    sector: "Hospitality SaaS",
    poster: "/assets/case-foodics-boundless.png",
    video: "/assets/hero1.mp4",
  },
  {
    slug: "zid-ripple",
    title: "Ripple",
    client: "Zid",
    year: 2025,
    sector: "Commerce Identity",
    poster: "/assets/case-zid-ripple.png",
    video: "/assets/Zid%20-%20Strategy.MP4",
  },
  {
    slug: "vodafone",
    title: "Vodafone",
    client: "Vodafone",
    year: 2024,
    sector: "Telecom TVC",
    poster: "/assets/portfolio/slide-73.jpg",
    video: "/assets/voda.mp4",
  },
];

export default function V19FeaturedWork() {
  const gridRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="v19fw">
      <V19Filament />
      <header className="v19fw-header container">
        <span className="v19fw-eyebrow">
          <span className="v19fw-eyebrow-tick" />
          Selected work · 2024–25
        </span>
        <h2 className="v19fw-title">
          Featured <em>narratives</em>
        </h2>
        <p className="v19fw-lede">
          Three chapters from this year's reel. Hover to play the cut.
        </p>
      </header>

      <ul
        ref={gridRef}
        className={`v19fw-grid container ${inView ? "is-inview" : ""}`}
      >
        {PROJECTS.map((project, index) => (
          <FeaturedCard key={project.slug} project={project} index={index} />
        ))}
      </ul>
    </section>
  );
}

/* ---------- single card ---------- */
function FeaturedCard({ project, index }) {
  const cardRef = useRef(null);
  const tileRef = useRef(null);
  const videoRef = useRef(null);
  /* First cursor position from onMouseEnter, so the rAF loop has a seed
     before the user moves — prevents a one-frame flash at the corner. */
  const seedRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  /* Cursor-trailing tile: runs an rAF only while the card is hovered.
     Lerp matches ref.digital's easeSlow (target += (raw - target) / 15). */
  useEffect(() => {
    if (!hovered) return;

    const card = cardRef.current;
    const tile = tileRef.current;
    if (!card || !tile) return;

    const rect = card.getBoundingClientRect();
    const seed = seedRef.current;
    const target = seed
      ? { x: seed.x - rect.left, y: seed.y - rect.top }
      : { x: rect.width / 2, y: rect.height / 2 };
    const eased = { x: target.x, y: target.y };
    tile.style.transform =
      `translate3d(${eased.x}px, ${eased.y}px, 0) translate(-50%, -50%)`;

    let rafId = 0;

    const onPointerMove = (e) => {
      const r = card.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
    };

    const tick = () => {
      eased.x += (target.x - eased.x) / 15;   // matches ref's easeSlow lerp
      eased.y += (target.y - eased.y) / 15;
      tile.style.transform =
        `translate3d(${eased.x}px, ${eased.y}px, 0) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    const v = videoRef.current;
    if (v) {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      if (v) {
        v.pause();
        v.currentTime = 0;
      }
      seedRef.current = null;
    };
  }, [hovered]);

  const handleEnter = (e) => {
    seedRef.current = { x: e.clientX, y: e.clientY };
    setHovered(true);
  };

  return (
    <li className="v19fw-card" style={{ "--i": index }}>
      <a
        ref={cardRef}
        href={`#work-${project.slug}`}
        className="v19fw-card-link"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovered(false)}
        aria-label={`${project.client} — ${project.title}`}
      >
        <div className="v19fw-card-media">
          <img
            className="v19fw-card-poster"
            src={project.poster}
            alt=""
            loading="lazy"
            decoding="async"
          />

          <span className="v19fw-card-tint" aria-hidden="true" />

          <span className="v19fw-card-index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Cursor-trailing video tile — transform is set by the rAF loop. */}
          <div
            ref={tileRef}
            className={`v19fw-hover-tile ${hovered ? "is-active" : ""}`}
            aria-hidden="true"
          >
            <video
              ref={videoRef}
              src={project.video}
              muted
              loop
              playsInline
              preload="metadata"
            />
            <span className="v19fw-hover-corner v19fw-hover-corner--tl" />
            <span className="v19fw-hover-corner v19fw-hover-corner--tr" />
            <span className="v19fw-hover-corner v19fw-hover-corner--br" />
            <span className="v19fw-hover-corner v19fw-hover-corner--bl" />
          </div>
        </div>

        <div className="v19fw-card-info">
          <div className="v19fw-card-titles">
            <span className="v19fw-card-client">{project.client}</span>
            <h3 className="v19fw-card-title">{project.title}</h3>
          </div>
          <div className="v19fw-card-tags">
            <span>{project.sector}</span>
            <span className="v19fw-card-year">{project.year}</span>
          </div>
        </div>
      </a>
    </li>
  );
}
