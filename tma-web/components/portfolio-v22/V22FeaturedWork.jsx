"use client";
import { useRef } from "react";
import { FEATURED } from "./projects";
import { openProject } from "./useProjectModal";
import { useScrubVideo } from "./hooks/useScrubVideo";
import { useSplitReveal } from "./hooks/useSplitReveal";

function LeadTile({ project }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const titleRef = useRef(null);
  useScrubVideo(videoRef, wrapRef);
  useSplitReveal(titleRef, { by: "chars", stagger: 0.02 });
  return (
    <button
      ref={wrapRef}
      className="v22-feat-tile v22-feat-lead"
      data-cursor="view" data-cursor-label="See project"
      onClick={(e) => openProject(project.slug, e.currentTarget)}
    >
      <div className="v22-feat-media">
        {project.video ? (
          <video ref={videoRef} src={project.video} poster={project.hero} muted playsInline preload="none" />
        ) : (
          <img src={project.hero} alt="" loading="lazy" />
        )}
      </div>
      <div className="v22-feat-meta">
        <span className="v22-eyebrow">{project.client} · {project.category}</span>
        <h3 ref={titleRef} className="v22-feat-title">{project.title}</h3>
      </div>
    </button>
  );
}

function GridTile({ project }) {
  const videoRef = useRef(null);
  const onEnter = () => { const v = videoRef.current; if (v && v.play) v.play().catch(() => {}); };
  const onLeave = () => { const v = videoRef.current; if (v) { v.pause(); } };
  return (
    <button
      className="v22-feat-tile"
      data-cursor="view" data-cursor-label="See project"
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      onClick={(e) => openProject(project.slug, e.currentTarget)}
    >
      <div className="v22-feat-media">
        {project.video ? (
          <video ref={videoRef} src={project.video} poster={project.hero} muted loop playsInline preload="none" />
        ) : (
          <img src={project.hero} alt="" loading="lazy" />
        )}
      </div>
      <div className="v22-feat-meta">
        <span className="v22-eyebrow">{project.client}</span>
        <h3 className="v22-feat-title-sm">{project.title}</h3>
      </div>
    </button>
  );
}

export default function V22FeaturedWork() {
  const [lead, ...rest] = FEATURED;
  return (
    <section id="v22-featured" className="v22-section v22-featured">
      <p className="v22-eyebrow">Selected work</p>
      {lead ? <LeadTile project={lead} /> : null}
      <div className="v22-feat-grid">
        {rest.map((p) => <GridTile key={p.slug} project={p} />)}
      </div>
    </section>
  );
}
