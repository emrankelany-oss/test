"use client";
import { useRef } from "react";
import V24WorkCard from "./V24WorkCard";
import { worksFor } from "./data";
import { useV24Reveal } from "./useV24Reveal";

// Asymmetric editorial rhythm: span 4 = full-width feature, span 2 = half.
const SPAN_RHYTHM = [2, 2, 4, 2, 2, 2, 2, 4];
const RATIOS = { 4: ["16 / 9", "16 / 8"], 2: ["4 / 5", "1 / 1", "4 / 5", "3 / 4"] };

export default function V24CategoryGroup({ category }) {
  const headRef = useRef(null);
  useV24Reveal(headRef);
  const works = worksFor(category);
  if (!works.length) return null;

  return (
    <section className="v24-cat" data-v24-cat={category.key}>
      <header ref={headRef} className="v24-cat-head v24-rv">
        <h2 className="v24-cat-label">{category.label}</h2>
        <span className="v24-cat-count">{String(works.length).padStart(2, "0")}</span>
      </header>
      <div className="v24-wgrid">
        {works.map((p, i) => {
          const span = SPAN_RHYTHM[i % SPAN_RHYTHM.length];
          const ratio = RATIOS[span][i % RATIOS[span].length];
          return (
            <div key={p.slug} className={`v24-wcell v24-wcell-${span}`}>
              <V24WorkCard project={p} ratio={ratio} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
