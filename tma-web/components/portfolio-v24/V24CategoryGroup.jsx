"use client";
import { useRef } from "react";
import V24WorkRow from "./V24WorkRow";
import { worksFor } from "./data";
import { useV24Reveal } from "./useV24Reveal";

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
      <div className="v24-rows">
        {works.map((p, i) => (
          <V24WorkRow key={p.slug} project={p} index={i} />
        ))}
      </div>
    </section>
  );
}
