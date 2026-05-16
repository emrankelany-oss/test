"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { featuredWork } from "@/data/portfolio";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SignalProjects() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const indexRef = useRef(null);
  const counterRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const cards = Array.from(stage.querySelectorAll(".v9-card"));
    if (!cards.length) return;

    // pin the stage and reveal cards one-at-a-time in depth
    const perCard = 0.9; // viewport heights per card
    const sectionDuration = cards.length * perCard;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * sectionDuration}`,
          pin: true,
          scrub: 1.1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      cards.forEach((card, i) => {
        tl.fromTo(
          card,
          {
            autoAlpha: 0,
            scale: 0.86,
            yPercent: 22,
            filter: "blur(28px)",
            rotateX: -8,
          },
          {
            autoAlpha: 1,
            scale: 1,
            yPercent: 0,
            filter: "blur(0px)",
            rotateX: 0,
            duration: 0.5,
            ease: "power3.out",
          },
          i,
        );

        // drift past after focus
        tl.to(
          card,
          {
            autoAlpha: 0,
            scale: 1.14,
            yPercent: -18,
            filter: "blur(22px)",
            rotateX: 6,
            duration: 0.5,
            ease: "power2.in",
          },
          i + 0.5,
        );

        // counter
        tl.call(
          () => {
            if (counterRef.current) {
              counterRef.current.textContent = String(i + 1).padStart(2, "0");
            }
            if (indexRef.current) {
              indexRef.current.style.setProperty("--v9-idx", i);
            }
          },
          null,
          i + 0.05,
        );
      });

      // background-card pool (ghost cards floating in depth)
      const ghosts = stage.querySelectorAll(".v9-ghost");
      ghosts.forEach((g, i) => {
        gsap.to(g, {
          y: () => (i % 2 ? -60 : 60),
          x: () => (i % 3 ? -30 : 30),
          duration: 8 + i,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const total = featuredWork.length;

  return (
    <section className="v9-section v9-projects" ref={sectionRef} id="signal-projects">
      <div className="v9-projects-bg" aria-hidden="true">
        <div className="v9-projects-fog" />
        <div className="v9-projects-grid" />
      </div>

      <div className="v9-projects-header">
        <div className="v9-mono">CHAPTER 03</div>
        <h2 className="v9-projects-title">
          <span>PROJECT</span>
          <span className="v9-em">MANIFESTATION</span>
        </h2>
        <p className="v9-projects-sub">
          The Signal sharpens. Work emerges from motion energy — one frame at a time.
        </p>
      </div>

      <div className="v9-projects-stage" ref={stageRef}>
        {/* ghost cards drifting in depth behind the active card */}
        {featuredWork.slice(0, 4).map((w, i) => (
          <div
            key={`ghost-${w.id}`}
            className="v9-ghost"
            style={{
              backgroundImage: `url(${w.image})`,
              "--gi": i,
            }}
            aria-hidden="true"
          />
        ))}

        {featuredWork.map((w, i) => (
          <article key={w.id} className="v9-card" style={{ "--ci": i }}>
            <div className="v9-card-media">
              <img src={w.image} alt="" loading="lazy" />
              <div className="v9-card-glow" />
              <div className="v9-card-frame" />
            </div>
            <div className="v9-card-meta">
              <div className="v9-card-row">
                <span className="v9-mono">{w.n}</span>
                <span className="v9-mono v9-card-client">{w.client}</span>
                <span className="v9-mono v9-card-kpi">
                  {w.kpi.v} · {w.kpi.l}
                </span>
              </div>
              <h3 className="v9-card-headline">{w.headline}</h3>
              <div className="v9-card-tags">
                {w.tags.map((t) => (
                  <span key={t} className="v9-tag">
                    {t}
                  </span>
                ))}
              </div>
              <div className="v9-card-foot">
                <a href={w.href || "#"} className="v9-card-cta">
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
                <span className="v9-card-project">{w.project}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="v9-projects-hud" ref={indexRef}>
        <span className="v9-mono">SIGNAL · FOCUS</span>
        <span className="v9-counter">
          <span ref={counterRef}>01</span>
          <em>/</em>
          {String(total).padStart(2, "0")}
        </span>
      </div>
    </section>
  );
}
