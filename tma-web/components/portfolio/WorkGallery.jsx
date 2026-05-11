"use client";
import { useMemo, useState } from "react";
import { galleryItems, galleryCategories } from "@/data/portfolio";

export default function WorkGallery() {
  const [active, setActive] = useState("All");

  const items = useMemo(() => {
    if (active === "All") return galleryItems;
    return galleryItems.filter((it) => it.category === active);
  }, [active]);

  return (
    <section className="pf-section pf-gallery" id="gallery">
      <div className="container">
        <div className="pf-section-head" data-reveal>
          <div className="pf-section-num">
            <span className="dot" />
            05 / The work
          </div>
          <div className="pf-section-sub">Thirty-plus brands.</div>
          <h2 className="pf-section-title">
            Hundreds of <span className="ital">moments.</span>
          </h2>
        </div>

        <div className="pf-filter-bar" role="tablist">
          {galleryCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active === cat}
              className={`pf-filter ${active === cat ? "is-active" : ""}`}
              onClick={() => setActive(cat)}
            >
              {cat}
              <span className="pf-filter-count">
                {cat === "All"
                  ? galleryItems.length
                  : galleryItems.filter((it) => it.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        <div className="pf-gallery-grid">
          {items.map((it, i) => (
            <figure key={`${it.client}-${i}`} className="pf-gallery-item">
              <div
                className="pf-gallery-img"
                style={{ backgroundImage: `url("${it.image}")` }}
                role="img"
                aria-label={`${it.client} — ${it.title}`}
              />
              <figcaption>
                <span className="pf-gallery-client">{it.client}</span>
                <span className="pf-gallery-title">{it.title}</span>
                <span className="pf-gallery-cat">{it.category}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
