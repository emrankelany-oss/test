"use client";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { galleryItems, galleryCategories } from "@/data/portfolio";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Cards beyond this many slots from the focused center are culled
// (visibility: hidden) so we never paint more than ~22 cards per frame
// even when the gallery has 40+ items.
const CULL_OFFSET = 5;

export default function V5OurWork() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [isFiltering, setIsFiltering] = useState(false);

  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const cardsRef = useRef([]);

  // Filtered list — "All" shows the full gallery, otherwise exact-match
  // category from V1's `galleryItems`. Falls back to the full set if a
  // category has no items, so the stream never goes empty.
  const filtered = (() => {
    if (activeCategory === "All") return galleryItems;
    const subset = galleryItems.filter((it) => it.category === activeCategory);
    return subset.length ? subset : galleryItems;
  })();

  const handleFilter = (cat) => {
    if (cat === activeCategory || isFiltering) return;
    setIsFiltering(true);
    // Fade the stream out, swap data, then let GSAP re-position before
    // the wrapper fades back in via CSS.
    window.setTimeout(() => {
      setActiveCategory(cat);
      window.setTimeout(() => setIsFiltering(false), 40);
    }, 260);
  };

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    // Trim stale refs left over from a longer previous filter set.
    cardsRef.current.length = filtered.length;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const cards = cardsRef.current.filter(Boolean);
      const N = cards.length;
      if (!N) return;

      const isMobile = window.matchMedia("(max-width: 720px)").matches;
      // Spacing between adjacent cards in the horizontal stream.
      const spacing = isMobile ? 280 : 460;

      const applyPositions = (activeIdx) => {
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          if (!card) continue;
          const offset = i - activeIdx;
          const absOffset = Math.abs(offset);

          // Cull anything well off the visible stream — keeps frame budget
          // tight even with 40+ gallery items.
          if (absOffset > CULL_OFFSET) {
            if (card.style.visibility !== "hidden") {
              card.style.visibility = "hidden";
              card.style.opacity = "0";
              card.style.pointerEvents = "none";
            }
            continue;
          }

          const x = offset * spacing;
          // Side cards arc slightly downward — gives a cinematic "depth
          // bowl" feel rather than a flat carousel.
          const yArc = absOffset * absOffset * 6;
          // Slight Z translation for layered depth (Safari-safe).
          const zDepth = -absOffset * 80;
          const scale = Math.max(0.5, 1 - absOffset * 0.13);
          const opacity = Math.max(0, 1 - absOffset * 0.22);
          const blur = Math.min(14, absOffset * 3.2);
          // Side cards lean toward the center — adds parallax tilt.
          const tilt = -offset * 4;
          const zIndex = 200 - Math.round(absOffset * 10);

          card.style.visibility = "visible";
          card.style.opacity = String(opacity);
          card.style.pointerEvents = absOffset < 0.5 ? "auto" : "none";
          card.style.zIndex = String(zIndex);
          card.style.transform =
            `translate3d(${x}px, ${yArc}px, ${zDepth}px) ` +
            `rotateY(${tilt}deg) scale(${scale})`;
          card.style.filter = `blur(${blur}px)`;
        }
      };

      // Start centered on item 0.
      applyPositions(0);

      if (prefersReducedMotion) {
        // No scroll animation — leave the first card in focus and let the
        // user scroll past naturally.
        return;
      }

      // Scroll distance scales with item count, but capped so massive
      // galleries don't make the page absurdly tall.
      const pinViewports = Math.min(Math.max(N * 0.45, 3), 9);

      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: () => `+=${window.innerHeight * pinViewports}`,
        pin: stageRef.current,
        pinSpacing: true,
        scrub: 1.1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          // Map scroll progress 0→1 to active card index 0→(N-1).
          const activeIdx = self.progress * (N - 1);
          applyPositions(activeIdx);
        },
      });

      // Re-sync on creation so we don't paint at activeIdx=0 when the
      // user filters mid-stream.
      const initialProgress = trigger.progress;
      if (initialProgress > 0) {
        applyPositions(initialProgress * (N - 1));
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
        {/* Heading + filter chips — sticky inside the pinned area. */}
        <div className="v5-ourwork-head">
          <div className="container">
            <div className="section-head">
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
          </div>
        </div>

        {/* The card stream — every card is absolutely positioned and GSAP
            drives translate3d + rotateY + scale + blur per scroll tick. */}
        <div className="v5-ourwork-stream-wrap">
          <div className="v5-ourwork-stream">
            {filtered.map((item, i) => (
              <article
                key={`${activeCategory}-${item.image}`}
                ref={(el) => (cardsRef.current[i] = el)}
                className="v5-ourwork-card"
                aria-label={`${item.client} — ${item.title}`}
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
            ))}
          </div>
        </div>

        {/* Subtle scroll hint at the bottom — fades during pin. */}
        <div className="v5-ourwork-hint" aria-hidden="true">
          <span>scroll · the stream flows</span>
        </div>
      </div>
    </section>
  );
}
