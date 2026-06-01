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
      card: g.querySelector(".v22-sr-card"),
      tiles: Array.from(g.querySelectorAll(".v22-sr-tile")),
    }));
    const [foodics, zid] = data;

    const ctx = gsap.context(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const rx = Math.min(vw * 0.28, 400);
      const ry = Math.min(vh * 0.24, 210);
      // Big, prominent intro cards that fill the centered viewport.
      const portraitW = Math.min(vw * 0.27, 400), portraitH = Math.min(vh * 0.7, 660);
      const landW = Math.min(vw * 0.38, 560), landH = Math.min(vh * 0.36, 320);
      const gap = Math.min(vw * 0.16, 280);

      const center = { xPercent: -50, yPercent: -50, left: "50%", top: "50%" };
      gsap.set([foodics.card, zid.card], { ...center });
      gsap.set(foodics.card, { width: portraitW, height: portraitH, x: -gap, y: 0, autoAlpha: 1, zIndex: 2 });
      gsap.set(zid.card, { width: portraitW, height: portraitH, x: gap, y: 0, autoAlpha: 1, zIndex: 1 });
      data.forEach(({ tiles }) =>
        gsap.set(tiles, { ...center, x: 0, y: 0, scale: 0.4, autoAlpha: 0, zIndex: 3 })
      );

      const holds = [];

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          // Pin off the stage itself so it locks flush to the viewport top and
          // the cards sit dead-centre (the section's padding/heading no longer
          // offset the pinned stage downward).
          trigger: stage, start: "top top", end: "+=550%",
          pin: stage, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: (self) => {
            const t = self.progress * tl.duration();
            const inHold = holds.some(([a, b]) => t >= a && t <= b);
            section.classList.toggle("is-hold", inHold);
          },
        },
      });

      // P1: morph to landscape + zid slides BEHIND foodics and fully hides
      // (autoAlpha 0) so it never bleeds through during the Foodics sequence.
      tl.to([foodics.card, zid.card], { width: landW, height: landH, duration: 1 }, "morph")
        .to(foodics.card, { x: 0, duration: 1 }, "morph")
        .to(zid.card, { x: 0, scale: 0.92, autoAlpha: 0, duration: 1 }, "morph");

      // P2: foodics shrinks; 7 films fan to the ring
      const fpos = ringPositions(foodics.tiles.length, { rx, ry });
      tl.to(foodics.card, { scale: 0.6, duration: 1 }, "fanF");
      foodics.tiles.forEach((t, i) => {
        tl.to(t, { x: fpos[i].x, y: fpos[i].y, scale: 1, autoAlpha: 1, duration: 1 }, "fanF+=" + (i * 0.06));
      });

      // P3: hold
      const _hs0 = tl.duration();
      tl.to({}, { duration: 0.6 });
      holds.push([_hs0, tl.duration()]);

      // P4: collapse foodics + reveal zid
      tl.addLabel("collapseF");
      foodics.tiles.forEach((t) => {
        tl.to(t, { x: 0, y: 0, scale: 0.4, autoAlpha: 0, duration: 1 }, "collapseF");
      });
      tl.to(foodics.card, { scale: 0.4, autoAlpha: 0, duration: 1 }, "collapseF");
      // Zid only appears AFTER Foodics has fully cleared (not concurrently).
      tl.to(zid.card, { autoAlpha: 1, scale: 1, zIndex: 4, duration: 1 }, "collapseF+=0.9");

      // P5: zid to center + fan its 2 films
      const zpos = ringPositions(zid.tiles.length, { rx, ry });
      tl.to(zid.card, { y: 0, scale: 0.6, duration: 1 }, "fanZ");
      zid.tiles.forEach((t, i) => {
        tl.to(t, { x: zpos[i].x, y: zpos[i].y, scale: 1, autoAlpha: 1, duration: 1 }, "fanZ+=" + (i * 0.12));
      });

      // P6: hold then release
      const _hs1 = tl.duration();
      tl.to({}, { duration: 0.6 });
      holds.push([_hs1, tl.duration()]);
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
      if (section) {
        section.dataset.mode = "static";
        section.classList.remove("is-hold");
      }
    };
  }, [sectionRef, enabled]);
}
