"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Reusable chapter wrapper — pins the panel for a beat and runs a fade-through.
function Chapter({ id, n, kicker, title, em, body, children, height = 1.3, theme }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const headline = el.querySelector(".v9-ch-title");
      const sub = el.querySelector(".v9-ch-sub");
      const kick = el.querySelector(".v9-ch-kicker");
      const inner = el.querySelector(".v9-ch-inner");

      gsap.set([headline, sub, kick, inner], { autoAlpha: 0, y: 40 });

      ScrollTrigger.create({
        trigger: el,
        start: "top 70%",
        end: "bottom 30%",
        onEnter: () => {
          gsap.to(kick, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" });
          gsap.to(headline, {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            delay: 0.06,
            ease: "power3.out",
          });
          gsap.to(sub, {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            delay: 0.18,
            ease: "power3.out",
          });
          gsap.to(inner, {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            delay: 0.26,
            ease: "power3.out",
          });
        },
        onLeaveBack: () => {
          gsap.to([kick, headline, sub, inner], {
            autoAlpha: 0,
            y: 30,
            duration: 0.4,
            ease: "power2.in",
          });
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      className={`v9-section v9-chapter ${theme ? `v9-chapter--${theme}` : ""}`}
      style={{ minHeight: `${height * 100}vh` }}
    >
      <div className="v9-chapter-bg" aria-hidden="true" />
      <div className="v9-chapter-content">
        <div className="v9-ch-kicker">
          <span className="v9-mono">CHAPTER {n}</span>
          <span className="v9-mono v9-ch-kicker-tag">{kicker}</span>
        </div>
        <h2 className="v9-ch-title">
          {title} <em>{em}</em>
        </h2>
        {body && <p className="v9-ch-sub">{body}</p>}
        {children && <div className="v9-ch-inner">{children}</div>}
      </div>
    </section>
  );
}

export function ChapterHero() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".v9-hero-mono span", { y: 20, autoAlpha: 0, stagger: 0.08, duration: 0.7 }, 0.15)
        .from(
          ".v9-hero-title .v9-word",
          { y: 80, autoAlpha: 0, rotateX: 12, stagger: 0.1, duration: 1.1 },
          0.25,
        )
        .from(".v9-hero-sub", { y: 30, autoAlpha: 0, duration: 0.8 }, 0.9)
        .from(".v9-hero-scroll", { autoAlpha: 0, duration: 0.8 }, 1.2);
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="v9-section v9-hero" ref={ref} id="signal-birth">
      <div className="v9-hero-meta">
        <div className="v9-hero-mono">
          <span>THE MOTION AGENCY</span>
          <span>—</span>
          <span>PORTFOLIO · V9</span>
          <span>—</span>
          <span>SIGNAL 001</span>
        </div>
      </div>

      <h1 className="v9-hero-title">
        <span className="v9-word">THE</span>{" "}
        <span className="v9-word v9-em">SIGNAL</span>
        <br />
        <span className="v9-word">IS</span>{" "}
        <span className="v9-word">EVOLVING</span>
      </h1>

      <p className="v9-hero-sub">
        Scroll to ignite the film. The Signal is an evolving motion-energy entity —
        it generates the work, the worlds, and the words behind every category
        leader we&apos;ve built across the GCC.
      </p>

      <div className="v9-hero-foot">
        <div className="v9-hero-scroll">
          <span className="v9-mono">SCROLL TO BEGIN</span>
          <span className="v9-line" />
          <span className="v9-mono">01 / 06</span>
        </div>
        <div className="v9-hero-coord">
          <span className="v9-mono">LAT 24.7136 · LON 46.6753</span>
          <span className="v9-mono">RIYADH · AMMAN</span>
        </div>
      </div>
    </section>
  );
}

export function ChapterEvolution() {
  return (
    <Chapter
      id="signal-evolution"
      n="02"
      kicker="EVOLUTION"
      title="MOTION BECOMES"
      em="INTELLIGENCE."
      body="Paths multiply. Energy trails braid into systems. The Signal stops being noise and starts becoming a language."
      theme="evolution"
      height={1.4}
    >
      <div className="v9-stat-row">
        <div className="v9-stat">
          <span className="v9-stat-v">07</span>
          <span className="v9-mono">YEARS BUILDING CATEGORY LEADERS</span>
        </div>
        <div className="v9-stat">
          <span className="v9-stat-v">$1B</span>
          <span className="v9-mono">FOODICS · UNICORN VALUATION</span>
        </div>
        <div className="v9-stat">
          <span className="v9-stat-v">+200%</span>
          <span className="v9-mono">ZID · YOY GROWTH POST-RIPPLE</span>
        </div>
        <div className="v9-stat">
          <span className="v9-stat-v">35%</span>
          <span className="v9-mono">F&B MARKET SHARE · KSA</span>
        </div>
      </div>
    </Chapter>
  );
}

export function ChapterSystems() {
  const services = [
    "BRAND STRATEGY",
    "GO-TO-MARKET",
    "CREATIVE DIRECTION",
    "FILM · TVC · OOH",
    "MOTION DESIGN",
    "EVENT & STAGE",
    "DIGITAL PRODUCT",
    "CONTENT SYSTEMS",
  ];
  return (
    <Chapter
      id="signal-systems"
      n="04"
      kicker="CREATIVE SYSTEMS"
      title="THE SIGNAL"
      em="STRUCTURES ITSELF."
      body="Timelines lock. Disciplines snap into orbit. Services aren't bolted on — they're the geometry of the Signal."
      theme="systems"
      height={1.5}
    >
      <div className="v9-systems-grid">
        {services.map((s, i) => (
          <div key={s} className="v9-system-cell" style={{ "--si": i }}>
            <span className="v9-mono">0{i + 1}</span>
            <span className="v9-system-label">{s}</span>
            <span className="v9-system-bar" />
          </div>
        ))}
      </div>
    </Chapter>
  );
}

export function ChapterSync() {
  return (
    <Chapter
      id="signal-sync"
      n="05"
      kicker="SYNCHRONIZATION"
      title="EVERY SECTION"
      em="IS THE SAME SIGNAL."
      body="Strategy, design, GTM, content, production — one continuous motion ecosystem. No hand-offs. No seams. One pulse."
      theme="sync"
      height={1.2}
    >
      <div className="v9-sync-row">
        <span className="v9-sync-pulse" />
        <span className="v9-sync-pulse" />
        <span className="v9-sync-pulse" />
        <span className="v9-sync-pulse" />
        <span className="v9-sync-pulse" />
      </div>
      <div className="v9-sync-quote">
        &ldquo;We don&apos;t pitch campaigns. We embed with B2B brands and build them
        into category leaders.&rdquo;
        <span className="v9-mono v9-sync-cite">— TMA OPERATING PRINCIPLE</span>
      </div>
    </Chapter>
  );
}

export function ChapterInfinite() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(".v9-infinite-title .v9-word", {
        scrollTrigger: { trigger: el, start: "top 70%" },
        y: 80,
        autoAlpha: 0,
        rotateX: 12,
        stagger: 0.08,
        duration: 1,
        ease: "power3.out",
      });
      gsap.from(".v9-infinite-marquee-track", {
        scrollTrigger: { trigger: el, start: "top 80%" },
        autoAlpha: 0,
        duration: 1.2,
        ease: "power2.out",
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="v9-section v9-infinite" id="signal-infinite" ref={ref}>
      <div className="v9-infinite-meta">
        <span className="v9-mono">CHAPTER 06</span>
        <span className="v9-mono">INFINITE MOTION</span>
      </div>
      <h2 className="v9-infinite-title">
        <span className="v9-word">THE</span> <span className="v9-word">SIGNAL</span>
        <br />
        <span className="v9-word">NEVER</span>{" "}
        <span className="v9-word v9-em">RESTS.</span>
      </h2>
      <p className="v9-infinite-sub">
        Stabilized into a continuous loop. The work keeps building. The brands keep
        compounding. Your launch starts here.
      </p>
      <div className="v9-infinite-marquee" aria-hidden="true">
        <div className="v9-infinite-marquee-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              FOODICS · ZID · INVOICEQ · SALASA · LSC · VODAFONE · BURGER KING ·
              FRA&apos;ED · SÓL · TRANSFORM ·
            </span>
          ))}
        </div>
      </div>
      <div className="v9-infinite-cta-wrap">
        <a className="v9-infinite-cta" href="/#contact">
          <span>START A PROJECT</span>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 16L16 4M7 4h9v9" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </a>
        <a className="v9-infinite-ghost" href="/portfolio">
          <span>RETURN TO PORTFOLIO V1</span>
        </a>
      </div>
      <div className="v9-infinite-foot">
        <span className="v9-mono">© THE MOTION AGENCY · EST. 2019</span>
        <span className="v9-mono">AMMAN · RIYADH</span>
        <span className="v9-mono">SIGNAL TERMINATED — LOOP TO BEGIN</span>
      </div>
    </section>
  );
}
