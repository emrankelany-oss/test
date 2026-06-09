"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CATEGORIES, worksFor } from "../portfolio-v24/data.js";
import { PROJECTS } from "../portfolio-v20/projects.js";
import { layoutFor } from "./layout.js";
import V26Card from "./V26Card.jsx";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// Filter tabs: "All" interleaves every categorized work (PROJECTS order, minus
// the featured studies), then one tab per real TMA category.
const ALL = { key: "all", label: "All Work" };
const TABS = [ALL, ...CATEGORIES];

function worksForTab(tab) {
  if (tab.key === "all") return PROJECTS;
  return worksFor(tab);
}

export default function V26WorkGrid() {
  const [active, setActive] = useState(ALL);
  const [shown, setShown] = useState(ALL); // what the grid currently renders
  const gridRef = useRef(null);

  const works = useMemo(() => worksForTab(shown), [shown]);
  const cells = useMemo(() => layoutFor(works), [works]);

  // Crossfade swap on filter change (ourwork-filter-fade-swap): fade the grid
  // out via a CSS class, swap the dataset, then the reveal effect rises it in.
  const onFilter = (tab) => {
    if (tab.key === active.key) return;
    setActive(tab);
    const grid = gridRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!grid || reduce) { setShown(tab); return; }
    grid.classList.add("is-swapping");
    window.setTimeout(() => setShown(tab), 220);
  };

  // Bidirectional scrubbed fade — same feel as v24's reveal: each card fades IN
  // as you scroll it up into view, and fades OUT again if you scroll back up.
  // Opacity-only (no transform), so cards never leave their exact grid cell and
  // same-end-row captions stay perfectly aligned.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    grid.classList.remove("is-swapping");
    const cards = [...grid.querySelectorAll(".v26-card")];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      gsap.set(cards, { opacity: 1 });
      return;
    }

    const tweens = cards.map((c) =>
      gsap.fromTo(
        c,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: c, start: "top 92%", end: "top 62%", scrub: true },
        }
      )
    );
    ScrollTrigger.refresh();
    return () => {
      tweens.forEach((t) => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
    };
  }, [shown]);

  return (
    <section className="v26-section v26-work" data-v26-section="work" aria-label="Selected work">
      <div className="v26-filter" role="tablist" aria-label="Filter work by category">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active.key === tab.key}
            className={`v26-pill${active.key === tab.key ? " is-active" : ""}`}
            onClick={() => onFilter(tab)}
            data-cursor="hover"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div ref={gridRef} className="v26-grid">
        {works.map((p, i) => (
          <V26Card key={`${shown.key}-${p.slug}`} project={p} cell={cells[i]} />
        ))}
      </div>
    </section>
  );
}
