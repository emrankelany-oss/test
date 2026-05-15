"use client";

// Painterly chapter-reveal. A per-instance <clipPath> whose silhouette
// scales from a speck to oversized as the chapter scrolls in, scrubbed
// to scroll. The shape's hand-cut edge sweeps across the section so each
// chapter is revealed THROUGH a painterly mask instead of a hard cut.
//
// Per-instance (not the shared MasksSprite): an animated clip must own
// its <clipPath> — a shared sprite path would tween every consumer at
// once. MasksSprite stays for STATIC uses (card notches, later phases).
//
// Path silhouettes are the Gemini-authored shapes, duplicated from
// /public/masks.svg in 0..1000 space.

import { useEffect, useId } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const MASK_PATHS = {
  m_iris_close:
    "M 880,500 C 880,560 830,600 785,665 C 740,730 760,780 710,863 C 660,946 580,850 500,850 C 420,850 360,910 285,872 C 210,834 250,750 205,670 C 160,590 90,580 90,500 C 90,420 170,410 222,340 C 274,270 230,200 280,118 C 330,36 420,140 500,140 C 580,140 620,100 695,162 C 770,224 740,270 794,330 C 848,390 880,440 880,500 Z",
  m_torn_diagonal:
    "M 0,150 C 20,180 30,220 40,210 C 50,200 90,190 110,200 C 130,210 120,270 140,280 C 160,290 190,260 210,270 C 230,280 250,340 260,350 C 270,360 280,390 290,380 C 300,370 340,350 360,360 C 380,370 370,440 390,450 C 410,460 440,480 460,490 C 480,500 490,460 510,470 C 530,480 520,550 540,560 C 560,570 590,540 610,550 C 630,560 620,610 640,620 C 660,630 690,650 710,660 C 730,670 720,640 740,650 C 760,660 790,720 810,730 C 830,740 840,780 860,770 C 880,760 870,740 890,750 C 910,760 940,820 960,830 C 980,840 990,840 1000,850 L 1000,1000 L 0,1000 Z",
  m_horizon_wipe:
    "M 0,510 C 20,480 40,460 60,470 C 80,480 100,535 130,520 C 150,510 170,455 190,460 C 210,465 230,545 260,540 C 290,535 300,495 330,500 C 360,505 370,445 400,450 C 430,455 450,555 480,550 C 510,545 530,485 560,490 C 590,495 610,525 640,510 C 670,495 680,435 710,440 C 740,445 760,535 790,530 C 820,525 840,475 870,480 C 900,485 920,555 950,550 C 980,545 990,495 1000,510 L 1000,1000 L 0,1000 Z",
  m_curtain_up:
    "M 0,500 C 30,540 50,590 80,580 C 110,570 130,410 160,420 C 190,430 210,600 240,590 C 270,580 290,400 320,410 C 350,420 370,540 400,550 C 430,560 450,440 480,450 C 510,460 530,610 560,600 C 590,590 610,390 640,400 C 670,410 690,570 720,560 C 750,550 770,430 800,440 C 830,450 850,580 880,570 C 910,560 930,450 960,460 C 980,465 990,490 1000,500 L 1000,0 L 0,0 Z",
};

// Scales the silhouette about the 0..1000 centre, then maps to the
// element bounding box (objectBoundingBox = the 0.001 leading scale).
const transformFor = (s) =>
  `scale(0.001) translate(500 500) scale(${s}) translate(-500 -500)`;

const S_HIDDEN = 0.05; // a speck — chapter effectively hidden
const S_SHOWN = 3; // overflows the bbox — chapter fully revealed

/**
 * Apply a scroll-scrubbed painterly reveal to an existing section.
 *
 * @param {React.RefObject<HTMLElement>} ref  the section element
 * @param {keyof MASK_PATHS} mask             which silhouette to use
 */
export function useMaskedReveal(ref, mask) {
  const reactId = useId();

  useEffect(() => {
    const el = ref.current;
    const d = MASK_PATHS[mask];
    if (!el || !d) return;

    const clipId = `mr-${mask}-${reactId.replace(/:/g, "")}`;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    svg.style.pointerEvents = "none";

    const defs = document.createElementNS(NS, "defs");
    const clip = document.createElementNS(NS, "clipPath");
    clip.setAttribute("id", clipId);
    clip.setAttribute("clipPathUnits", "objectBoundingBox");
    const g = document.createElementNS(NS, "g");
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    g.appendChild(path);
    clip.appendChild(g);
    defs.appendChild(clip);
    svg.appendChild(defs);
    document.body.appendChild(svg);

    const set = (s) => g.setAttribute("transform", transformFor(s));

    const prevClip = el.style.clipPath;
    el.style.clipPath = `url(#${clipId})`;

    let ctx;
    if (reduce) {
      set(S_SHOWN); // skip the cinematic — present it solved
    } else {
      set(S_HIDDEN);
      const proxy = { s: S_HIDDEN };
      ctx = gsap.context(() => {
        gsap.to(proxy, {
          s: S_SHOWN,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "top 32%",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
          onUpdate: () => set(proxy.s),
        });
      });
    }

    return () => {
      if (ctx) ctx.revert();
      el.style.clipPath = prevClip;
      svg.remove();
    };
  }, [ref, mask, reactId]);
}
