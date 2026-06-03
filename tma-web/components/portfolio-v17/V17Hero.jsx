"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * V17 Hero.
 *
 * The home page's "prism" field, recentred and made interactive (cones + the
 * two featured-work cards parallax toward the pointer). The title uses the
 * home hero's typographic treatment (Inter Tight 900, one italic word), split
 * into characters:
 *   - entrance: characters rise + fade in, index-staggered with jitter
 *   - on scroll: characters scatter/disperse outward with scroll progress
 *
 * The entrance is gated on `booted` (the preloader hands off). Everything
 * motion-related is gated on prefers-reduced-motion.
 */

const FEATURED = [
  {
    key: "foodics",
    name: "Foodics",
    metric: "$2M → $1B",
    caption: "BOUNDLESS · F&B TECH",
    img: "/assets/case-foodics-boundless.png",
    tint: "linear-gradient(150deg, #4E008E, #250048)",
  },
  {
    key: "zid",
    name: "Zid",
    metric: "+200% YoY",
    caption: "RIPPLE · TOTAL COMMERCE",
    img: "/assets/case-zid-ripple.png",
    tint: "linear-gradient(150deg, #1f7ae0, #072a63)",
  },
];

export default function V17Hero({ booted }) {
  const heroRef = useRef(null);
  const prismRef = useRef(null);
  const cardsRef = useRef(null);
  const titleRef = useRef(null);
  const turbRef = useRef(null);
  const dispRef = useRef(null);
  const splitRef = useRef(false);

  // Split the title into per-character spans (once), keeping the italic word
  // and spaces intact. Title starts hidden until the preloader hands off.
  useEffect(() => {
    if (typeof window === "undefined" || splitRef.current) return;
    const title = titleRef.current;
    if (!title) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Split into words (inline-block, never break mid-word) → chars inside.
    // Spaces stay as plain text nodes so lines still wrap between words.
    const wordInners = title.querySelectorAll(".v17-word > span");
    wordInners.forEach((span) => {
      const text = span.textContent;
      span.textContent = "";
      const tokens = text.split(/(\s+)/); // keep the separators
      tokens.forEach((tok) => {
        if (tok === "") return;
        if (/^\s+$/.test(tok)) {
          span.appendChild(document.createTextNode(tok));
          return;
        }
        const word = document.createElement("span");
        word.className = "v17-cword";
        for (const ch of tok) {
          const c = document.createElement("span");
          c.className = "v17-char";
          c.textContent = ch;
          word.appendChild(c);
        }
        span.appendChild(word);
      });
    });
    splitRef.current = true;

    gsap.set(title, { autoAlpha: reduce ? 1 : 0 });
    if (!reduce) {
      gsap.set(title.querySelectorAll(".v17-char"), {
        yPercent: 115,
        autoAlpha: 0,
      });
    }
  }, []);

  // Pointer parallax (prism cones + cards lean toward the cursor)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const hero = heroRef.current;
    if (reduce || !hero) return;

    const targets = [
      ...(prismRef.current?.querySelectorAll("[data-depth]") || []),
      ...(cardsRef.current?.querySelectorAll("[data-depth]") || []),
    ];
    const movers = targets.map((el) => ({
      depth: parseFloat(el.dataset.depth) || 0,
      xTo: gsap.quickTo(el, "--px", { duration: 0.9, ease: "power3" }),
      yTo: gsap.quickTo(el, "--py", { duration: 0.9, ease: "power3" }),
    }));

    const onMove = (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      movers.forEach((m) => {
        m.xTo(nx * m.depth);
        m.yTo(ny * m.depth);
      });
    };
    const onLeave = () =>
      movers.forEach((m) => {
        m.xTo(0);
        m.yTo(0);
      });

    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);
    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Water ripple — the prism field undulates gently, and waves a little more
  // where the pointer moves (kept subtle). After the preloader.
  useEffect(() => {
    if (typeof window === "undefined" || !booted) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const hero = heroRef.current;
    const turb = turbRef.current;
    const disp = dispRef.current;
    if (reduce || !hero || !turb || !disp) return;

    const BASE = 4; // constant gentle ripple
    const MAX = 16; // most it ever waves on a fast pointer

    // slow turbulence drift so the field always breathes a little
    const f = { v: 0.01 };
    const idle = gsap.to(f, {
      v: 0.015,
      duration: 6.5,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      onUpdate: () =>
        turb.setAttribute(
          "baseFrequency",
          `${f.v.toFixed(4)} ${(f.v * 1.3).toFixed(4)}`
        ),
    });

    // displacement strength — eased toward a pointer-speed target
    const s = { v: BASE };
    const applyS = () => disp.setAttribute("scale", s.v.toFixed(2));
    applyS();
    const sTo = gsap.quickTo(s, "v", {
      duration: 0.7,
      ease: "power3",
      onUpdate: applyS,
    });

    let lastX = null;
    let lastY = 0;
    let lastT = 0;
    let settle;
    const onMove = (e) => {
      const now = performance.now();
      if (lastX !== null) {
        const dt = Math.max(16, now - lastT);
        const speed = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt;
        sTo(Math.min(MAX, BASE + speed * 22));
      }
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
      clearTimeout(settle);
      settle = setTimeout(() => sTo(BASE), 140); // ripple settles back
    };

    hero.addEventListener("mousemove", onMove);
    return () => {
      hero.removeEventListener("mousemove", onMove);
      clearTimeout(settle);
      idle.kill();
      sTo.tween?.kill();
    };
  }, [booted]);

  // Entrance + scroll disperse + card float/recede — after the preloader.
  useEffect(() => {
    if (typeof window === "undefined" || !booted) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      const chars = gsap.utils.toArray(".v17-title .v17-char");

      // entrance — characters rise + fade, index-staggered with jitter
      gsap.set(titleRef.current, { autoAlpha: 1 });
      gsap.fromTo(
        chars,
        {
          yPercent: 115,
          autoAlpha: 0,
          rotateZ: () => gsap.utils.random(-9, 9),
        },
        {
          yPercent: 0,
          autoAlpha: 1,
          rotateZ: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: { each: 0.02, from: "start" },
          delay: () => gsap.utils.random(0, 0.12),
        }
      );

      // scroll disperse — characters scatter outward with scroll progress
      gsap.to(chars, {
        xPercent: () => gsap.utils.random(-140, 140),
        yPercent: () => gsap.utils.random(60, 200),
        rotateZ: () => gsap.utils.random(-60, 60),
        autoAlpha: 0,
        ease: "none",
        stagger: { each: 0.006, from: "center" },
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // idle card float (subtle, independent phases)
      gsap.utils.toArray(".v17-card").forEach((card, i) => {
        gsap.to(card, {
          y: i % 2 === 0 ? -14 : 16,
          rotate: i % 2 === 0 ? -1.5 : 1.5,
          duration: 3.6 + i * 0.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      // cards drift down + prism dims as the hero scrolls away
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      tl.to(".v17-card", { yPercent: 60, autoAlpha: 0.55, ease: "none" }, 0);
      tl.to(prismRef.current, { autoAlpha: 0.45, ease: "none" }, 0);
    }, heroRef);

    return () => ctx.revert();
  }, [booted]);

  return (
    <>
      <header className="v17-hero" ref={heroRef}>
        <div className="v17-prism" ref={prismRef} aria-hidden="true">
          <svg className="v17-defs" aria-hidden="true" focusable="false">
            <filter
              id="v17-water"
              x="-15%"
              y="-15%"
              width="130%"
              height="130%"
            >
              <feTurbulence
                ref={turbRef}
                type="fractalNoise"
                baseFrequency="0.009 0.013"
                numOctaves="2"
                seed="3"
                result="noise"
              />
              <feDisplacementMap
                ref={dispRef}
                in="SourceGraphic"
                in2="noise"
                scale="0"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </svg>
          <div className="v17-prism-fluid">
            <div className="v17-cone v17-cone--blue" data-depth="26" />
            <div className="v17-cone v17-cone--warm" data-depth="18" />
            <div className="v17-cone v17-cone--rim" data-depth="40" />
          </div>
          <div className="v17-grain" />
          <div className="v17-vignette" />
        </div>

        <div className="v17-meta">
          <span>EST. 2019</span>
          <span>AMMAN · RIYADH</span>
          <span>PORTFOLIO ’25</span>
        </div>

        <div className="v17-hero-inner">
          <h1 className="v17-title" ref={titleRef}>
            <span className="v17-word">
              <span>WE DON’T BUILD BRANDS</span>
            </span>
            <br />
            <span className="v17-word">
              <span className="v17-ital">we release</span>
            </span>{" "}
            <span className="v17-word">
              <span>MOMENTUM</span>
            </span>
          </h1>
        </div>

        <div className="v17-cards" ref={cardsRef}>
          {FEATURED.map((p, i) => (
            <div
              key={p.key}
              className={`v17-card-wrap v17-card-wrap--${p.key}`}
              data-depth={i === 0 ? 60 : -52}
            >
              <article
                className={`v17-card v17-card--${p.key}`}
                style={{
                  backgroundImage: `${p.tint}, url(${p.img})`,
                }}
              >
                <div className="v17-card-top">
                  <span className="v17-card-idx">CASE 0{i + 1}</span>
                  <span className="v17-card-metric">{p.metric}</span>
                </div>
                <div className="v17-card-foot">
                  <span className="v17-card-name">{p.name}</span>
                  <span className="v17-card-cap">{p.caption}</span>
                </div>
              </article>
            </div>
          ))}
        </div>

        <div className="v17-scroll" aria-hidden="true">
          Scroll <span className="v17-scroll-line" /> Featured Work
        </div>
      </header>
    </>
  );
}
