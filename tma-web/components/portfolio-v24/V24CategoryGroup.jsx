"use client";
import { useRef } from "react";
import V24WorkCard from "./V24WorkCard";
import { worksFor } from "./data";
import { useV24Reveal } from "./useV24Reveal";

// Aspect-ratio rhythm so successive rows don't all share the same crop.
const RATIOS = ["16 / 10", "4 / 3", "3 / 2", "16 / 9"];

export default function V24CategoryGroup({ category }) {
  const headRef = useRef(null);
  useV24Reveal(headRef);
  const works = worksFor(category);
  if (!works.length) return null;

  // italic accent on the last word of the label (brand "MEETS" treatment)
  const parts = category.label.split(" ");
  const lead = parts.slice(0, -1).join(" ");
  const last = parts[parts.length - 1];

  return (
    <section className="v24-cat" data-v24-cat={category.key}>
      <header ref={headRef} className="v24-cat-head v24-rv">
        <h2 className="v24-cat-label">
          {lead ? lead + " " : ""}<em className="v24-ital">{last}</em>
        </h2>
        <span className="v24-cat-count">{String(works.length).padStart(2, "0")}</span>
      </header>
      <div className="v24-rows">
        {works.map((p, i) => (
          <V24WorkCard key={p.slug} project={p} ratio={RATIOS[i % RATIOS.length]} flip={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
