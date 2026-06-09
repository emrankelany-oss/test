"use client";
import { useEffect, useRef } from "react";
import { useV26Modal } from "./useV26Modal";
import { SHOWREEL } from "../portfolio-v22/showreel";
import { mediaFor } from "../portfolio-v24/data.js";

export default function V26ProjectModal() {
  const { project, close } = useV26Modal();
  const modalRef = useRef(null);

  const showreel = project ? SHOWREEL.find(r => r.slug === project.slug) : null;
  // The same media the card uses — show the card's video inside the modal.
  const cardMedia = project ? mediaFor(project) : null;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (project) {
      document.body.style.overflow = "hidden";
      // Allow a tiny delay so the element mounts before adding the active class for animation
      requestAnimationFrame(() => {
        if (modalRef.current) modalRef.current.classList.add("is-active");
      });
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [project]);

  // Handle ESC key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && project) {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [project]);

  if (!project) return null;

  const handleClose = () => {
    if (modalRef.current) {
      modalRef.current.classList.remove("is-active");
      // Wait for exit animation to complete before unmounting
      setTimeout(() => close(), 400);
    } else {
      close();
    }
  };

  return (
    <div className="v26-modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="v26-modal-title">
      <div className="v26-modal-backdrop" onClick={handleClose} />
      
      <div className="v26-modal-content">
        <button className="v26-modal-close" onClick={handleClose} aria-label="Close project">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="v26-modal-inner">
          <header className="v26-modal-header">
            <span className="v26-modal-client">{project.client}</span>
            <h2 id="v26-modal-title" className="v26-modal-title">{project.title}</h2>
            {project.category && <p className="v26-modal-cat">{project.category}</p>}
          </header>

          {/* The card's own video, opened at the top of the window, under the
              description — autoplays muted/looping just like it does on the card. */}
          {cardMedia?.type === "video" && (
            <div className="v26-modal-gallery v26-modal-gallery-top">
              <div className="v26-modal-video-wrapper">
                <video
                  className="v26-modal-video"
                  src={cardMedia.src}
                  poster={cardMedia.poster}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              </div>
            </div>
          )}

          <div className="v26-modal-body">
            <div className="v26-modal-text">
              {project.intro && <p className="v26-modal-intro">{project.intro}</p>}
              
              {project.problem?.length > 0 && (
                <div className="v26-modal-section">
                  <h3>The Challenge</h3>
                  <ul>
                    {project.problem.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {project.solution?.length > 0 && (
                <div className="v26-modal-section">
                  <h3>The Solution</h3>
                  <ul>
                    {project.solution.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {project.results?.length > 0 && (
              <div className="v26-modal-stats">
                {project.results.map((stat, i) => (
                  <div key={i} className="v26-stat-card">
                    <div className="v26-stat-metric">{stat.metric}</div>
                    <div className="v26-stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(project.gallery?.length > 0 || project.hero || showreel?.films?.length > 0) && (
            <div className="v26-modal-gallery">
              {project.hero && !showreel && <img src={project.hero} alt={`${project.title} hero`} className="v26-modal-img" />}

              {showreel?.films.map((f) => (
                <div key={f.id} className="v26-modal-video-wrapper">
                  {f.kind === "youtube" ? (
                    <iframe
                      className="v26-modal-video"
                      src={`https://www.youtube.com/embed/${f.youtubeId}`}
                      title={f.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      className="v26-modal-video"
                      src={f.src}
                      poster={f.poster}
                      controls
                      playsInline
                      preload="metadata"
                    />
                  )}
                  <p className="v26-video-caption">{f.title} <span className="v26-video-group">· {f.group}</span></p>
                </div>
              ))}

              {project.gallery?.map((img, i) => (
                <img key={i} src={img} alt={`${project.title} gallery ${i+1}`} className="v26-modal-img" loading="lazy" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
