"use client";

import { useCallback, useEffect, useRef } from "react";

/* =====================================================================
   V19 — Featured Work
   ---------------------------------------------------------------------
   Three featured projects in a clean 3-column row.

   Hover model (ported from ref.digital /work): the moment the cursor is
   anywhere over the grid, EVERY card's video tile turns on. All tiles
   follow one shared eased cursor in page space, and each tile is clipped
   to its own card (overflow:hidden). So at the seam between two cards you
   see the left card's video on the left half and the right card's video
   on the right half — and the slice fills in as the cursor moves toward
   one card. Cards also open/close on scroll (clip-path driven by JS).
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
  /* Each card registers its media box / tile / video so the parent can
     drive them all from a single shared-cursor loop. */
  const itemsRef = useRef([]);

  const register = useCallback((index, refs) => {
    itemsRef.current[index] = refs;
  }, []);

  /* ---------- Scroll-linked open/close reveal ----------
     --reveal : top clip-inset (100% closed -> 0% open) so the media opens
                bottom->up scrolling down and closes top->down scrolling up.
     --p      : same 0->1 progress for the caption fade/rise.
     Wide window + eased target + per-frame damping = slow & smooth. */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll(".v19fw-card"));
    if (!cards.length) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
      cards.forEach((c) => {
        c.style.setProperty("--reveal", "0%");
        c.style.setProperty("--p", "1");
      });
      return;
    }

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const state = cards.map(() => ({ cur: 0, target: 0 }));
    let rafId = 0;
    let running = false;

    const setProps = (i, p) => {
      cards[i].style.setProperty("--reveal", `${((1 - p) * 100).toFixed(2)}%`);
      cards[i].style.setProperty("--p", p.toFixed(3));
    };

    const computeTargets = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const offset = i * vh * 0.06; // gentle left->right stagger
        const start = vh * 0.8 + offset; // card top here -> starts opening
        const end = vh * 0.22 + offset; // card top here -> fully open
        let p = (start - rect.top) / (start - end);
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        state[i].target = easeInOutCubic(p);
      });
    };

    const tick = () => {
      let moving = false;
      for (let i = 0; i < cards.length; i++) {
        const s = state[i];
        s.cur += (s.target - s.cur) * 0.07; // damping: lower = smoother/slower
        if (Math.abs(s.target - s.cur) > 0.0015) moving = true;
        else s.cur = s.target;
        setProps(i, s.cur);
      }
      if (moving) rafId = requestAnimationFrame(tick);
      else running = false;
    };

    const ensureRunning = () => {
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(tick);
      }
    };

    const onScroll = () => {
      computeTargets();
      ensureRunning();
    };

    // seed: paint each card at its correct target with no entry animation
    computeTargets();
    state.forEach((s) => (s.cur = s.target));
    for (let i = 0; i < cards.length; i++) setProps(i, state[i].cur);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* ---------- Section-wide shared-cursor hover ----------
     One eased cursor drives every tile, so the slices line up at the
     seam between cards. Active only while the pointer is over the grid. */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;

    let rawX = 0;
    let rawY = 0;
    let easeX = 0;
    let easeY = 0;
    let seeded = false;
    let rafId = 0;
    let active = false;

    const seed = (e) => {
      rawX = e.clientX;
      rawY = e.clientY;
      if (!seeded) {
        easeX = rawX;
        easeY = rawY;
        seeded = true;
      }
    };

    const position = () => {
      easeX += (rawX - easeX) / 15; // matches ref's easeSlow lerp
      easeY += (rawY - easeY) / 15;
      const items = itemsRef.current;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it || !it.media || !it.tile) continue;
        const rect = it.media.getBoundingClientRect();
        const tx = easeX - rect.left;
        const ty = easeY - rect.top;
        it.tile.style.transform =
          `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(position);
    };

    const activate = () => {
      if (active) return;
      active = true;
      itemsRef.current.forEach((it) => {
        if (!it) return;
        if (it.tile) it.tile.classList.add("is-active");
        if (it.video) {
          const p = it.video.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        }
      });
      rafId = requestAnimationFrame(position);
    };

    const deactivate = () => {
      if (!active) return;
      active = false;
      cancelAnimationFrame(rafId);
      itemsRef.current.forEach((it) => {
        if (!it) return;
        if (it.tile) it.tile.classList.remove("is-active");
        if (it.video) {
          it.video.pause();
          it.video.currentTime = 0;
        }
      });
    };

    const onEnter = (e) => {
      seed(e);
      activate();
    };

    grid.addEventListener("pointerenter", onEnter);
    grid.addEventListener("pointermove", seed, { passive: true });
    grid.addEventListener("pointerleave", deactivate);
    return () => {
      cancelAnimationFrame(rafId);
      grid.removeEventListener("pointerenter", onEnter);
      grid.removeEventListener("pointermove", seed);
      grid.removeEventListener("pointerleave", deactivate);
    };
  }, []);

  return (
    <section className="v19fw">
      <header className="v19fw-header container">
        <span className="v19fw-eyebrow">
          <span className="v19fw-eyebrow-tick" />
          Selected work · 2024–25
        </span>
        <h2 className="v19fw-title">
          <span className="v19fw-title-word">Featured</span> <em>narratives</em>
        </h2>
        <p className="v19fw-lede">
          Three chapters from this year's reel. Hover to play the cut.
        </p>
      </header>

      <ul ref={gridRef} className="v19fw-grid container">
        {PROJECTS.map((project, index) => (
          <FeaturedCard
            key={project.slug}
            project={project}
            index={index}
            register={register}
          />
        ))}
      </ul>
    </section>
  );
}

/* ---------- single card ---------- */
function FeaturedCard({ project, index, register }) {
  const mediaRef = useRef(null);
  const tileRef = useRef(null);
  const videoRef = useRef(null);

  /* Hand the parent this card's media box / tile / video. The parent's
     shared-cursor loop positions the tile and plays the video. */
  useEffect(() => {
    register(index, {
      media: mediaRef.current,
      tile: tileRef.current,
      video: videoRef.current,
    });
    return () => register(index, null);
  }, [index, register]);

  return (
    <li className="v19fw-card" style={{ "--i": index }}>
      <a
        href={`#work-${project.slug}`}
        className="v19fw-card-link"
        aria-label={`${project.client} — ${project.title}`}
      >
        <div ref={mediaRef} className="v19fw-card-media">
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

          {/* Cursor-trailing video tile — transform set by the parent loop. */}
          <div ref={tileRef} className="v19fw-hover-tile" aria-hidden="true">
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
