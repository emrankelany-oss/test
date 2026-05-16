"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Lottie from "lottie-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { galleryItems, galleryCategories } from "@/data/portfolio";
import { cornerSparkLottie } from "@/data/lottie";
import { motionState } from "./V3MotionEngine";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TILT_MAX = 6;
const TILT_LERP = 0.18;

/**
 * V1-style card with mouse-tilt + hover sparkle + scroll-in reveal.
 * Identical interaction to /portfolio's WorkGallery cards but in a
 * 2-column grid context. Cards on alternating sides per row.
 */
function WorkCard({ item, index, hoveredKey, setHoveredKey, cardKey }) {
  const cardRef = useRef(null);
  const innerRef = useRef(null);
  const targetRef = useRef({ rx: 0, ry: 0 });
  const currentRef = useRef({ rx: 0, ry: 0 });
  const rafRef = useRef(0);

  const tick = useCallback(() => {
    const t = targetRef.current;
    const c = currentRef.current;
    c.rx += (t.rx - c.rx) * TILT_LERP;
    c.ry += (t.ry - c.ry) * TILT_LERP;
    if (innerRef.current) {
      innerRef.current.style.transform = `rotateX(${c.rx}deg) rotateY(${c.ry}deg)`;
    }
    if (Math.abs(t.rx - c.rx) > 0.01 || Math.abs(t.ry - c.ry) > 0.01) {
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

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const isHovered = hoveredKey === cardKey;

  return (
    <figure
      ref={cardRef}
      className={`v3-work-card pf-gallery-item ${isHovered ? "is-hovered" : ""}`}
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

const RAW_ITEMS = galleryItems;

export default function V3WorkAlternating() {
  const [active, setActive] = useState("All");
  const [hoveredKey, setHoveredKey] = useState(null);

  const sectionRef = useRef(null);
  const gridRef = useRef(null);
  const headRef = useRef(null);
  const filterRef = useRef(null);

  const items = useMemo(() => {
    if (active === "All") return RAW_ITEMS;
    return RAW_ITEMS.filter((it) => it.category === active);
  }, [active]);

  // Group items into rows of 2 for alternating layout
  const rows = useMemo(() => {
    const out = [];
    for (let i = 0; i < items.length; i += 2) {
      out.push(items.slice(i, i + 2));
    }
    return out;
  }, [items]);

  // Card reveal stagger (V1 style)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;
    const grid = gridRef.current;
    if (!grid) return;

    const ctx = gsap.context(() => {
      const cards = grid.querySelectorAll(".v3-work-card");
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
          stagger: { each: 0.045, from: "start" },
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

  // Headline + filter reveal (with word-by-word reveal on the h2 title)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    // Split the section title into word-wrapped spans (only once)
    const title = headRef.current?.querySelector(".pf-section-title");
    if (title && !title.dataset.split) {
      const html = title.innerHTML;
      // Tokenize by whitespace while preserving inline tags (<span class="ital">)
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      // Walk text nodes only and split into word spans
      const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          const words = text.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          words.forEach((w) => {
            if (/^\s+$/.test(w)) {
              frag.appendChild(document.createTextNode(w));
            } else if (w.length) {
              const outer = document.createElement("span");
              outer.className = "v3-word";
              const inner = document.createElement("span");
              inner.className = "v3-word-inner";
              inner.textContent = w;
              outer.appendChild(inner);
              frag.appendChild(outer);
            }
          });
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Skip already-split nodes
          if (node.classList?.contains("v3-word")) return;
          // For <span class="ital">, wrap its inner text as one word
          if (node.tagName === "SPAN" && node.classList.contains("ital")) {
            const inner = document.createElement("span");
            inner.className = "v3-word-inner ital";
            inner.textContent = node.textContent;
            const outer = document.createElement("span");
            outer.className = "v3-word";
            outer.appendChild(inner);
            node.replaceWith(outer);
            return;
          }
          [...node.childNodes].forEach(walk);
        }
      };
      [...tmp.childNodes].forEach(walk);
      title.innerHTML = tmp.innerHTML;
      title.dataset.split = "1";
    }

    const ctx = gsap.context(() => {
      // Eyebrow + sub-line reveal
      if (headRef.current) {
        const nonTitle = [...headRef.current.children].filter(
          (c) => !c.classList.contains("pf-section-title")
        );
        gsap.fromTo(
          nonTitle,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: headRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }
      // Word-by-word title reveal
      if (title) {
        const inners = title.querySelectorAll(".v3-word-inner");
        gsap.set(inners, { yPercent: 110 });
        gsap.to(inners, {
          yPercent: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: {
            trigger: title,
            start: "top 85%",
            once: true,
          },
        });
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
            scrollTrigger: {
              trigger: filterRef.current,
              start: "top 88%",
              once: true,
            },
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Drive motionState.workActive + rowSide on scroll
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const update = () => {
      const section = sectionRef.current;
      const grid = gridRef.current;
      if (!section || !grid) {
        raf = 0;
        return;
      }
      const vh = window.innerHeight;
      const sectionRect = section.getBoundingClientRect();
      const inView = sectionRect.top < vh * 0.6 && sectionRect.bottom > vh * 0.4;
      motionState.workActive = inView;
      motionState.past = sectionRect.bottom < vh * 0.4;

      if (inView) {
        // Pick the row whose vertical center is closest to viewport center
        const rowEls = grid.querySelectorAll(".v3-work-row");
        const viewportMid = vh / 2;
        let bestIdx = 0;
        let bestDist = Infinity;
        rowEls.forEach((r, i) => {
          const rr = r.getBoundingClientRect();
          const rowMid = rr.top + rr.height / 2;
          const d = Math.abs(rowMid - viewportMid);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        });
        // Even rows → engine LEFT (cards right), odd rows → engine RIGHT
        motionState.rowSide = bestIdx % 2 === 0 ? -1 : 1;
      }
      raf = 0;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (raf) cancelAnimationFrame(raf);
      // Clean up state so engine returns to default
      motionState.workActive = false;
      motionState.past = false;
    };
  }, []);

  return (
    <section ref={sectionRef} className="pf-section v3-work-alt" id="work">
      <div className="container">
        <div className="pf-section-head" ref={headRef}>
          <div className="pf-section-num">
            <span className="dot" />
            02 / The work
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
                ? RAW_ITEMS.length
                : RAW_ITEMS.filter((it) => it.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`pf-filter-btn ${isActive ? "is-active" : ""}`}
                onClick={() => setActive(cat)}
              >
                <span>{cat}</span>
                <em>{count}</em>
              </button>
            );
          })}
        </div>

        <div ref={gridRef} className="v3-work-grid">
          {rows.map((rowItems, rowIdx) => (
            <div
              key={`row-${rowIdx}`}
              className={`v3-work-row v3-work-row--${rowIdx % 2 === 0 ? "right" : "left"}`}
              data-row={rowIdx}
            >
              {rowItems.map((item, colIdx) => {
                const flatIdx = rowIdx * 2 + colIdx;
                const cardKey = `${item.client}-${item.title}-${flatIdx}`;
                return (
                  <WorkCard
                    key={cardKey}
                    cardKey={cardKey}
                    item={item}
                    index={flatIdx}
                    hoveredKey={hoveredKey}
                    setHoveredKey={setHoveredKey}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
