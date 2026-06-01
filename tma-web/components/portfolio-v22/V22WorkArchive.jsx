"use client";
import { useMemo, useRef, useState } from "react";
import { PROJECTS } from "./projects";
import { openProject } from "./useProjectModal";

const baseCategory = (p) => (p.category || "Other").split(/[·\-—]/)[0].trim();

function ArchItem({ project }) {
  const videoRef = useRef(null);
  const onEnter = () => { const v = videoRef.current; if (v && v.play) v.play().catch(() => {}); };
  const onLeave = () => { const v = videoRef.current; if (v) v.pause(); };
  return (
    <button
      className="v22-arch-card"
      data-cursor="view" data-cursor-label="See project"
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      onClick={(e) => openProject(project.slug, e.currentTarget)}
    >
      <span className="v22-eyebrow v22-arch-label">{project.client} · {project.category}</span>
      <span className="v22-arch-card-title">{project.title}</span>
      <span className="v22-arch-media">
        {project.video ? (
          <video ref={videoRef} src={project.video} poster={project.thumb} muted loop playsInline preload="none" />
        ) : (
          <img src={project.thumb} alt="" loading="lazy" />
        )}
      </span>
    </button>
  );
}

export default function V22WorkArchive() {
  const [active, setActive] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(PROJECTS.map(baseCategory));
    return ["All", ...Array.from(set)];
  }, []);

  const visible = useMemo(
    () => (active === "All" ? PROJECTS : PROJECTS.filter((p) => baseCategory(p) === active)),
    [active]
  );

  return (
    <section className="v22-section v22-arch">
      <header className="v22-arch-head">
        <h2 className="v22-arch-title">Work</h2>
        <div className="v22-arch-filters">
          <button
            className="v22-arch-filter-toggle" data-magnetic
            data-cursor="view" data-cursor-label="Filters"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            + Filters
          </button>
          {filtersOpen ? (
            <div className="v22-arch-chips">
              {categories.map((c) => (
                <button
                  key={c}
                  className={`v22-arch-chip${c === active ? " is-active" : ""}`}
                  onClick={() => setActive(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="v22-arch-list">
        {visible.map((p) => <ArchItem key={p.slug} project={p} />)}
      </div>
    </section>
  );
}
