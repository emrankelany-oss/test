"use client";

/* =====================================================================
   V21ProjectModal — centred modal showing a project's full PDF content.
   Replaces the old right-side drawer: opens in the MIDDLE of the screen,
   matching the Featured-Work video lightbox.
   - Portal to <body>
   - Esc + backdrop click + ✕ button close
   - Body scroll locked + global nav hidden while open
   - Focus moved into the dialog on open; restored on close (store hook
     keeps the lastTrigger)
   - Renders a video player at the top when the project has `video`,
     otherwise the hero image. Scrollable case-study body below.
   - Renders nothing on the server / when no slug is open (hydration-safe)
   ===================================================================== */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PROJECTS, PROJECTS_BY_SLUG } from "./projects";
import { useProjectDrawer } from "./useProjectDrawer";

const isVideo = (src) => !!src && /\.(mp4|mov|webm|m4v)$/i.test(src);

export default function V21ProjectModal() {
  const { openSlug, open, close } = useProjectDrawer();
  const project = openSlug ? PROJECTS_BY_SLUG[openSlug] : null;
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const videoRef = useRef(null);
  // gate portal so SSR + first client paint both render null (hydration-safe)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!openSlug) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);

    // lock scroll + hide the global nav so the modal owns the screen
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("v21fw-modal-open");

    // move focus into the dialog
    closeRef.current?.focus({ preventScroll: true });

    // autoplay the film (the opening click is the required user gesture)
    const v = videoRef.current;
    if (v) {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("v21fw-modal-open");
    };
    // re-run when the open project changes (e.g. "next project")
  }, [openSlug, close]);

  if (!mounted || typeof document === "undefined") return null;

  const isOpen = !!project;
  const nextProject = project ? nextOf(project.slug) : null;
  const hasVideo = isVideo(project?.video);

  return createPortal(
    <div
      className={`v21pm${isOpen ? " is-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="v21pm-backdrop"
        aria-label="Close project"
        onClick={close}
        tabIndex={-1}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      />

      {project && (
        <div
          ref={dialogRef}
          className="v21pm-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="v21pm-title"
        >
          <header className="v21pm-head">
            <div className="v21pm-eyebrow">
              <strong>{project.client}</strong>
              <span aria-hidden="true">·</span>
              <span>{project.category}</span>
              {project.year && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{project.year}</span>
                </>
              )}
            </div>
            <button
              ref={closeRef}
              type="button"
              className="v21pm-close"
              onClick={close}
              aria-label="Close project"
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

          <div className="v21pm-scroll">
            {/* media: film if present, else the hero image */}
            <div className="v21pm-media">
              {hasVideo ? (
                <video
                  key={project.slug}
                  ref={videoRef}
                  className="v21pm-video"
                  src={project.video}
                  poster={project.hero || project.thumb}
                  controls
                  autoPlay
                  playsInline
                  loop
                />
              ) : (
                project.hero && (
                  <img
                    className="v21pm-hero"
                    src={project.hero}
                    alt=""
                    loading="eager"
                    decoding="async"
                  />
                )
              )}
            </div>

            <div className="v21pm-body">
              <h2 id="v21pm-title" className="v21pm-title">
                {project.title}
              </h2>
              {project.tagline && (
                <p className="v21pm-tagline">{project.tagline}</p>
              )}

              {project.services?.length > 0 && (
                <ul className="v21pm-services">
                  {project.services.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}

              {project.intro && <p className="v21pm-intro">{project.intro}</p>}

              {project.deep && (
                <>
                  {project.problem?.length > 0 && (
                    <section className="v21pm-section">
                      <h3>The Problem</h3>
                      <ul>
                        {project.problem.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {project.solution?.length > 0 && (
                    <section className="v21pm-section">
                      <h3>The Solution</h3>
                      <ul>
                        {project.solution.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {project.results?.length > 0 && (
                    <section className="v21pm-section">
                      <h3>The Results</h3>
                      <ul className="v21pm-results">
                        {project.results.map((r, i) => (
                          <li key={i} className="v21pm-result">
                            <span className="v21pm-result-metric">{r.metric}</span>
                            <span className="v21pm-result-label">{r.label}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              )}

              {project.gallery?.length > 0 && (
                <div className="v21pm-gallery">
                  {project.gallery.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
              )}

              {nextProject && (
                <button
                  type="button"
                  className="v21pm-next"
                  onClick={() => open(nextProject.slug)}
                >
                  <em>Next project</em>
                  <span>
                    {nextProject.client} — {nextProject.title} →
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

function nextOf(slug) {
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  if (i < 0) return null;
  return PROJECTS[(i + 1) % PROJECTS.length];
}
