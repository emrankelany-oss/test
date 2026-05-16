"use client";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { galleryItems, galleryCategories } from "@/data/portfolio";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Final grid is 4 columns x 8 rows = 32 thumbnails. The visible rows
// gather inside the pinned viewport during scroll; the rest are
// revealed already-assembled as the section continues scrolling.
const GRID_COLS = 4;
const GRID_ROWS = 8;
const GRID_CELLS = GRID_COLS * GRID_ROWS;

// Deterministic per-index random — SSR-safe and stable across renders so
// the gather choreography never reshuffles on hot reload.
function seededRandom(seed) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Pre-computed start state per card index — the random direction +
// depth they "come from nowhere" out of.
function getStartState(i) {
  const rand = seededRandom(i + 7);
  const angle = rand() * Math.PI * 2;
  const distance = 0.7 + rand() * 0.6; // 0.7–1.3 viewport heights away
  const rot = (rand() - 0.5) * 80; // -40° to +40°
  const scale = 0.4 + rand() * 0.2; // 0.4–0.6
  return { angle, distance, rot, scale };
}


export default function V5OurWork() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [isFiltering, setIsFiltering] = useState(false);

  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const gridRef = useRef(null);
  const cardsRef = useRef([]);

  // Slice to grid size — first 25 items (or filtered 25).
  const filtered = (() => {
    const pool =
      activeCategory === "All"
        ? galleryItems
        : galleryItems.filter((it) => it.category === activeCategory);
    const list = pool.length ? pool : galleryItems;
    return list.slice(0, GRID_CELLS);
  })();

  const handleFilter = (cat) => {
    if (cat === activeCategory || isFiltering) return;
    setIsFiltering(true);
    window.setTimeout(() => {
      setActiveCategory(cat);
      window.setTimeout(() => setIsFiltering(false), 40);
    }, 220);
  };

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    cardsRef.current.length = filtered.length;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const cards = cardsRef.current.filter(Boolean);
      const N = cards.length;
      if (!N || !gridRef.current) return;

      // Pre-compute each card's "from-nowhere" starting transform.
      // The starting offset is relative to the card's natural grid
      // position — GSAP animates from these initial values back to 0
      // (identity transform = sit in grid slot).
      const setupCard = (card, i) => {
        const start = getStartState(i);
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const reach = Math.max(vw, vh) * start.distance;
        const startX = Math.cos(start.angle) * reach;
        const startY = Math.sin(start.angle) * reach;

        gsap.set(card, {
          x: startX,
          y: startY,
          rotation: start.rot,
          scale: start.scale,
          opacity: 0,
          filter: "blur(18px)",
          transformOrigin: "50% 50%",
        });
      };

      cards.forEach(setupCard);

      if (prefersReducedMotion) {
        // Snap directly to final formation.
        cards.forEach((card) => {
          gsap.set(card, {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
          });
        });
        return;
      }

      // Per-row scroll triggers — each row fires ONCE when its top
      // crosses 85% down the viewport. Inside each trigger, the LEFT
      // pair (cols 0+1) animates in first, then 0.3s later the RIGHT
      // pair (cols 2+3). Because each trigger is `once: true`, no row
      // ever reverses — cards lock into place the moment they land.
      const playToSlot = (targets, delay) => {
        gsap.to(targets, {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.7,
          ease: "power3.out",
          delay,
          overwrite: true,
        });
      };

      for (let row = 0; row < GRID_ROWS; row++) {
        const rowCards = [];
        for (let c = 0; c < GRID_COLS; c++) {
          const card = cards[row * GRID_COLS + c];
          if (card) rowCards.push(card);
        }
        if (!rowCards.length) continue;

        const leftPair = rowCards.slice(0, 2);
        const rightPair = rowCards.slice(2, 4);

        ScrollTrigger.create({
          trigger: rowCards[0],
          start: "top 85%",
          once: true,
          onEnter: () => {
            playToSlot(leftPair, 0);
            if (rightPair.length) playToSlot(rightPair, 0.3);
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [activeCategory, filtered.length]);

  return (
    <section
      ref={sectionRef}
      className={`v5-ourwork ${isFiltering ? "is-filtering" : ""}`}
      data-section="v5-ourwork"
      aria-label="All work"
    >
      <div ref={stageRef} className="v5-ourwork-stage">
        {/* Heading at the top, filters next to the H2 (same .section-head
            pattern as the Featured Work heading). */}
        <div className="v5-ourwork-head">
          <div className="container">
            <div className="section-head v5-ourwork-section-head">
              <div className="num">
                <span className="dot" />Our work
              </div>
              <div className="meta">
                {activeCategory === "All"
                  ? `${galleryItems.length} projects`
                  : `${filtered.length} in ${activeCategory.toLowerCase()}`}
              </div>
              <div className="v5-ourwork-h2-row">
                <h2>
                  All work.<br />
                  <span className="ital">In motion.</span>
                </h2>
                <div className="v5-ourwork-filters" role="tablist">
                  {galleryCategories.map((cat) => (
                    <motion.button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={cat === activeCategory}
                      className={cat === activeCategory ? "is-active" : ""}
                      onClick={() => handleFilter(cat)}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 280, damping: 22 }}
                    >
                      {cat}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The 4x2 grid of V1-sized thumbnails. Sits inside .container so
            each cell auto-sizes to V1's gallery card width. GSAP drives
            each tile from its random "from-nowhere" start back to
            identity transform over the pinned scroll progress. */}
        <div className="v5-ourwork-grid-wrap">
          <div className="container">
            <div ref={gridRef} className="v5-ourwork-grid">
              {filtered.map((item, i) => (
                <figure
                  key={`${activeCategory}-${item.image}-${i}`}
                  ref={(el) => (cardsRef.current[i] = el)}
                  className="v5-ourwork-tile"
                  aria-label={`${item.client} — ${item.title}`}
                >
                  {/* V1-style structure: square image on top, caption
                      below with client / title / category, all wrapped
                      in a dark inner frame with thin rim border. */}
                  <div className="v5-ourwork-tile-frame">
                    <div className="v5-ourwork-tile-img-wrap">
                      <div
                        className="v5-ourwork-tile-img"
                        style={{ backgroundImage: `url("${item.image}")` }}
                        role="img"
                      />
                      <div className="v5-ourwork-tile-shade" aria-hidden="true" />
                    </div>
                    <figcaption className="v5-ourwork-tile-caption">
                      <span className="client">{item.client}</span>
                      <span className="title">{item.title}</span>
                      <span className="category">{item.category}</span>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
