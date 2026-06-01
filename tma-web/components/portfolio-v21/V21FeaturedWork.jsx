"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/* =====================================================================
   V21 — Featured Work
   ---------------------------------------------------------------------
   Three featured projects as full-width editorial cinematic bands.

   Each band is a 16:9 media panel with a bottom-anchored overlay showing
   the project caption (mono, uppercase) and large serif title.
   The poster/video live inside an oversized `.v21fw-band-inner` wrapper
   that is parallaxed via GSAP ScrollTrigger — the overflow is clipped by
   `.v21fw-band-media` so the motion is contained without affecting layout.

   Hover model:
     • Hovering a band fades the project video in over the poster.
     • The poster scale rests at 1.04 and eases back to 1.0 on hover.

   Click model:
     • A project with several films (a `videos` array) expands IN PLACE:
       the clicked band morphs out into a full "reel" gallery — a featured
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

export default function V21FeaturedWork() {
  const rootRef = useRef(null);
  const reduced = usePrefersReducedMotion();
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

  /* ---------- GSAP bands reveal + parallax ---------- */
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".v21fw-band").forEach((band) => {
        ScrollTrigger.create({
          trigger: band,
          start: "top 82%",
          once: true,
          onEnter: () => band.classList.add("is-revealed"),
        });
        const media = band.querySelector(".v21fw-band-inner");
        if (media) {
          gsap.fromTo(
            media,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: {
                trigger: band,
                start: "top bottom",
                end: "bottom top",
                scrub: 2.5,
              },
            }
          );
        }
      });
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={rootRef} className="v21fw">
      <header className="v21fw-header container">
        <span className="v21fw-eyebrow">
          <span className="v21fw-eyebrow-tick" />
          Selected work · 2024–25
        </span>
        <h2 className="v21fw-title">
          <span className="v21fw-title-word">Featured</span> <em>narratives</em>
        </h2>
        <p className="v21fw-lede">
          Three chapters from this year's reel. Hover to play the cut.
        </p>
      </header>

      <ul className="v21fw-bands container">
        {PROJECTS.slice(0, 3).map((p, i) => {
          const isReel = hasReel(p);
          const handleClick = (e) => {
            e.preventDefault();
            if (isReel) {
              const rect = e.currentTarget.getBoundingClientRect();
              openReel(p, rect);
            } else {
              openModal(p);
            }
          };
          return (
            <li className="v21fw-band" key={p.slug || i}>
              <a
                className="v21fw-band-link"
                href={`#${p.slug || ""}`}
                data-cursor="play"
                onClick={handleClick}
                aria-label={`Open ${p.client} — ${p.title}`}
              >
                <div className="v21fw-band-media">
                  <div className="v21fw-band-inner">
                    <img
                      className="v21fw-band-poster"
                      src={p.poster}
                      alt=""
                      loading="lazy"
                    />
                    {p.video && (
                      <video
                        className="v21fw-band-video"
                        src={p.video}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <span className="v21fw-band-scrim" aria-hidden="true" />
                  <div className="v21fw-band-overlay">
                    <span className="v21fw-band-cap">{`${p.client} · ${p.sector} · ${p.year}`}</span>
                    <h3 className="v21fw-band-title">{p.title}</h3>
                  </div>
                </div>
              </a>
            </li>
          );
        })}
      </ul>

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
    document.body.classList.add("v21fw-modal-open");

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
      document.body.classList.remove("v21fw-modal-open");
      if (trigger && typeof trigger.focus === "function") trigger.focus();
    };
  }, [onClose]);

  // Portal to <body> so the overlay escapes the section's stacking context
  // (.v21fw is position:relative;z-index:1) and sits above the nav.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="v21fw-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${project.client} — ${project.title}`}
    >
      <button
        type="button"
        className="v21fw-modal-backdrop"
        aria-label="Close video"
        onClick={onClose}
        tabIndex={-1}
      />

      <div className="v21fw-modal-dialog">
        <div className="v21fw-modal-head">
          <div className="v21fw-modal-titles">
            <span className="v21fw-modal-client">{project.client}</span>
            <span className="v21fw-modal-title">{project.title}</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="v21fw-modal-close"
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

        <div className="v21fw-modal-frame">
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
    document.body.classList.add("v21fw-modal-open");
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("v21fw-modal-open");
      if (trigger && typeof trigger.focus === "function") trigger.focus();
    };
  }, [animateClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="v21pg"
      role="dialog"
      aria-modal="true"
      aria-label={`${project.client} — films`}
    >
      <button
        type="button"
        className="v21pg-backdrop"
        aria-label="Close gallery"
        onClick={animateClose}
        tabIndex={-1}
      />

      <div ref={panelRef} className="v21pg-panel">
        <header className="v21pg-head">
          <div className="v21pg-titles">
            <span className="v21pg-client">{project.client}</span>
            <span className="v21pg-count">{films.length} films</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="v21pg-close"
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

        <div className="v21pg-scroll">
          {/* Featured player */}
          <div className="v21pg-stage">
            <div className="v21pg-frame">
              {active.kind === "youtube" ? (
                <iframe
                  key={active.id}
                  className="v21pg-yt"
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
            <div className="v21pg-now">
              <span className="v21pg-now-title">{active.title}</span>
              {active.meta && (
                <span className="v21pg-now-meta">{active.meta}</span>
              )}
            </div>
          </div>

          {/* Films grouped by type */}
          {groups.map((group) => (
            <section key={group.name} className="v21pg-group">
              <h3 className="v21pg-group-title">{group.name}</h3>
              <ul className="v21pg-tiles">
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
        className={`v21pg-tile${isActive ? " is-active" : ""}`}
        onClick={onSelect}
        onPointerEnter={film.kind === "mp4" ? onEnter : undefined}
        onPointerLeave={film.kind === "mp4" ? onLeave : undefined}
        aria-label={`Play ${film.title}`}
        aria-current={isActive ? "true" : undefined}
      >
        <span className="v21pg-tile-media">
          <img
            className="v21pg-tile-poster"
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
              className="v21pg-tile-video"
              src={film.src}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
            />
          )}
          <span className="v21pg-tile-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </span>
        </span>
        <span className="v21pg-tile-info">
          <span className="v21pg-tile-title">{film.title}</span>
          {film.meta && <span className="v21pg-tile-meta">{film.meta}</span>}
        </span>
      </button>
    </li>
  );
}
