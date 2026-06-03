"use client";

/* =====================================================================
   V20ProjectDrawer — right-side slide-in panel showing a project's
   full content from projects.js.
   - Portal to <body>
   - Esc + backdrop click + ✕ button close
   - Body scroll locked while open (html.is-drawer-open)
   - Focus moved into panel on open; restored on close (handled in the
     store hook via lastTrigger)
   - Renders nothing on the server / when no slug is open
   ===================================================================== */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PROJECTS, PROJECTS_BY_SLUG } from "./projects";
import { useProjectDrawer } from "./useProjectDrawer";

export default function V20ProjectDrawer() {
  const { openSlug, open, close } = useProjectDrawer();
  const project = openSlug ? PROJECTS_BY_SLUG[openSlug] : null;
  const panelRef = useRef(null);
  // gate portal so SSR + first client paint both render null (hydration-safe)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!openSlug) return;

    document.documentElement.classList.add("is-drawer-open");

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);

    // move focus into the panel
    const panel = panelRef.current;
    if (panel) {
      const focusable = panel.querySelector(
        'button, [href], [tabindex]:not([tabindex="-1"])'
      );
      (focusable || panel).focus({ preventScroll: true });
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("is-drawer-open");
    };
  }, [openSlug, close]);

  if (!mounted || typeof document === "undefined") return null;

  const nextProject = project ? nextOf(project.slug) : null;
  const isOpen = !!project;

  return createPortal(
    <>
      <div
        className={`v20pd-backdrop${isOpen ? " is-open" : ""}`}
        onClick={close}
        aria-hidden={!isOpen}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      />
      <aside
        ref={panelRef}
        className={`v20pd-panel${isOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-labelledby={project ? "v20pd-title" : undefined}
        tabIndex={-1}
      >
        {project && (
          <>
            <header className="v20pd-head">
              <div className="v20pd-eyebrow">
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
                type="button"
                className="v20pd-close"
                onClick={close}
                aria-label="Close project"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </header>

            {project.hero && (
              <div className="v20pd-hero">
                <img src={project.hero} alt="" loading="eager" decoding="async" />
              </div>
            )}

            <div className="v20pd-body">
              <h2 id="v20pd-title" className="v20pd-title">
                {project.title}
              </h2>
              {project.tagline && (
                <p className="v20pd-tagline">{project.tagline}</p>
              )}

              {project.services?.length > 0 && (
                <ul className="v20pd-services">
                  {project.services.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}

              {project.intro && <p className="v20pd-intro">{project.intro}</p>}

              {project.deep && (
                <>
                  {project.problem?.length > 0 && (
                    <section className="v20pd-section">
                      <h3>The Problem</h3>
                      <ul>
                        {project.problem.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {project.solution?.length > 0 && (
                    <section className="v20pd-section">
                      <h3>The Solution</h3>
                      <ul>
                        {project.solution.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {project.results?.length > 0 && (
                    <section className="v20pd-section">
                      <h3>The Results</h3>
                      <ul className="v20pd-results">
                        {project.results.map((r, i) => (
                          <li key={i} className="v20pd-result">
                            <span className="v20pd-result-metric">
                              {r.metric}
                            </span>
                            <span className="v20pd-result-label">{r.label}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              )}

              {project.gallery?.length > 0 && (
                <div className="v20pd-gallery">
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
                  className="v20pd-next"
                  onClick={() => open(nextProject.slug)}
                >
                  <em>Next project</em>
                  <span>{nextProject.client} — {nextProject.title} →</span>
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </>,
    document.body
  );
}

function nextOf(slug) {
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  if (i < 0) return null;
  return PROJECTS[(i + 1) % PROJECTS.length];
}
