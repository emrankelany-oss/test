"use client";
import { useEffect, useRef } from "react";
import { mediaFor, hasVideo } from "../portfolio-v24/data.js";
import { openV26Project } from "./useV26Modal.js";

// One work tile in the IMPACT-style grid. The media sits in a clipped, rounded
// frame; on hover the image/video scales 1.25 (the source's exact 800ms ease)
// and the caption shifts to the brand accent with a growing underline. Every
// card — hero, wide or square — uses the SAME caption (title · thin rule ·
// client + discipline) so the grid reads consistently, exactly like the source.
// Video works autoplay-loop muted only while on screen (lazy-autoplay-videos-io).
export default function V26Card({ project, cell }) {
  const vidRef = useRef(null);
  const media = mediaFor(project);
  const video = hasVideo(project);
  const kind = cell?.kind || "square";

  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); },
      { threshold: 0.15 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [media.src]);

  const style = cell
    ? {
        gridColumn: `${cell.colStart} / span ${cell.colSpan}`,
        gridRow: `${cell.rowStart} / span ${cell.rowSpan}`,
      }
    : undefined;

  const handleClick = () => {
    openV26Project(project);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article 
      className={`v26-card v26-fp-${kind}${video ? " is-video" : ""}`} 
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${project.client} — ${project.title}`}
    >
      <div className="v26-card-media" data-cursor="view" data-cursor-label="View">
        {media.type === "video" ? (
          <video ref={vidRef} src={media.src} poster={media.poster} muted loop playsInline preload="metadata" aria-hidden="true" />
        ) : (
          <img src={media.src} alt={`${project.client} — ${project.title}`} loading="lazy" />
        )}
        {video ? <span className="v26-play" aria-hidden="true" /> : null}
      </div>
      <div className="v26-card-caption">
        <h3 className="v26-card-title">{project.title}</h3>
        <span className="v26-underline" aria-hidden="true" />
        <p className="v26-card-sub">
          <span className="v26-card-client">{project.client}</span>
          {project.category ? <span className="v26-card-cat">{project.category}</span> : null}
        </p>
      </div>
    </article>
  );
}
