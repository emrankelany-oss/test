"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { featuredWork, galleryItems, manifestoQuotes } from "@/data/portfolio";
import { useMaskedReveal } from "./MaskedReveal";
import Placard from "./Placard";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* =========================================================
   01 — HERO
   ========================================================= */
export function HeroPanel() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(".v11-hero-meta span", {
        y: 22,
        autoAlpha: 0,
        stagger: 0.07,
        duration: 0.7,
        delay: 0.2,
        ease: "power3.out",
      });
      gsap.from(".v11-hero-title .v11-word", {
        y: 100,
        autoAlpha: 0,
        rotateX: 14,
        stagger: 0.1,
        duration: 1.1,
        delay: 0.35,
        ease: "power3.out",
      });
      gsap.from(".v11-hero-sub", {
        y: 30,
        autoAlpha: 0,
        duration: 0.9,
        delay: 1.0,
        ease: "power3.out",
      });
      gsap.from(".v11-hero-foot > *", {
        y: 16,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.7,
        delay: 1.2,
        ease: "power3.out",
      });
      // fade out as user leaves the hero
      gsap.to(el, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="v11-section v11-hero" ref={ref} id="v11-hero">
      <div className="v11-hero-meta">
        <span className="v11-mono">THE MOTION AGENCY</span>
        <span className="v11-mono">—</span>
        <span className="v11-mono">PORTFOLIO · V11</span>
        <span className="v11-mono">—</span>
        <span className="v11-mono">BOOSTER 001</span>
      </div>
      <h1 className="v11-hero-title">
        <span className="v11-word">SCROLL</span>{" "}
        <span className="v11-word v11-em">IGNITES</span>
        <br />
        <span className="v11-word">THE</span>{" "}
        <span className="v11-word">BOOSTER.</span>
      </h1>
      <p className="v11-hero-sub">
        An evolving cinematic film. The further you scroll, the further the booster
        carries our work, our numbers, and our voice across the GCC.
      </p>
      <div className="v11-hero-foot">
        <div className="v11-hero-scroll">
          <span className="v11-mono">SCROLL TO LAUNCH</span>
          <span className="v11-line" />
          <span className="v11-mono">01 / 06</span>
        </div>
        <div className="v11-hero-coord">
          <span className="v11-mono">AMMAN · RIYADH</span>
          <span className="v11-mono">EST. 2019</span>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   02 — FEATURED GRID (4 magazine cards alternating L/R as
   the rocket descends through the middle)
   ========================================================= */
export function FeaturedGrid() {
  const ref = useRef(null);
  const featured = featuredWork.slice(0, 4);
  useMaskedReveal(ref, "m_iris_close");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      // section header reveal
      gsap.from(".v11-featured-head > *", {
        scrollTrigger: { trigger: el, start: "top 70%" },
        y: 30,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out",
      });

      // each card slides in from its respective side, then drifts past
      const cards = el.querySelectorAll(".v11-featured-card");
      cards.forEach((card, i) => {
        const fromLeft = i % 2 === 0;
        gsap.fromTo(
          card,
          {
            xPercent: fromLeft ? -110 : 110,
            autoAlpha: 0,
            scale: 0.92,
            filter: "blur(12px)",
          },
          {
            xPercent: 0,
            autoAlpha: 1,
            scale: 1,
            filter: "blur(0px)",
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              end: "top 35%",
              scrub: 1.1,
            },
          },
        );
        // gentle drift after focus
        gsap.to(card, {
          xPercent: fromLeft ? -8 : 8,
          autoAlpha: 0.4,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top 25%",
            end: "bottom -10%",
            scrub: 1,
          },
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="v11-section v11-featured" ref={ref} id="v11-featured">
      <div className="v11-featured-head">
        <span className="v11-mono">CHAPTER 02</span>
        <h2 className="v11-section-title">
          FEATURED <em>SIGNALS</em>
        </h2>
        <p className="v11-section-sub">
          Four launches that turned B2B brands into category leaders. As the
          booster descends, the work emerges through the smoke.
        </p>
      </div>

      <div className="v11-featured-rail">
        {featured.map((w, i) => {
          const side = i % 2 === 0 ? "left" : "right";
          return (
            <article
              key={w.id}
              className={`v11-featured-card v11-featured-card--${side}`}
              data-index={i}
            >
              <div className="v11-card-media">
                <img src={w.image} alt="" loading="lazy" />
                <div className="v11-card-frame" />
                <div className="v11-card-glow" />
                <Placard
                  items={[w.client, w.project]}
                  className="v11-card-placard"
                />
                <div className="v11-card-kpi">
                  <span className="v11-card-kpi-v">{w.kpi.v}</span>
                  <span className="v11-mono">{w.kpi.l}</span>
                </div>
              </div>
              <div className="v11-card-body">
                <div className="v11-card-row">
                  <span className="v11-mono">{w.n}</span>
                  <span className="v11-mono v11-card-client">{w.client}</span>
                </div>
                <h3 className="v11-card-headline">{w.headline}</h3>
                <div className="v11-card-tags">
                  {w.tags.slice(0, 4).map((t) => (
                    <span key={t} className="v11-card-tag">
                      {t}
                    </span>
                  ))}
                </div>
                <a className="v11-card-cta" href={w.href || "#"}>
                  <span>OPEN CASE</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <path
                      d="M2 12L12 2M5 2h7v7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
   03 — WORK RIVER (39 projects, vertical stagger, revealed
   in waves of 6 as the rocket continues to descend)
   ========================================================= */
export function WorkRiver() {
  const ref = useRef(null);
  const projects = galleryItems.slice(0, 39);
  useMaskedReveal(ref, "m_torn_diagonal");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(".v11-work-head > *", {
        scrollTrigger: { trigger: el, start: "top 80%" },
        y: 28,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.8,
        ease: "power3.out",
      });

      const tiles = el.querySelectorAll(".v11-work-tile");
      tiles.forEach((tile, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        gsap.fromTo(
          tile,
          {
            xPercent: side * 30,
            yPercent: 14,
            autoAlpha: 0,
            scale: 0.92,
            filter: "blur(10px)",
          },
          {
            xPercent: 0,
            yPercent: 0,
            autoAlpha: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: tile,
              start: "top 88%",
              end: "top 55%",
              scrub: 1,
            },
          },
        );
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="v11-section v11-work" ref={ref} id="v11-work">
      <div className="v11-work-head">
        <span className="v11-mono">CHAPTER 03</span>
        <h2 className="v11-section-title">
          THE <em>BODY OF WORK</em>
        </h2>
        <p className="v11-section-sub">
          Thirty-nine launches across SaaS, F&B, fintech, commerce, and government.
          Brands. Campaigns. Films. Web. OOH. Production.
        </p>
        <span className="v11-mono v11-work-count">039 · ACTIVE</span>
      </div>

      <div className="v11-work-river">
        {projects.map((p, i) => (
          <article
            key={`${p.client}-${i}`}
            className={`v11-work-tile v11-work-tile--${i % 2 === 0 ? "left" : "right"}`}
            data-index={i}
          >
            <div className="v11-tile-media">
              <img src={p.image} alt="" loading="lazy" />
              <div className="v11-tile-frame" />
              <Placard
                items={[p.client, p.category]}
                className="v11-tile-placard"
              />
            </div>
            <div className="v11-tile-meta">
              <span className="v11-mono v11-tile-num">
                {String(i + 1).padStart(3, "0")}
              </span>
              <span className="v11-mono v11-tile-cat">{p.category}</span>
              <span className="v11-tile-client">{p.client}</span>
              <span className="v11-tile-title">{p.title}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   04 — STATS (scrub-style counters tied directly to scroll
   progress through this section)
   ========================================================= */
const STATS = [
  { v: 1, suffix: "B", prefix: "$", label: "FOODICS · UNICORN VALUATION", note: "From $2M seed to unicorn" },
  { v: 200, suffix: "%", prefix: "+", label: "ZID · YOY GROWTH POST-RIPPLE", note: "12K+ merchant network" },
  { v: 35, suffix: "%", prefix: "", label: "KSA · F&B MARKET SHARE", note: "Category leadership" },
  { v: 7, suffix: " YRS", prefix: "", label: "BUILDING CATEGORY LEADERS", note: "Embedded with B2B brands" },
  { v: 39, suffix: "", prefix: "", label: "PROJECTS · CASES · CAMPAIGNS", note: "Across the GCC" },
];

export function StatsCounters() {
  const ref = useRef(null);
  useMaskedReveal(ref, "m_horizon_wipe");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // section reveal
      gsap.from(".v11-stats-head > *", {
        scrollTrigger: { trigger: el, start: "top 75%" },
        y: 30,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out",
      });

      // each stat counter is mapped to scroll progress across the section.
      // ScrollTrigger scrub does the bidirectional decrement automatically.
      const items = el.querySelectorAll(".v11-stat");
      items.forEach((item, i) => {
        const target = Number(item.dataset.v) || 0;
        const numEl = item.querySelector(".v11-stat-num");
        const obj = { n: 0 };
        gsap.to(obj, {
          n: target,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 65%",
            end: "bottom 30%",
            scrub: 0.6,
            onUpdate: () => {
              const isInt = target >= 100 || Number.isInteger(target);
              numEl.textContent = isInt
                ? Math.round(obj.n).toLocaleString()
                : obj.n.toFixed(target < 10 ? 0 : 1);
            },
          },
        });
        gsap.fromTo(
          item,
          { y: 50, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.9,
            delay: i * 0.05,
            ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 85%" },
          },
        );
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="v11-section v11-stats" ref={ref} id="v11-stats">
      <div className="v11-stats-head">
        <span className="v11-mono">CHAPTER 04</span>
        <h2 className="v11-section-title">
          THE <em>NUMBERS</em> BEHIND THE BOOST.
        </h2>
        <p className="v11-section-sub">
          Embedded operating partners — not external vendors. The math of
          compounding category leadership.
        </p>
      </div>

      <div className="v11-stats-grid">
        {STATS.map((s, i) => (
          <div key={i} className="v11-stat" data-v={s.v}>
            <span className="v11-mono v11-stat-tag">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="v11-stat-value">
              <span className="v11-stat-pref">{s.prefix}</span>
              <span className="v11-stat-num">0</span>
              <span className="v11-stat-suf">{s.suffix}</span>
            </span>
            <span className="v11-mono v11-stat-label">{s.label}</span>
            <span className="v11-stat-note">{s.note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   05 — QUOTES (2 manifesto quotes from V1 + 1 closing line)
   ========================================================= */
const CLOSING_QUOTE = {
  body: "Don't pitch a campaign. Embed an agency. We compound brand equity quarter over quarter — that's why our roster compounds, too.",
  cite: "The Motion Agency — closing principle",
};

export function QuotesPanel() {
  const ref = useRef(null);
  const quotes = [...manifestoQuotes, CLOSING_QUOTE];
  useMaskedReveal(ref, "m_curtain_up");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const items = el.querySelectorAll(".v11-quote");
      items.forEach((item, i) => {
        gsap.from(item, {
          y: 60,
          autoAlpha: 0,
          duration: 1.0,
          ease: "power3.out",
          scrollTrigger: { trigger: item, start: "top 78%" },
        });
        gsap.from(item.querySelectorAll(".v11-quote-cite span"), {
          y: 12,
          autoAlpha: 0,
          stagger: 0.05,
          duration: 0.6,
          delay: 0.2,
          ease: "power2.out",
          scrollTrigger: { trigger: item, start: "top 78%" },
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="v11-section v11-quotes" ref={ref} id="v11-quotes">
      <div className="v11-quotes-head">
        <span className="v11-mono">CHAPTER 05</span>
        <h2 className="v11-section-title">
          OPERATING <em>PRINCIPLES</em>
        </h2>
      </div>
      <div className="v11-quotes-stack">
        {quotes.map((q, i) => (
          <blockquote key={i} className="v11-quote">
            <span className="v11-mono v11-quote-tag">
              0{i + 1} / 0{quotes.length}
            </span>
            <p className="v11-quote-body">&ldquo;{q.body}&rdquo;</p>
            <div className="v11-quote-cite">
              <span className="v11-mono">—</span>
              <span className="v11-mono">{q.cite}</span>
            </div>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   06 — CTA (final landing, after the booster traverses out)
   ========================================================= */
export function CTAPanel() {
  const ref = useRef(null);
  useMaskedReveal(ref, "m_iris_close");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(".v11-cta-title .v11-word", {
        scrollTrigger: { trigger: el, start: "top 75%" },
        y: 80,
        autoAlpha: 0,
        rotateX: 12,
        stagger: 0.08,
        duration: 1,
        ease: "power3.out",
      });
      gsap.from(".v11-cta-sub", {
        scrollTrigger: { trigger: el, start: "top 75%" },
        y: 24,
        autoAlpha: 0,
        duration: 0.9,
        delay: 0.4,
        ease: "power3.out",
      });
      gsap.from(".v11-cta-actions > *", {
        scrollTrigger: { trigger: el, start: "top 80%" },
        y: 20,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 0.7,
        delay: 0.6,
        ease: "power3.out",
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="v11-section v11-cta" ref={ref} id="v11-cta">
      <span className="v11-mono">CHAPTER 06</span>
      <h2 className="v11-cta-title">
        <span className="v11-word">YOUR</span>{" "}
        <span className="v11-word v11-em">LAUNCH</span>
        <br />
        <span className="v11-word">STARTS</span>{" "}
        <span className="v11-word">HERE.</span>
      </h2>
      <p className="v11-cta-sub">
        Embed with the team that built the boosters. Strategy, design, GTM,
        and content — under one roof, in lockstep, with ROI at the core.
      </p>
      <div className="v11-cta-actions">
        <a className="v11-cta-primary" href="/#contact">
          <span>START A PROJECT</span>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M4 16L16 4M7 4h9v9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        </a>
        <a className="v11-cta-ghost" href="/portfolio">
          <span>BACK TO PORTFOLIO V1</span>
        </a>
      </div>
      <footer className="v11-cta-foot">
        <span className="v11-mono">© THE MOTION AGENCY · EST. 2019</span>
        <span className="v11-mono">AMMAN · RIYADH</span>
        <span className="v11-mono">SIGNAL · TERMINATED</span>
      </footer>
    </section>
  );
}
