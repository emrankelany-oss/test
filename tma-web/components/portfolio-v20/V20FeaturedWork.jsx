"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/* =====================================================================
   V20 — Featured Work
   ---------------------------------------------------------------------
   Three featured projects in a clean 3-column row.

   Hover model (premium, full-card play):
     • Hovering a card crossfades its project video in over the whole card
       and plays it; leaving fades it out, pauses and resets.
     • A glassy circular "VIEW VIDEO" badge follows the cursor while it is
       over the grid (native cursor hidden over the cards).
     • The hovered card is spotlit — its two siblings dim + desaturate
       (pure CSS via :has()).
   Cards also open/close on scroll (clip-path driven by JS, unchanged).

   Click model:
     • A project with several films (a `videos` array) expands IN PLACE:
       the clicked card morphs out into a full "reel" gallery — a featured
       player plus that project's films grouped by type (ProjectGallery).
     • A project with a single film opens the simple centred VideoModal.
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
    // Full reel — browsed in the expand-in-place gallery.
    videos: [
      {
        id: "foodics-boundless-2022",
        group: "Event Films",
        title: "Boundless 2022",
        meta: "Annual Product Event",
        kind: "youtube",
        youtubeId: "ZqrF7NYuXHU",
      },
      {
        id: "foodics-boundless-2023",
        group: "Event Films",
        title: "Boundless 2023",
        meta: "Annual Product Event",
        kind: "youtube",
        youtubeId: "uzd9os9G1d8",
      },
      {
        id: "foodics-tvc-cafe",
        group: "TV Commercials",
        title: "Café Spot",
        meta: "1:04",
        kind: "mp4",
        src: "/assets/videos/media1.mp4",
        poster: "/assets/videos/posters/media1.jpg",
      },
      {
        id: "foodics-tvc-living-room",
        group: "TV Commercials",
        title: "Living-Room Spot",
        meta: "0:34",
        kind: "mp4",
        src: "/assets/videos/media5.mp4",
        poster: "/assets/videos/posters/media5.jpg",
      },
      {
        id: "foodics-kiosk",
        group: "Product Films",
        title: "Self-Order Kiosk",
        meta: "0:50",
        kind: "mp4",
        src: "/assets/videos/media6.mp4",
        poster: "/assets/videos/posters/media6.jpg",
      },
      {
        id: "foodics-pos-printer",
        group: "Product Films",
        title: "POS + Printer",
        meta: "0:35",
        kind: "mp4",
        src: "/assets/videos/media22.mp4",
        poster: "/assets/videos/posters/media22.jpg",
      },
      {
        id: "foodics-app",
        group: "Product Films",
        title: "App — New Version",
        meta: "0:40",
        kind: "mp4",
        src: "/assets/videos/hero1.mp4",
        poster: "/assets/videos/posters/hero1.jpg",
      },
    ],
  },
  {
    slug: "zid-ripple",
    title: "Ripple",
    client: "Zid",
    year: 2025,
    sector: "Commerce Identity",
    poster: "/assets/case-zid-ripple.png",
    video: "/assets/Zid%20-%20Strategy.MP4",
    videos: [
      {
        id: "zid-ripple-2024",
        group: "Event Films",
        title: "Ripple 2024",
        meta: "Annual Product Event",
        kind: "youtube",
        youtubeId: "GSSS71zV5HI",
      },
      {
        id: "zid-strategy",
        group: "Brand Films",
        title: "Strategy Film",
        meta: "1:03",
        kind: "mp4",
        src: "/assets/videos/Zid%20-%20Strategy.MP4",
        poster: "/assets/videos/posters/Zid---Strategy.jpg",
      },
    ],
  },
  {
    slug: "vodafone",
    title: "Vodafone",
    client: "Vodafone",
    year: 2024,
    sector: "Telecom TVC",
    poster: "/assets/portfolio/vodafone-global/portrait.jpg",
    video: "/assets/voda.mp4",
  },
];

/* A project opens the multi-film gallery only when it has 2+ films. */
const hasReel = (project) => (project.videos?.length ?? 0) > 1;

export default function V20FeaturedWork() {
  const gridRef = useRef(null);
  const cursorRef = useRef(null);
  // The project whose single film is open in the centred modal (null = closed).
  const [openProject, setOpenProject] = useState(null);
  // The project + origin rect whose multi-film reel is expanded (null = closed).
  const [reel, setReel] = useState(null);

  const openModal = useCallback((project) => setOpenProject(project), []);
  const closeModal = useCallback(() => setOpenProject(null), []);
  const openReel = useCallback(
    (project, originRect) => setReel({ project, originRect }),
    []
  );
  const closeReel = useCallback(() => setReel(null), []);

  /* ---------- Scroll-linked open/close reveal ----------
     --reveal : top clip-inset (100% closed -> 0% open) so the media opens
                bottom->up scrolling down and closes top->down scrolling up.
     --p      : same 0->1 progress for the caption fade/rise.
     Wide window + eased target + per-frame damping = slow & smooth. */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll(".v20fw-card"));
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

  /* ---------- "VIEW VIDEO" cursor badge ----------
     One glassy badge eased toward the pointer while it is over the grid.
     The native cursor is hidden over the cards (see CSS), so this badge is
     the cursor. Pointer-fine devices only — touch keeps native behaviour. */
  useEffect(() => {
    const grid = gridRef.current;
    const cursor = cursorRef.current;
    if (!grid || !cursor) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;

    let rawX = 0;
    let rawY = 0;
    let easeX = 0;
    let easeY = 0;
    let rafId = 0;
    let active = false;

    const seed = (e) => {
      rawX = e.clientX;
      rawY = e.clientY;
    };

    const place = () => {
      cursor.style.transform =
        `translate3d(${easeX.toFixed(2)}px, ${easeY.toFixed(2)}px, 0) translate(-50%, -50%)`;
    };

    const loop = () => {
      easeX += (rawX - easeX) / 6; // snappy follow, still eased
      easeY += (rawY - easeY) / 6;
      place();
      rafId = requestAnimationFrame(loop);
    };

    const activate = (e) => {
      if (active) return;
      active = true;
      // snap to the entry point so the badge doesn't streak in from 0,0
      rawX = easeX = e.clientX;
      rawY = easeY = e.clientY;
      place();
      cursor.classList.add("is-active");
      rafId = requestAnimationFrame(loop);
    };

    const deactivate = () => {
      if (!active) return;
      active = false;
      cancelAnimationFrame(rafId);
      cursor.classList.remove("is-active");
    };

    grid.addEventListener("pointerenter", activate);
    grid.addEventListener("pointermove", seed, { passive: true });
    grid.addEventListener("pointerleave", deactivate);
    return () => {
      cancelAnimationFrame(rafId);
      grid.removeEventListener("pointerenter", activate);
      grid.removeEventListener("pointermove", seed);
      grid.removeEventListener("pointerleave", deactivate);
    };
  }, []);

  return (
    <section className="v20fw">
      <header className="v20fw-header container">
        <span className="v20fw-eyebrow">
          <span className="v20fw-eyebrow-tick" />
          Selected work · 2024–25
        </span>
        <h2 className="v20fw-title">
          <span className="v20fw-title-word">Featured</span> <em>narratives</em>
        </h2>
        <p className="v20fw-lede">
          Three chapters from this year's reel. Hover to play the cut.
        </p>
      </header>

      <ul ref={gridRef} className="v20fw-grid container">
        {PROJECTS.map((project, index) => (
          <FeaturedCard
            key={project.slug}
            project={project}
            index={index}
            onOpen={openModal}
            onOpenReel={openReel}
          />
        ))}
      </ul>

      {/* Cursor badge — follows the pointer over the grid (see effect above) */}
      <div ref={cursorRef} className="v20fw-cursor" aria-hidden="true">
        <span className="v20fw-cursor-ring" />
        <svg
          className="v20fw-cursor-play"
          viewBox="0 0 24 24"
          width="15"
          height="15"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" fill="currentColor" />
        </svg>
        <span className="v20fw-cursor-label">View Video</span>
      </div>

      {openProject && (
        <VideoModal project={openProject} onClose={closeModal} />
      )}

      {reel && (
        <ProjectGallery
          project={reel.project}
          originRect={reel.originRect}
          onClose={closeReel}
        />
      )}
    </section>
  );
}

/* ---------- single card ---------- */
function FeaturedCard({ project, index, onOpen, onOpenReel }) {
  const videoRef = useRef(null);
  const reel = hasReel(project);
  const filmCount = project.videos?.length ?? 0;

  const onEnter = () => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };

  const onLeave = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  // Click expands the reel in place (multi-film) or opens the single modal.
  const onClick = (e) => {
    e.preventDefault();
    if (reel) {
      const rect = e.currentTarget.getBoundingClientRect();
      onOpenReel(project, rect);
    } else {
      onOpen(project);
    }
  };

  return (
    <li className="v20fw-card" style={{ "--i": index }}>
      <a
        href={`#work-${project.slug}`}
        className="v20fw-card-link"
        aria-label={
          reel
            ? `Browse ${filmCount} ${project.client} films`
            : `Play ${project.client} — ${project.title} video`
        }
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onClick={onClick}
      >
        <div className="v20fw-card-media">
          <img
            className="v20fw-card-poster"
            src={project.poster}
            alt=""
            loading="lazy"
            decoding="async"
          />

          {/* Full-card video — crossfades in on hover (CSS), plays via JS. */}
          <video
            ref={videoRef}
            className="v20fw-card-video"
            src={project.video}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />

          <span className="v20fw-card-tint" aria-hidden="true" />

          <span className="v20fw-card-index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>

          {reel && (
            <span className="v20fw-card-more" aria-hidden="true">
              See all {filmCount} films
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </div>

        <div className="v20fw-card-info">
          <div className="v20fw-card-titles">
            <span className="v20fw-card-client">{project.client}</span>
            <h3 className="v20fw-card-title">{project.title}</h3>
          </div>
          <div className="v20fw-card-tags">
            <span>{project.sector}</span>
            <span className="v20fw-card-year">{project.year}</span>
          </div>
        </div>
      </a>
    </li>
  );
}

/* ---------- full-video modal ----------
   Centred 16:9 player over a blurred backdrop. Opened by a card click
   (a user gesture, so autoplay-with-sound is permitted). Closes on the
   × button, a backdrop click, or Esc. Page scroll is locked while open
   and focus is restored to the trigger on close. */
function VideoModal({ project, onClose }) {
  const videoRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const trigger = document.activeElement; // restore focus here on close

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // lock page scroll + hide the global nav so the lightbox owns the screen
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("v20fw-modal-open");

    // move focus into the dialog
    closeRef.current?.focus();

    // play with sound (the opening click is the required user gesture)
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("v20fw-modal-open");
      if (trigger && typeof trigger.focus === "function") trigger.focus();
    };
  }, [onClose]);

  // Portal to <body> so the overlay escapes the section's stacking context
  // (.v20fw is position:relative;z-index:1) and sits above the nav.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="v20fw-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${project.client} — ${project.title}`}
    >
      <button
        type="button"
        className="v20fw-modal-backdrop"
        aria-label="Close video"
        onClick={onClose}
        tabIndex={-1}
      />

      <div className="v20fw-modal-dialog">
        <div className="v20fw-modal-head">
          <div className="v20fw-modal-titles">
            <span className="v20fw-modal-client">{project.client}</span>
            <span className="v20fw-modal-title">{project.title}</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="v20fw-modal-close"
            onClick={onClose}
            aria-label="Close video"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="v20fw-modal-frame">
          <video
            ref={videoRef}
            src={project.video}
            poster={project.poster}
            controls
            autoPlay
            playsInline
            loop
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- expand-in-place reel gallery ----------
   The clicked card morphs out (FLIP from its rect) into a full panel:
   a featured player on top, then the project's films grouped by type.
   Clicking a film tile crossfades it into the featured player. Closes on
   the × button, a backdrop click, or Esc (reverse FLIP back to the card).
   Portaled to <body>; page scroll locked; nav hidden while open. */
const YT_POSTER = (id) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
const ytEmbed = (id) =>
  `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;

function ProjectGallery({ project, originRect, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const films = project.videos;
  const [active, setActive] = useState(films[0]);

  // group the films, preserving first-seen group order
  const groups = [];
  for (const f of films) {
    let g = groups.find((x) => x.name === f.group);
    if (!g) {
      g = { name: f.group, items: [] };
      groups.push(g);
    }
    g.items.push(f);
  }

  const reduceMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reverse-FLIP the panel back toward the originating card, then unmount.
  const animateClose = useCallback(() => {
    const panel = panelRef.current;
    if (!panel || !originRect || reduceMotion()) {
      onClose();
      return;
    }
    const to = panel.getBoundingClientRect();
    const sx = originRect.width / to.width;
    const sy = originRect.height / to.height;
    const dx = originRect.left - to.left;
    const dy = originRect.top - to.top;
    panel.style.transformOrigin = "top left";
    panel.style.transition =
      "transform 0.42s cubic-bezier(.4,0,.2,1), opacity 0.42s ease";
    panel.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    panel.style.opacity = "0";
    panel.parentElement?.classList.add("is-closing");
    window.setTimeout(onClose, 420);
  }, [originRect, onClose]);

  // FLIP open: start at the card's rect, then play to the panel's resting box.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !originRect || reduceMotion()) return;
    const to = panel.getBoundingClientRect();
    const sx = originRect.width / to.width;
    const sy = originRect.height / to.height;
    const dx = originRect.left - to.left;
    const dy = originRect.top - to.top;
    panel.style.transformOrigin = "top left";
    panel.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    panel.style.opacity = "0.5";
    // force reflow so the start transform is committed before we transition
    void panel.getBoundingClientRect();
    requestAnimationFrame(() => {
      panel.style.transition =
        "transform 0.5s cubic-bezier(.2,.8,.2,1), opacity 0.4s ease";
      panel.style.transform = "none";
      panel.style.opacity = "1";
    });
  }, [originRect]);

  useEffect(() => {
    const trigger = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") animateClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("v20fw-modal-open");
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("v20fw-modal-open");
      if (trigger && typeof trigger.focus === "function") trigger.focus();
    };
  }, [animateClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="v20pg"
      role="dialog"
      aria-modal="true"
      aria-label={`${project.client} — films`}
    >
      <button
        type="button"
        className="v20pg-backdrop"
        aria-label="Close gallery"
        onClick={animateClose}
        tabIndex={-1}
      />

      <div ref={panelRef} className="v20pg-panel">
        <header className="v20pg-head">
          <div className="v20pg-titles">
            <span className="v20pg-client">{project.client}</span>
            <span className="v20pg-count">{films.length} films</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="v20pg-close"
            onClick={animateClose}
            aria-label="Close gallery"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="v20pg-scroll">
          {/* Featured player */}
          <div className="v20pg-stage">
            <div className="v20pg-frame">
              {active.kind === "youtube" ? (
                <iframe
                  key={active.id}
                  className="v20pg-yt"
                  src={ytEmbed(active.youtubeId)}
                  title={`${project.client} — ${active.title}`}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  key={active.id}
                  src={active.src}
                  poster={active.poster}
                  controls
                  autoPlay
                  playsInline
                />
              )}
            </div>
            <div className="v20pg-now">
              <span className="v20pg-now-title">{active.title}</span>
              {active.meta && (
                <span className="v20pg-now-meta">{active.meta}</span>
              )}
            </div>
          </div>

          {/* Films grouped by type */}
          {groups.map((group) => (
            <section key={group.name} className="v20pg-group">
              <h3 className="v20pg-group-title">{group.name}</h3>
              <ul className="v20pg-tiles">
                {group.items.map((film) => (
                  <GalleryTile
                    key={film.id}
                    film={film}
                    isActive={film.id === active.id}
                    onSelect={() => setActive(film)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* one film tile — poster + (mp4) muted micro-loop on hover */
function GalleryTile({ film, isActive, onSelect }) {
  const videoRef = useRef(null);
  const poster = film.kind === "youtube" ? YT_POSTER(film.youtubeId) : film.poster;

  const onEnter = () => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };
  const onLeave = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  return (
    <li>
      <button
        type="button"
        className={`v20pg-tile${isActive ? " is-active" : ""}`}
        onClick={onSelect}
        onPointerEnter={film.kind === "mp4" ? onEnter : undefined}
        onPointerLeave={film.kind === "mp4" ? onLeave : undefined}
        aria-label={`Play ${film.title}`}
        aria-current={isActive ? "true" : undefined}
      >
        <span className="v20pg-tile-media">
          <img
            className="v20pg-tile-poster"
            src={poster}
            alt=""
            loading="lazy"
            decoding="async"
            onError={
              film.kind === "youtube"
                ? (e) => {
                    e.currentTarget.src = `https://i.ytimg.com/vi/${film.youtubeId}/hqdefault.jpg`;
                  }
                : undefined
            }
          />
          {film.kind === "mp4" && (
            <video
              ref={videoRef}
              className="v20pg-tile-video"
              src={film.src}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
            />
          )}
          <span className="v20pg-tile-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </span>
        </span>
        <span className="v20pg-tile-info">
          <span className="v20pg-tile-title">{film.title}</span>
          {film.meta && <span className="v20pg-tile-meta">{film.meta}</span>}
        </span>
      </button>
    </li>
  );
}
