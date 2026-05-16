"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Lottie from "lottie-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { galleryItems, galleryCategories } from "@/data/portfolio";
import { pulseRingLottie, cornerSparkLottie } from "@/data/lottie";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TILT_MAX = 6; // deg
const TILT_LERP = 0.18; // 0..1, higher = snappier

function GalleryCard({ item, index, hoveredKey, setHoveredKey, cardKey }) {
  const cardRef = useRef(null);
  const innerRef = useRef(null);
  const targetRef = useRef({ rx: 0, ry: 0 });
  const currentRef = useRef({ rx: 0, ry: 0 });
  const rafRef = useRef(0);

  const tick = useCallback(() => {
    const target = targetRef.current;
    const current = currentRef.current;
    current.rx += (target.rx - current.rx) * TILT_LERP;
    current.ry += (target.ry - current.ry) * TILT_LERP;

    if (innerRef.current) {
      innerRef.current.style.transform = `rotateX(${current.rx}deg) rotateY(${current.ry}deg)`;
    }

    if (
      Math.abs(target.rx - current.rx) > 0.01 ||
      Math.abs(target.ry - current.ry) > 0.01
    ) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = 0;
    }
  }, []);

  const startRaf = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const onMove = useCallback(
    (e) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      targetRef.current.ry = px * TILT_MAX * 2;
      targetRef.current.rx = -py * TILT_MAX * 2;
      startRaf();
    },
    [startRaf]
  );

  const onEnter = useCallback(() => {
    setHoveredKey(cardKey);
  }, [setHoveredKey, cardKey]);

  const onLeave = useCallback(() => {
    targetRef.current.rx = 0;
    targetRef.current.ry = 0;
    startRaf();
    setHoveredKey((current) => (current === cardKey ? null : current));
  }, [startRaf, setHoveredKey, cardKey]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const isHovered = hoveredKey === cardKey;

  return (
    <figure
      ref={cardRef}
      className={`pf-gallery-item ${isHovered ? "is-hovered" : ""}`}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      data-index={index}
    >
      <div className="pf-gallery-item-3d" ref={innerRef}>
        <div className="pf-gallery-img-wrap">
          <div
            className="pf-gallery-img"
            style={{ backgroundImage: `url("${item.image}")` }}
            role="img"
            aria-label={`${item.client} — ${item.title}`}
          />
          <div className="pf-gallery-shade" aria-hidden="true" />
          <div className="pf-gallery-corner" aria-hidden="true">
            {isHovered && (
              <Lottie
                animationData={cornerSparkLottie}
                loop={true}
                autoplay={true}
                style={{ width: 36, height: 36 }}
                rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
              />
            )}
          </div>
        </div>
        <figcaption>
          <span className="pf-gallery-client">{item.client}</span>
          <span className="pf-gallery-title">{item.title}</span>
          <span className="pf-gallery-cat">{item.category}</span>
        </figcaption>
      </div>
    </figure>
  );
}

export default function WorkGallery() {
  const [active, setActive] = useState("All");
  const [hoveredKey, setHoveredKey] = useState(null);
  const sectionRef = useRef(null);
  const gridRef = useRef(null);
  const headRef = useRef(null);
  const filterRef = useRef(null);

  const items = useMemo(() => {
    if (active === "All") return galleryItems;
    return galleryItems.filter((it) => it.category === active);
  }, [active]);

  // Stagger reveal on scroll into view + on filter change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const grid = gridRef.current;
    if (!grid) return;

    const ctx = gsap.context(() => {
      const cards = grid.querySelectorAll(".pf-gallery-item");
      gsap.killTweensOf(cards);
      gsap.fromTo(
        cards,
        { y: 28, opacity: 0, scale: 0.985 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: {
            each: 0.045,
            from: "start",
          },
          scrollTrigger: {
            trigger: grid,
            start: "top 85%",
            once: true,
          },
        }
      );
    }, gridRef);

    return () => ctx.revert();
  }, [items]);

  // Headline + filter reveal on scroll
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const ctx = gsap.context(() => {
      if (headRef.current) {
        gsap.fromTo(
          headRef.current.children,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: { trigger: headRef.current, start: "top 85%", once: true },
          }
        );
      }
      if (filterRef.current) {
        gsap.fromTo(
          filterRef.current.children,
          { y: 14, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.04,
            scrollTrigger: { trigger: filterRef.current, start: "top 88%", once: true },
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="pf-section pf-gallery" id="gallery">
      <div className="pf-gallery-atmosphere" aria-hidden="true">
        <div className="pf-gallery-orb pf-gallery-orb--a" />
        <div className="pf-gallery-orb pf-gallery-orb--b" />
        <div className="pf-gallery-orb pf-gallery-orb--c" />
        <div className="pf-gallery-noise" />
        <div className="pf-gallery-vignette" />
      </div>

      <div className="container">
        <div className="pf-section-head" ref={headRef}>
          <div className="pf-section-num">
            <span className="dot" />
            05 / The work
          </div>
          <div className="pf-section-sub">Thirty-plus brands.</div>
          <h2 className="pf-section-title">
            Hundreds of <span className="ital">moments.</span>
          </h2>
        </div>

        <div className="pf-filter-bar" role="tablist" ref={filterRef}>
          {galleryCategories.map((cat) => {
            const isActive = active === cat;
            const count =
              cat === "All"
                ? galleryItems.length
                : galleryItems.filter((it) => it.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`pf-filter ${isActive ? "is-active" : ""}`}
                onClick={() => setActive(cat)}
              >
                <span className="pf-filter-dot" aria-hidden="true">
                  {isActive && (
                    <Lottie
                      animationData={pulseRingLottie}
                      loop
                      autoplay
                      style={{ width: 20, height: 20 }}
                    />
                  )}
                </span>
                {cat}
                <span className="pf-filter-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="pf-gallery-grid" ref={gridRef}>
          {items.map((it, i) => {
            const key = `${active}-${it.client}-${it.title}`;
            return (
              <GalleryCard
                key={key}
                cardKey={key}
                item={it}
                index={i}
                hoveredKey={hoveredKey}
                setHoveredKey={setHoveredKey}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
