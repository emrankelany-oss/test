"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { galleryItems, galleryCategories } from "@/data/portfolio";

// Auto-advance every 3.5s — long enough to read the active card, short
// enough that the section feels alive.
const AUTO_ADVANCE_MS = 3500;
// Drag distance (in px) required to snap to the next/prev slot. Less
// than this and the wheel springs back to the current active card.
const SNAP_THRESHOLD = 60;

function splitForWheels(list) {
  const half = Math.ceil(list.length / 2);
  return { left: list.slice(0, half), right: list.slice(half) };
}

export default function V5OurWork() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [isFiltering, setIsFiltering] = useState(false);

  const filtered = (() => {
    if (activeCategory === "All") return galleryItems;
    const subset = galleryItems.filter((it) => it.category === activeCategory);
    return subset.length ? subset : galleryItems;
  })();
  const { left: leftItems, right: rightItems } = splitForWheels(filtered);

  const handleFilter = (cat) => {
    if (cat === activeCategory || isFiltering) return;
    setIsFiltering(true);
    window.setTimeout(() => {
      setActiveCategory(cat);
      window.setTimeout(() => setIsFiltering(false), 40);
    }, 240);
  };

  return (
    <section
      className={`v5-ourwork ${isFiltering ? "is-filtering" : ""}`}
      data-section="v5-ourwork"
      aria-label="All work"
    >
      <div className="v5-ourwork-bg" aria-hidden="true">
        <div className="v5-ourwork-orbit v5-ourwork-orbit--left" />
        <div className="v5-ourwork-orbit v5-ourwork-orbit--right" />
      </div>

      <Wheel side="left" items={leftItems} category={activeCategory} />
      <Wheel side="right" items={rightItems} category={activeCategory} />

      <div className="v5-ourwork-center">
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
            <h2>
              All work.<br />
              <span className="ital">In motion.</span>
            </h2>
          </div>
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
          <div className="v5-ourwork-drag-hint" aria-hidden="true">
            <span>drag the stacks · or watch them advance</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Wheel — 3-slot vertical stack on one side of the viewport.

   Layout (centered on the viewport mid-line):
     • offset -1 → TOP slot (smaller, blurred neighbour above)
     • offset  0 → ACTIVE slot (sharp, full-size, vertically centered)
     • offset +1 → BOTTOM slot (smaller, blurred neighbour below)
     • offset ±2 → just off-screen (kept in DOM so the next/prev
                   advance slides in smoothly)
     • |offset| > 2 → hidden

   Auto-advance every AUTO_ADVANCE_MS ms increments activeIdx by 1
   (with modular wrap-around). Drag interaction pauses auto-advance,
   shifts the whole stack via a CSS variable, and on release either
   snaps to the next/prev slot (if dragged past SNAP_THRESHOLD) or
   springs back to the current active card.
   --------------------------------------------------------------- */

function Wheel({ side, items, category }) {
  const N = items.length;
  const wheelRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({ startY: 0, lastY: 0 });

  // Reset active index when the category changes (the items array is new).
  useLayoutEffect(() => {
    setActiveIdx(0);
  }, [category]);

  // Auto-advance — paused while the user is dragging.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (N < 2 || isDragging) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % N);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [N, isDragging]);

  // --- Drag handlers ------------------------------------------------
  const setDragVar = (dy) => {
    if (wheelRef.current) {
      wheelRef.current.style.setProperty("--drag-dy", `${dy}px`);
    }
  };

  const onPointerDown = (e) => {
    if (N < 2) return;
    setIsDragging(true);
    dragStateRef.current = { startY: e.clientY, lastY: e.clientY };
    setDragVar(0);
    wheelRef.current?.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!isDragging) return;
    const dy = e.clientY - dragStateRef.current.startY;
    dragStateRef.current.lastY = e.clientY;
    setDragVar(dy);
  };
  const onPointerUp = (e) => {
    if (!isDragging) return;
    const dy = dragStateRef.current.lastY - dragStateRef.current.startY;
    setIsDragging(false);
    setDragVar(0);
    wheelRef.current?.releasePointerCapture?.(e.pointerId);

    if (dy <= -SNAP_THRESHOLD) {
      setActiveIdx((i) => (i + 1) % N);
    } else if (dy >= SNAP_THRESHOLD) {
      setActiveIdx((i) => (i - 1 + N) % N);
    }
  };

  // Compute the signed offset of each card relative to activeIdx,
  // wrapped into (-N/2, +N/2] so cards loop around invisibly.
  const wrappedOffset = (i) => {
    let o = i - activeIdx;
    while (o > N / 2) o -= N;
    while (o <= -N / 2) o += N;
    return o;
  };

  return (
    <div
      ref={wheelRef}
      className={`v5-ourwork-wheel v5-ourwork-wheel--${side} ${
        isDragging ? "is-dragging" : ""
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label={`${side} work stack`}
      aria-roledescription="carousel"
    >
      <div className="v5-ourwork-wheel-stage">
        {items.map((item, i) => {
          const offset = wrappedOffset(i);
          const isVisible = Math.abs(offset) <= 2;
          // Slot-based visual treatment — three discrete tiers.
          const abs = Math.abs(offset);
          const scale = abs === 0 ? 1 : abs === 1 ? 0.62 : 0.5;
          const opacity =
            abs === 0 ? 1 : abs === 1 ? 0.45 : abs === 2 ? 0 : 0;
          const blur = abs === 0 ? 0 : abs === 1 ? 7 : 12;
          const zIndex = 200 - abs * 10;

          return (
            <article
              key={`${category}-${item.image}`}
              className="v5-ourwork-card"
              style={{
                "--card-offset": offset,
                "--card-scale": scale,
                "--card-opacity": opacity,
                "--card-blur": `${blur}px`,
                zIndex,
                visibility: isVisible ? "visible" : "hidden",
                pointerEvents: abs === 0 ? "auto" : "none",
              }}
              aria-label={`${item.client} — ${item.title}`}
              aria-current={abs === 0 ? "true" : undefined}
            >
              <div
                className="v5-ourwork-card-img"
                style={{ backgroundImage: `url("${item.image}")` }}
                role="img"
              />
              <div className="v5-ourwork-card-shade" aria-hidden="true" />
              <div className="v5-ourwork-card-rim" aria-hidden="true" />
              <div className="v5-ourwork-card-gloss" aria-hidden="true" />
              <div className="v5-ourwork-card-body">
                <span className="client">{item.client}</span>
                <span className="title">{item.title}</span>
                <span className="category">{item.category}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
