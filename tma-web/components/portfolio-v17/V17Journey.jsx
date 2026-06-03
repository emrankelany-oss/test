"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * V17 — connected journey (Obsidian model).
 *
 * No separate "sections": ONE tall scroll track + a sticky persistent stage
 * that holds everything (prism, title, the 5 shared cards, chrome, case info).
 * A single scroll value drives a deterministic render(progress) that moves the
 * SAME card nodes through every phase:
 *
 *   hero  →  title disperse + cards gather into a centred deck
 *         →  deck deals: cards 3D-flip and fly into the scatter
 *         →  browse (◀ ▶ re-slot)  →  parallax zoom into the focused case
 *         →  portal-out
 *
 * Only Foodics & Zid travel from the hero; the 3 brand cards fade/scale into
 * the remaining slots at the deal boundary. Reduced motion → static grid.
 */

// Copy is verbatim from the TMA portfolio deck
// (Google Slides 1AXMmpCL7n2WMd8V9xyGcriiX_eg5s9hxH_iSLJ7HXkU).
const ITEMS = [
  {
    key: "foodics", kind: "photo", name: "Foodics",
    media: "/assets/case-foodics-boundless.png",
    tint: "linear-gradient(150deg,#4E008E,#250048)", metric: "$1B unicorn",
    sector: "F&B TECH · BOUNDLESS 2022–23",
    disciplines: "Brand Strategy · Events · GTM",
    story:
      "We shaped Foodics’ reputation and positioning from its $2M funding stage and built the flagship Boundless events from scratch, expanding across Egypt, Kuwait, UAE & Jordan. Today Foodics has grown from 8,000 to 32,000+ restaurants, holds 35% of the Saudi market, and stands as a $1B unicorn.",
    stats: [
      "8,000 → 32,000+ merchants",
      "35% Saudi market share",
      "$15.4M → $20.8M (+35.6% YoY)",
      "$1B unicorn",
    ],
  },
  {
    key: "zid", kind: "photo", name: "Zid",
    media: "/assets/case-zid-ripple.png",
    tint: "linear-gradient(150deg,#1f7ae0,#072a63)", metric: "+200% growth",
    sector: "TOTAL COMMERCE · RIPPLE 2024",
    disciplines: "Brand · Event · Campaigns",
    story:
      "We restructured Zid’s marketing team, launched new brand guidelines and a dynamic website, and delivered Ripple 2024 — Zid’s first-ever product event — positioning Zid as the leading Total Commerce platform. Zid achieved 200% growth last year.",
    stats: [
      "200% growth in a year",
      "12,000+ active merchants (+30%)",
      "+50% basket size & conversion",
      "+25% YoY GMV",
    ],
  },
  {
    key: "burger-king", kind: "logo", name: "Burger King",
    media: "/assets/logos/burger-king.png",
    tint: "linear-gradient(150deg,#7a2410,#2c0d04)", metric: "KSA campaign",
    sector: "QSR · KSA CAMPAIGN",
    disciplines: "Campaign · OOH · TVC · Social",
    story:
      "“Royal Taste” — national KSA campaign work across OOH, Drive-Thru, Ramadan and social, positioning Burger King with bold, craveable creative.",
    stats: ["“Royal Taste” campaign", "Drive-Thru · 5-minute promise", "Ramadan · social"],
  },
  {
    key: "electrolux", kind: "logo", name: "Electrolux",
    media: "/assets/logos/electrolux.png",
    tint: "linear-gradient(150deg,#0a3b6b,#04162b)", metric: "Content",
    sector: "CONSUMER APPLIANCES",
    disciplines: "Product Marketing · Photography",
    story:
      "Product marketing & content — lifestyle product photography, the “Introducing the New Collection” brochures, and “Thinking of you” brand-script collateral.",
    stats: ["Product photography", "Collection brochures", "Brand collateral"],
  },
  {
    key: "aramco", kind: "logo", name: "Aramco",
    media: "/assets/logos/aramco.png",
    tint: "linear-gradient(150deg,#0a6b3c,#04261a)", metric: "Client",
    sector: "ENERGY · ENTERPRISE",
    disciplines: "Client roster",
    story:
      "A client on The Motion Agency’s roster. (The portfolio deck shows no dedicated Aramco case study — copy intentionally minimal.)",
    stats: ["On the TMA client roster"],
  },
];
const N = ITEMS.length;

// hero resting anchors (fractions of stage), only for the 2 travelling cards
const HERO_ANCHOR = {
  0: { x: -0.30, y: -0.05, rot: -5, s: 0.66 }, // Foodics — left
  1: { x: 0.31, y: 0.10, rot: 5, s: 0.60 }, //  Zid    — right
};
// scatter slots by offset from the centred card — wide editorial cluster
// (mirrors the Obsidian /places reference: one large landscape hero with
// asymmetric landscape thumbnails scattered around it)
// compact cluster — thumbnails sit close around the hero, slightly tucked
const SLOTS = [
  { x: 0, y: 0, s: 1.0, o: 1, z: 50 }, // 0 = focused (large, centred)
  { x: -0.27, y: -0.18, s: 0.5, o: 0.95, z: 20 }, // top-left
  { x: 0.28, y: 0.17, s: 0.52, o: 0.95, z: 20 }, // bottom-right
  { x: -0.25, y: 0.21, s: 0.44, o: 0.9, z: 18 }, // bottom-left
  { x: 0.25, y: -0.22, s: 0.42, o: 0.9, z: 18 }, // top-right
];

// phase boundaries on journey progress (0..1)
const PH = {
  disperse: [0.1, 0.24],
  gather: [0.14, 0.26],
  deal: [0.26, 0.42],
  brand: [0.30, 0.44],
  browse: [0.42, 0.58],
  zoom: [0.58, 0.84],
  portal: [0.93, 1.0],
};

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p, [a, b]) => clamp01((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
// strong ease for the "enter inside the card" dolly
const easeIO = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function V17Journey({ booted }) {
  const journeyRef = useRef(null);
  const stageRef = useRef(null);
  const prismRef = useRef(null);
  const turbRef = useRef(null);
  const dispRef = useRef(null);
  const titleRef = useRef(null);
  const metaRef = useRef(null);
  const cueRef = useRef(null);
  const headRef = useRef(null);
  const caseRef = useRef(null);
  const suckRef = useRef(null);
  const cardEls = useRef([]);
  const mediaEls = useRef([]);
  const tintEls = useRef([]);
  const footEls = useRef([]);
  const arrowEls = useRef([]);
  const charData = useRef([]);
  const splitDone = useRef(false);
  const dims = useRef({ w: 1, h: 1, cardW: 1, cardH: 1 });
  const pRef = useRef(0);
  const [center, setCenter] = useState(0);
  const centerRef = useRef(0);
  centerRef.current = center;
  const [reduced, setReduced] = useState(false);

  const measure = useCallback(() => {
    const st = stageRef.current;
    const c = cardEls.current[0];
    if (!st) return;
    dims.current = {
      w: st.clientWidth,
      h: st.clientHeight,
      cardW: c ? c.offsetWidth : st.clientWidth * 0.24,
      cardH: c ? c.offsetHeight : st.clientHeight * 0.5,
    };
  }, []);

  // split the title into characters once (words kept whole)
  useEffect(() => {
    if (typeof window === "undefined" || splitDone.current) return;
    const t = titleRef.current;
    if (!t) return;
    t.querySelectorAll(".v17-word > span").forEach((span) => {
      const text = span.textContent;
      span.textContent = "";
      text.split(/(\s+)/).forEach((tok) => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) {
          span.appendChild(document.createTextNode(tok));
          return;
        }
        const w = document.createElement("span");
        w.className = "v17-cword";
        for (const ch of tok) {
          const c = document.createElement("span");
          c.className = "v17-char";
          c.textContent = ch;
          w.appendChild(c);
        }
        span.appendChild(w);
      });
    });
    const chars = [...t.querySelectorAll(".v17-char")];
    charData.current = chars.map((el) => ({
      el,
      dx: gsap.utils.random(-160, 160),
      dy: gsap.utils.random(70, 220),
      dr: gsap.utils.random(-60, 60),
    }));
    splitDone.current = true;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setReduced(reduce);
    gsap.set(t, { autoAlpha: reduce ? 1 : 0 });
    if (!reduce)
      gsap.set(chars, { yPercent: 115, autoAlpha: 0 });
  }, []);

  // title entrance once the preloader hands off
  useEffect(() => {
    if (!booted || reduced) return;
    const t = titleRef.current;
    if (!t) return;
    const chars = t.querySelectorAll(".v17-char");
    gsap.set(t, { autoAlpha: 1 });
    gsap.fromTo(
      chars,
      { yPercent: 115, autoAlpha: 0, rotateZ: () => gsap.utils.random(-9, 9) },
      {
        yPercent: 0, autoAlpha: 1, rotateZ: 0, duration: 0.9,
        ease: "expo.out", stagger: { each: 0.02, from: "start" },
      }
    );
  }, [booted, reduced]);

  // ---- the deterministic renderer: progress → every element's transform ----
  const render = useCallback(
    (p) => {
      pRef.current = p;
      const { w, h, cardW, cardH } = dims.current;
      const ctr = centerRef.current;

      // hero chrome (prism, meta, scroll cue) fades out as we leave the hero
      const heroOut = 1 - smooth(seg(p, [0.14, 0.26]));
      if (prismRef.current)
        gsap.set(prismRef.current, {
          autoAlpha: 1 - smooth(seg(p, [0.16, 0.3])),
        });
      if (metaRef.current) gsap.set(metaRef.current, { autoAlpha: heroOut });
      if (cueRef.current) gsap.set(cueRef.current, { autoAlpha: heroOut });

      // title characters disperse — leave them alone before the disperse
      // phase so the entrance tween isn't overridden every scroll tick
      if (p >= PH.disperse[0]) {
        const dp = smooth(seg(p, PH.disperse));
        charData.current.forEach((c) => {
          gsap.set(c.el, {
            xPercent: c.dx * dp,
            yPercent: c.dy * dp,
            rotateZ: c.dr * dp,
            autoAlpha: 1 - dp,
          });
        });
      }

      const gatherT = smooth(seg(p, PH.gather));
      const dealT = smooth(seg(p, PH.deal));
      const brandT = smooth(seg(p, PH.brand));
      const zoomT = smooth(seg(p, PH.zoom));
      const portalT = smooth(seg(p, PH.portal));

      // the white section rises from the bottom; its curved edge top (in px
      // from the top of the stage) — the focused card perches just above it
      const rT = smooth(seg(p, [0.9, 1.0]));
      const riserYpct = 100 * (1 - rT);
      const edgeTopPx = dims.current.h * (riserYpct / 100);

      cardEls.current.forEach((el, i) => {
        if (!el) return;
        const slotIdx = (i - ctr + N) % N;
        const slot = SLOTS[slotIdx];
        const isFocus = slotIdx === 0;
        const travels = i < 2; // only Foodics & Zid fly from the hero

        // ---- base position by phase ----
        let X, Y, S, R = 0, RY = 0, O = 1, Z = slot.z;

        if (travels) {
          const a = HERO_ANCHOR[i];
          const hero = { x: a.x * w, y: a.y * h, s: a.s, r: a.rot };
          const deck = { x: 0, y: 0, s: 0.62, r: i === 0 ? -4 : 5 };
          const scat = { x: slot.x * w, y: slot.y * h, s: slot.s, r: 0 };
          // hero → deck (gather)
          let cx = lerp(hero.x, deck.x, gatherT);
          let cy = lerp(hero.y, deck.y, gatherT);
          let cs = lerp(hero.s, deck.s, gatherT);
          let cr = lerp(hero.r, deck.r, gatherT);
          // deck → scatter (deal) with a 3D flip + slight arc
          cx = lerp(cx, scat.x, dealT);
          cy = lerp(cy, scat.y, dealT) - Math.sin(dealT * Math.PI) * h * 0.12;
          cs = lerp(cs, scat.s, dealT);
          cr = lerp(cr, scat.r, dealT);
          RY = (1 - dealT) * 180 * (i === 0 ? 1 : -1) * (gatherT > 0.05 ? 1 : 0);
          X = cx; Y = cy; S = cs; R = cr; O = 1; Z = isFocus ? 50 : slot.z;
        } else {
          // brand cards: hidden in the centre → fade/scale into their slot
          const fromX = 0, fromY = 0, fromS = 0.4;
          X = lerp(fromX, slot.x * w, brandT);
          Y = lerp(fromY, slot.y * h, brandT);
          S = lerp(fromS, slot.s, brandT);
          O = brandT;
          Z = slot.z;
        }

        // ---- zoom: SLOW, deliberate "getting inside the card".
        // Neighbours drift away gently over a long scroll stretch; the centre
        // card grows to a contained ~80%-width size & holds; text comes after.
        const zScale = easeIO(seg(p, [0.62, 0.84])); // slow grow, then holds
        const zAway = easeIO(seg(p, [0.58, 0.8])); // neighbours leave slowly
        if (p >= 0.58) {
          // fill ~80% of the screen width (still a card with margins)
          const fit = Math.min((w * 0.82) / cardW, (h * 0.92) / cardH);
          if (isFocus) {
            X = lerp(X, 0, zScale);
            Y = lerp(Y, 0, zScale);
            S = lerp(S, fit, zScale);
            R = lerp(R, 0, zScale);
            RY = 0;
            Z = 80;
            // portal: the card ZOOMS OUT into a small card that floats just
            // ABOVE the rising white edge (a returned deck card on the rim) —
            // it stays visible, never sucked under
            if (portalT > 0) {
              const smallS = (w * 0.2) / cardW; // ~20%-width mini card
              const smallH = cardH * smallS;
              S = lerp(S, smallS, portalT);
              X = lerp(X, 0, portalT);
              // ride just above the curved edge as the white rises
              const perchY = edgeTopPx - h / 2 - smallH * 0.62;
              Y = lerp(Y, perchY, portalT);
              R = lerp(R, 0, portalT);
              RY = 0;
              Z = 130; // above the white riser
              O = 1; // stays visible
            }
          } else {
            X = X * (1 + 2.0 * zAway);
            Y = Y * (1 + 2.0 * zAway);
            O = (1 - zAway) * (slot.o ?? 1);
          }
        }

        gsap.set(el, {
          x: X,
          y: Y,
          scale: S,
          rotateZ: R,
          rotateY: RY,
          autoAlpha: O,
          zIndex: Z,
        });

        // focused: subtle media dolly + tint clears so the real photo reads;
        // the card's own foot fades out so the case panel isn't duplicated
        const m = mediaEls.current[i];
        if (m)
          gsap.set(m, {
            scale: isFocus ? 1 + 0.12 * zScale : 1,
            yPercent: isFocus ? -6 * zScale + 6 * portalT : 0,
          });
        const tn = tintEls.current[i];
        if (tn)
          gsap.set(tn, {
            opacity: isFocus ? lerp(0.5, 0.06, zScale) : 0.5,
          });
        const ft = footEls.current[i];
        if (ft)
          gsap.set(ft, { autoAlpha: isFocus ? 1 - zScale : 1 });
      });

      // chrome (head + counter + arrows) in after the deal, out at zoom
      {
        const inT = smooth(seg(p, [0.36, 0.46]));
        const outT = smooth(seg(p, [0.58, 0.66]));
        const chromeOp = inT * (1 - outT);
        if (headRef.current)
          gsap.set(headRef.current, { autoAlpha: chromeOp });
        arrowEls.current.forEach(
          (a) => a && gsap.set(a, { autoAlpha: chromeOp })
        );
      }
      // case info — only AFTER the card has settled at its zoom size
      if (caseRef.current) {
        const inT = smooth(seg(p, [0.85, 0.92]));
        const outT = smooth(seg(p, [0.95, 1.0]));
        gsap.set(caseRef.current, {
          autoAlpha: inT * (1 - outT),
          y: 30 * (1 - inT) - 24 * outT,
        });
      }

      // the white section RISES from the bottom; the focused card perches
      // just above its curved edge (computed as rT/edgeTopPx above)
      if (suckRef.current) {
        gsap.set(suckRef.current, {
          yPercent: riserYpct,
          autoAlpha: rT > 0.001 ? 1 : 0,
        });
      }
    },
    []
  );

  // detect reduced motion early (covered again in split effect)
  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  // prism pointer parallax — cones drift toward the cursor (subtle)
  useEffect(() => {
    if (typeof window === "undefined" || reduced) return;
    const stage = stageRef.current;
    const prism = prismRef.current;
    if (!stage || !prism) return;
    const cones = [...prism.querySelectorAll("[data-depth]")];
    const movers = cones.map((el) => ({
      depth: parseFloat(el.dataset.depth) || 0,
      xTo: gsap.quickTo(el, "--px", { duration: 0.9, ease: "power3" }),
      yTo: gsap.quickTo(el, "--py", { duration: 0.9, ease: "power3" }),
    }));
    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      movers.forEach((m) => {
        m.xTo(nx * m.depth);
        m.yTo(ny * m.depth);
      });
    };
    stage.addEventListener("mousemove", onMove);
    return () => stage.removeEventListener("mousemove", onMove);
  }, [reduced]);

  // water ripple — gentle undulation, waves a little more under the pointer
  useEffect(() => {
    if (typeof window === "undefined" || !booted || reduced) return;
    const stage = stageRef.current;
    const turb = turbRef.current;
    const disp = dispRef.current;
    if (!stage || !turb || !disp) return;
    const BASE = 4;
    const MAX = 16;
    const f = { v: 0.01 };
    const idle = gsap.to(f, {
      v: 0.015, duration: 6.5, ease: "sine.inOut", repeat: -1, yoyo: true,
      onUpdate: () =>
        turb.setAttribute(
          "baseFrequency",
          `${f.v.toFixed(4)} ${(f.v * 1.3).toFixed(4)}`
        ),
    });
    const s = { v: BASE };
    const applyS = () => disp.setAttribute("scale", s.v.toFixed(2));
    applyS();
    const sTo = gsap.quickTo(s, "v", {
      duration: 0.7, ease: "power3", onUpdate: applyS,
    });
    let lastX = null, lastY = 0, lastT = 0, settle;
    const onMove = (e) => {
      const now = performance.now();
      if (lastX !== null) {
        const dt = Math.max(16, now - lastT);
        const sp = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt;
        sTo(Math.min(MAX, BASE + sp * 22));
      }
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
      clearTimeout(settle);
      settle = setTimeout(() => sTo(BASE), 140);
    };
    stage.addEventListener("mousemove", onMove);
    return () => {
      stage.removeEventListener("mousemove", onMove);
      clearTimeout(settle);
      idle.kill();
      sTo.tween?.kill();
    };
  }, [booted, reduced]);

  // master ScrollTrigger — one scroll value drives render()
  useEffect(() => {
    if (typeof window === "undefined" || reduced) return;
    const journey = journeyRef.current;
    if (!journey) return;

    const ctx = gsap.context(() => {
      measure();
      render(0);
      ScrollTrigger.create({
        trigger: journey,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => render(self.progress),
      });
    }, journeyRef);

    const onResize = () => {
      measure();
      render(pRef.current);
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, [reduced, render, measure]);

  // arrows — only while browsing; re-slot the shared cards
  const cycle = useCallback(
    (dir) => {
      const p = pRef.current;
      if (reduced || p < PH.browse[0] || p > PH.browse[1]) return;
      setCenter((c) => {
        const next = (c + dir + N) % N;
        centerRef.current = next;
        // animate the shared cards to their new slots
        cardEls.current.forEach((el, i) => {
          if (!el) return;
          const slot = SLOTS[(i - next + N) % N];
          gsap.to(el, {
            x: slot.x * dims.current.w,
            y: slot.y * dims.current.h,
            scale: slot.s,
            autoAlpha: slot.o,
            zIndex: slot.z,
            rotateY: 0,
            rotateZ: 0,
            duration: 0.7,
            ease: "power3.inOut",
          });
        });
        return next;
      });
    },
    [reduced]
  );

  const focused = ITEMS[center];

  return (
    <div
      className={`v17-journey${reduced ? " is-static" : ""}`}
      ref={journeyRef}
    >
      <div className="v17-stage" ref={stageRef}>
        {/* prism field (hero background, fades out after the hero) */}
        <div className="v17-prism" ref={prismRef} aria-hidden="true">
          <svg className="v17-defs" aria-hidden="true" focusable="false">
            <filter id="v17-water" x="-15%" y="-15%" width="130%" height="130%">
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

        <div className="v17-meta" ref={metaRef}>
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

        {/* shared persistent card layer */}
        <div className="v17-cardlayer" aria-hidden="true">
          {ITEMS.map((it, i) => (
            <article
              key={it.key}
              ref={(el) => (cardEls.current[i] = el)}
              className={`v17-fxcard v17-fxcard--${it.kind}`}
              style={{ backgroundImage: it.tint }}
              onClick={() => cycle(i === center ? 0 : 1)}
            >
              <div
                className="v17-fxcard-media"
                ref={(el) => (mediaEls.current[i] = el)}
                style={{ backgroundImage: `url(${it.media})` }}
              />
              {it.kind === "photo" && (
                <div
                  className="v17-fxcard-tint"
                  ref={(el) => (tintEls.current[i] = el)}
                  style={{ background: it.tint }}
                />
              )}
              <div
                className="v17-fxcard-foot"
                ref={(el) => (footEls.current[i] = el)}
              >
                <span className="v17-fxcard-name">{it.name}</span>
                <span className="v17-fxcard-metric">{it.metric}</span>
              </div>
            </article>
          ))}
        </div>

        {/* chrome */}
        <div className="v17-fx-head" ref={headRef}>
          <span className="v17-fx-kicker">FEATURED WORK</span>
          <span className="v17-fx-count">
            {String(center + 1).padStart(2, "0")} /{" "}
            {String(N).padStart(2, "0")}
          </span>
        </div>
        <button
          className="v17-fx-arrow v17-fx-arrow--prev"
          ref={(el) => (arrowEls.current[0] = el)}
          onClick={() => cycle(-1)}
          aria-label="Previous project"
        >
          ←
        </button>
        <button
          className="v17-fx-arrow v17-fx-arrow--next"
          ref={(el) => (arrowEls.current[1] = el)}
          onClick={() => cycle(1)}
          aria-label="Next project"
        >
          →
        </button>

        {/* case info (revealed during the parallax zoom) */}
        <div className="v17-zoom-info" ref={caseRef}>
          <span className="v17-zoom-sector">{focused.sector}</span>
          <h2 className="v17-zoom-name">{focused.name}</h2>
          <p className="v17-zoom-story">{focused.story}</p>
          <ul className="v17-zoom-stats">
            {focused.stats.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <span className="v17-zoom-disc">{focused.disciplines}</span>
        </div>

        <div className="v17-scroll" ref={cueRef} aria-hidden="true">
          Scroll <span className="v17-scroll-line" /> Featured Work
        </div>

        {/* the white section rising from the bottom; its curved top edge
            is the suction point the shrinking card is pulled into */}
        <div className="v17-suck" ref={suckRef} aria-hidden="true">
          <svg
            className="v17-suck-edge"
            viewBox="0 0 100 14"
            preserveAspectRatio="none"
          >
            <path d="M0 4 L41 4 C46 4 47 13 50 13 C53 13 54 4 59 4 L100 4 L100 14 L0 14 Z" />
          </svg>
          <div className="v17-suck-fill" />
        </div>
      </div>
    </div>
  );
}
