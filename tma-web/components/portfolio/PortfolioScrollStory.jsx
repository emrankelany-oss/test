"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { featuredWork } from "@/data/portfolio";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const tints = [
  "radial-gradient(ellipse 80% 60% at 30% 40%, rgba(78,0,142,0.35), transparent 60%), #050505",
  "radial-gradient(ellipse 70% 50% at 70% 30%, rgba(116,209,234,0.22), transparent 60%), #050505",
  "radial-gradient(ellipse 80% 60% at 25% 60%, rgba(120,80,255,0.28), transparent 60%), #050505",
  "radial-gradient(ellipse 70% 55% at 75% 50%, rgba(255,150,80,0.18), transparent 60%), #050505",
  "radial-gradient(ellipse 80% 60% at 35% 35%, rgba(116,209,234,0.30), transparent 60%), #050505",
  "radial-gradient(ellipse 70% 60% at 70% 60%, rgba(255,100,140,0.22), transparent 60%), #050505",
];

export default function PortfolioScrollStory() {
  const wrapRef = useRef(null);
  const pinRef = useRef(null);
  const bgRef = useRef(null);
  const progressFillRef = useRef(null);
  const progressLabelRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrap = wrapRef.current;
    const pin = pinRef.current;
    if (!wrap || !pin) return;

    const scenes = gsap.utils.toArray(".pf-story-scene", wrap);
    if (!scenes.length) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Mobile: no pinning, simple stacked reveal
      mm.add("(max-width: 900px)", () => {
        scenes.forEach((scene) => {
          gsap.set(scene, { opacity: 1, scale: 1, position: "relative" });
          gsap.fromTo(
            scene.querySelectorAll(".pf-story-image, .pf-story-content"),
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "power2.out",
              stagger: 0.08,
              scrollTrigger: {
                trigger: scene,
                start: "top 80%",
              },
            }
          );
        });
      });

      // Desktop: pinned cinematic scroll story
      mm.add("(min-width: 901px)", () => {
        if (prefersReducedMotion) {
          scenes.forEach((scene) => gsap.set(scene, { opacity: 1, scale: 1 }));
          return;
        }

        // Initial state: stack scenes on top of each other; first visible
        scenes.forEach((scene, i) => {
          gsap.set(scene, {
            position: "absolute",
            inset: 0,
            opacity: i === 0 ? 1 : 0,
            scale: i === 0 ? 1 : 1.04,
          });
        });

        const stepVH = 1; // each scene = 1 viewport height of scroll
        const totalEnd = `+=${(scenes.length) * 100 * stepVH}%`;

        const master = gsap.timeline({
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            end: totalEnd,
            pin: pin,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (progressFillRef.current) {
                progressFillRef.current.style.transform = `scaleX(${self.progress})`;
              }
              if (progressLabelRef.current) {
                const idx = Math.min(
                  scenes.length,
                  Math.floor(self.progress * scenes.length) + 1
                );
                progressLabelRef.current.textContent = String(idx).padStart(2, "0");
              }
            },
          },
        });

        // Hold first scene for one full step, then crossfade through the rest.
        master.to({}, { duration: 1 });

        scenes.forEach((scene, i) => {
          if (i === 0) return;
          const prev = scenes[i - 1];
          master
            .to(prev, { opacity: 0, scale: 0.92, ease: "power2.inOut", duration: 0.6 }, "+=0")
            .fromTo(
              scene,
              { opacity: 0, scale: 1.04 },
              { opacity: 1, scale: 1, ease: "power2.out", duration: 0.6 },
              "<"
            )
            .to({}, { duration: 0.6 }); // hold each scene
        });

        // Parallax: image moves slower (yPercent -8 over its life),
        // headline gets a small counter-translate, background tints shift.
        scenes.forEach((scene, i) => {
          const img = scene.querySelector(".pf-story-image-inner");
          const title = scene.querySelector(".pf-story-title");
          const meta = scene.querySelector(".pf-story-meta");

          if (img) {
            gsap.fromTo(
              img,
              { yPercent: 6, scale: 1.05 },
              {
                yPercent: -8,
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: wrap,
                  start: () => `top+=${i * window.innerHeight} top`,
                  end: () => `top+=${(i + 1) * window.innerHeight} top`,
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              }
            );
          }
          if (title) {
            gsap.fromTo(
              title,
              { yPercent: 4 },
              {
                yPercent: -6,
                ease: "none",
                scrollTrigger: {
                  trigger: wrap,
                  start: () => `top+=${i * window.innerHeight} top`,
                  end: () => `top+=${(i + 1) * window.innerHeight} top`,
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              }
            );
          }
          if (meta) {
            gsap.fromTo(
              meta,
              { yPercent: 8 },
              {
                yPercent: -4,
                ease: "none",
                scrollTrigger: {
                  trigger: wrap,
                  start: () => `top+=${i * window.innerHeight} top`,
                  end: () => `top+=${(i + 1) * window.innerHeight} top`,
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              }
            );
          }

          // Background tint crossfade per scene
          if (bgRef.current) {
            gsap.to(bgRef.current, {
              background: tints[i % tints.length],
              ease: "none",
              scrollTrigger: {
                trigger: wrap,
                start: () =>
                  `top+=${Math.max(0, i * window.innerHeight - window.innerHeight * 0.4)} top`,
                end: () => `top+=${i * window.innerHeight} top`,
                scrub: true,
                invalidateOnRefresh: true,
              },
            });
          }
        });
      });
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={wrapRef}
      className="pf-story-wrap"
      id="featured"
      aria-label="Featured work — scroll story"
    >
      <div ref={pinRef} className="pf-story-pin">
        <div
          ref={bgRef}
          className="pf-story-bg"
          aria-hidden="true"
          style={{ background: tints[0] }}
        />
        <div className="pf-story-grid-overlay" aria-hidden="true" />

        <div className="pf-story-header">
          <div className="pf-story-section-num">
            <span className="dot" />
            03 / Featured work
          </div>
          <div className="pf-story-progress">
            <span ref={progressLabelRef} className="pf-story-progress-num">
              01
            </span>
            <span className="pf-story-progress-sep">/</span>
            <span className="pf-story-progress-total">
              {String(featuredWork.length).padStart(2, "0")}
            </span>
            <div className="pf-story-progress-bar">
              <div ref={progressFillRef} className="pf-story-progress-fill" />
            </div>
          </div>
        </div>

        <div className="pf-story-stage">
          {featuredWork.map((work, i) => (
            <article key={work.id} className={`pf-story-scene ${i % 2 ? "is-flip" : ""}`}>
              <div className="pf-story-image">
                <div
                  className="pf-story-image-inner"
                  style={{ backgroundImage: `url("${work.image}")` }}
                  role="img"
                  aria-label={`${work.client} — ${work.project}`}
                />
              </div>

              <div className="pf-story-content">
                <div className="pf-story-meta">
                  <span className="pf-story-n">{work.n}</span>
                  <span className="dot">·</span>
                  <span>{work.client}</span>
                  <span className="dot">·</span>
                  <span>{work.project}</span>
                </div>

                <h2 className="pf-story-title">{work.headline}</h2>

                <div className="pf-story-tags">
                  {work.tags.map((t, j) => (
                    <span key={j} className="pf-story-tag">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="pf-story-foot">
                  <div className="pf-story-kpi">
                    <span className="v">{work.kpi.v}</span>
                    <span className="l">{work.kpi.l}</span>
                  </div>
                  <a className="pf-story-cta" href={work.href}>
                    {work.href.startsWith("/case/")
                      ? "Read case study"
                      : "Explore the work"}{" "}
                    <span>↗</span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
