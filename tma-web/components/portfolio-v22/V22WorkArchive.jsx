"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { PROJECTS } from "./projects";
import { openProject } from "./useProjectModal";

if (typeof window !== "undefined") gsap.registerPlugin(Draggable);

const baseCategory = (p) => (p.category || "Other").split(/[·\-—]/)[0].trim();

export default function V22WorkArchive() {
  const [active, setActive] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const railRef = useRef(null);
  const trackRef = useRef(null);

  const categories = useMemo(() => {
    const set = new Set(PROJECTS.map(baseCategory));
    return ["All", ...Array.from(set)];
  }, []);

  const visible = useMemo(
    () => (active === "All" ? PROJECTS : PROJECTS.filter((p) => baseCategory(p) === active)),
    [active]
  );

  useEffect(() => {
    const track = trackRef.current, rail = railRef.current;
    if (!track || !rail) return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // native scroll on touch
    const bounds = () => {
      const min = Math.min(0, rail.clientWidth - track.scrollWidth);
      return { minX: min, maxX: 0 };
    };
    gsap.set(track, { x: 0 });
    const drag = Draggable.create(track, {
      type: "x", inertia: false, bounds: bounds(),
      cursor: "grab", activeCursor: "grabbing",
    })[0];
    const onResize = () => drag.applyBounds(bounds());
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); drag.kill(); };
  }, [visible.length]);

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

      <div ref={railRef} className="v22-arch-rail" data-cursor="drag" data-cursor-label="Drag">
        <div ref={trackRef} className="v22-arch-track">
          {visible.map((p) => (
            <button
              key={p.slug}
              className="v22-arch-card"
              onClick={(e) => openProject(p.slug, e.currentTarget)}
            >
              <div className="v22-arch-media"><img src={p.thumb} alt="" loading="lazy" /></div>
              <span className="v22-eyebrow">{p.client}</span>
              <span className="v22-arch-card-title">{p.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
