"use client";
import { useEffect, useRef } from "react";
import { mediaFor, statsFor, descFor, hasVideo } from "./data";
import { useV24Reveal } from "./useV24Reveal";
import { openFilm } from "./useV24Lightbox";

// One project as a 50/50 row. `flip` mirrors the row (media on the right) so the
// category list reads as a zig-zag — same design language as the featured grid.
export default function V24WorkCard({ project, ratio, flip = false }) {
  const ref = useRef(null);
  const vidRef = useRef(null);
  useV24Reveal(ref);
  const media = mediaFor(project);
  const stats = statsFor(project).slice(0, 4);
  const video = hasVideo(project);
  const title = `${project.client} — ${project.title}`;

  // autoplay only while on-screen; pause offscreen (avoids a decode/battery storm)
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

  const onClick = () => {
    if (video) openFilm({ kind: "video", src: project.video, poster: project.hero || project.thumb, title: project.title, client: project.client });
  };
  const onKeyDown = (e) => {
    if (video && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); }
  };
  const interactive = video
    ? { role: "button", tabIndex: 0, onClick, onKeyDown, "data-cursor": "blob", "data-cursor-label": "Play", "aria-label": `Play ${title}` }
    : {};

  return (
    <article ref={ref} className={`v24-row v24-rv${flip ? " media-right" : ""}${video ? " is-video" : ""}`}>
      <div className="v24-row-media" {...interactive}>
        {media.type === "video" ? (
          <video ref={vidRef} src={media.src} poster={media.poster} muted loop playsInline preload="metadata" aria-hidden="true" />
        ) : (
          <img src={media.src} alt={title} loading="lazy" />
        )}
        {video ? <span className="v24-play" aria-hidden="true" /> : null}
      </div>
      <div className="v24-row-info">
        <span className="v24-row-client">{project.client}</span>
        <h3 className="v24-row-title">{project.title}</h3>
        <p className="v24-row-desc">{descFor(project)}</p>
        {stats.length ? (
          <dl className="v24-row-stats">
            {stats.map((s, i) => (
              <div key={i}><dd className="m">{s.metric}</dd><dt className="l">{s.label}</dt></div>
            ))}
          </dl>
        ) : null}
      </div>
    </article>
  );
}
