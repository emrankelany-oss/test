"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ringPositions } from "../ringPositions";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function useOrbitTimeline(sectionRef, { enabled }) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof window === "undefined" || !enabled) return;

    section.dataset.mode = "orbit";
    const stage = section.querySelector(".v22-sr-stage");
    const groups = Array.from(section.querySelectorAll(".v22-sr-group"));
    const data = groups.map((g) => ({
      group: g,
      card: g.querySelector(".v22-sr-card"),
      tiles: Array.from(g.querySelectorAll(".v22-sr-tile")),
      wordL: g.querySelector(".v22-sr-word-l"),
      wordR: g.querySelector(".v22-sr-word-r"),
    }));
    const [foodics, zid] = data;

    const ctx = gsap.context(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      // Ring is a touch narrower than tall so the FOODICS / GALLERY words have
      // room at the left/right edges.
      const rx = Math.min(vw * 0.27, 400);
      const ry = Math.min(vh * 0.33, 300);
      // Big, prominent cards.
      const portraitW = Math.min(vw * 0.3, 460), portraitH = Math.min(vh * 0.8, 720);
      const landW = Math.min(vw * 0.46, 700), landH = Math.min(vh * 0.46, 420);
      const gap = Math.min(vw * 0.17, 300);
      const cardScale = 0.64; // centred card size while the ring is shown
      const EASE = "power3.inOut";
      const FAN = "power3.out";

      const center = { xPercent: -50, yPercent: -50, left: "50%", top: "50%" };
      gsap.set([foodics.card, zid.card], { ...center });
      gsap.set(foodics.card, { width: portraitW, height: portraitH, x: -gap, y: 0, autoAlpha: 1, zIndex: 2 });
      gsap.set(zid.card, { width: portraitW, height: portraitH, x: gap, y: 0, autoAlpha: 1, zIndex: 1 });
      data.forEach(({ tiles }) =>
        gsap.set(tiles, { ...center, x: 0, y: 0, scale: 0.5, autoAlpha: 0, filter: "blur(16px)", zIndex: 3 })
      );
      // flanking gallery words: vertically centred at the edges, hidden + nudged outward
      gsap.set([foodics.wordL, zid.wordL], { top: "50%", yPercent: -50, x: -40, autoAlpha: 0, zIndex: 6 });
      gsap.set([foodics.wordR, zid.wordR], { top: "50%", yPercent: -50, x: 40, autoAlpha: 0, zIndex: 6 });

      const fanGroup = (d, label) => {
        const pos = ringPositions(d.tiles.length, { rx, ry });
        tl.to(d.card, { scale: cardScale, duration: 1.2 }, label);
        tl.to(d.wordL, { autoAlpha: 1, x: 0, duration: 1.1 }, label + "+=0.15");
        tl.to(d.wordR, { autoAlpha: 1, x: 0, duration: 1.1 }, label + "+=0.15");
        d.tiles.forEach((t, i) => {
          tl.to(
            t,
            { x: pos[i].x, y: pos[i].y, scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 1.1, ease: FAN },
            label + "+=" + (0.3 + i * 0.09)
          );
        });
      };

      const collapseGroup = (d, label) => {
        d.tiles.forEach((t) => {
          tl.to(t, { x: 0, y: 0, scale: 0.5, autoAlpha: 0, filter: "blur(16px)", duration: 1 }, label);
        });
        tl.to([d.wordL, d.wordR], { autoAlpha: 0, duration: 0.6 }, label);
        tl.to(d.card, { scale: 0.42, autoAlpha: 0, duration: 1 }, label);
      };

      const hold = () => tl.to({}, { duration: 0.6 });

      const tl = gsap.timeline({
        defaults: { ease: EASE },
        scrollTrigger: {
          trigger: stage, start: "top top", end: "+=640%",
          pin: stage, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
        },
      });

      // P1 — morph to landscape; Zid hides fully behind Foodics
      tl.to([foodics.card, zid.card], { width: landW, height: landH, duration: 1.2 }, "morph")
        .to(foodics.card, { x: 0, duration: 1.2 }, "morph")
        .to(zid.card, { x: 0, scale: 0.9, autoAlpha: 0, duration: 1.2 }, "morph");

      // P2 — Foodics shrinks; words + 7 films fan into the ring
      fanGroup(foodics, "fanF");

      // P3 — hold
      hold();

      // P4 — Foodics clears
      collapseGroup(foodics, "collapseF");

      // P5 — Zid slides DOWN from behind Foodics into centre, then fans
      tl.fromTo(
        zid.card,
        { y: -0.22 * vh, autoAlpha: 0, scale: 0.9, zIndex: 4 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 1.4, ease: "power3.out" },
        "collapseF+=0.9"
      );
      fanGroup(zid, "fanZ");

      // P6 — hold then release
      hold();
    }, section);

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      ctx.revert();
      if (section) section.dataset.mode = "static";
    };
  }, [sectionRef, enabled]);
}
