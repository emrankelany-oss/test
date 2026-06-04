"use client";
import { useRef } from "react";
import { mediaFor, statsFor, descFor, hasVideo } from "./data";
import { useV24Reveal } from "./useV24Reveal";
import { openFilm } from "./useV24Lightbox";

export default function V24WorkCard({ project, ratio }) {
  const ref = useRef(null);
  useV24Reveal(ref);
  const media = mediaFor(project);
  const stats = statsFor(project).slice(0, 4);
  const video = hasVideo(project);
  const title = `${project.client} — ${project.title}`;

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
    <article ref={ref} className={`v24-wcard v24-rv${video ? " is-video" : ""}`}>
      <div className="v24-wcard-media" style={{ aspectRatio: ratio }} {...interactive}>
        {media.type === "video" ? (
          <video src={media.src} poster={media.poster} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
        ) : (
          <img className="v24-kenburns" src={media.src} alt={title} loading="lazy" />
        )}
        {video ? <span className="v24-play" aria-hidden="true" /> : null}
        <span className="v24-wcard-scrim" aria-hidden="true" />
        <div className="v24-wcard-info">
          <span className="v24-wcard-client">{project.client}</span>
          <h3 className="v24-wcard-title">{project.title}</h3>
          <p className="v24-wcard-desc">{descFor(project)}</p>
          <dl className="v24-wcard-stats">
            {stats.map((s, i) => (
              <div key={i}><dd className="m">{s.metric}</dd><dt className="l">{s.label}</dt></div>
            ))}
          </dl>
        </div>
      </div>
    </article>
  );
}
