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
      // Ring radius is derived from a SAFE AREA so tiles never clip the nav (top)
      // or the viewport bottom. tileH ≈ tileW * 9/16; reserve 110px top (nav +
      // word) and 96px bottom.
      const tileW = Math.max(240, Math.min(vw * 0.18, 300));
      const tileHalfH = (tileW * 9) / 16 / 2;
      // Centre the whole composition in the usable band BELOW the fixed nav (not
      // the raw viewport) so it reads visually centred with balanced margins.
      const navSafe = 96, padB = 30;
      const cx = vw / 2;
      const cy = (navSafe + (vh - padB)) / 2;
      const halfUsable = (vh - padB - navSafe) / 2;
      const rx = Math.min(vw * 0.37, 560);
      const ry = Math.max(170, Math.min(halfUsable - tileHalfH - 14, 300));
      // Intro cards: prominent but with breathing room (not filling full height).
      const portraitW = Math.min(vw * 0.3, 460), portraitH = Math.min(vh * 0.66, 600);
      const landW = Math.min(vw * 0.46, 720), landH = Math.min(vh * 0.44, 420);
      const gap = Math.min(vw * 0.18, 320);
      const cardScale = 0.62; // clear focal anchor while the films ring around it
      const EASE = "power3.inOut";
      const FAN = "power3.out";

      const center = { xPercent: -50, yPercent: -50, left: "50%", top: cy + "px" };
      gsap.set([foodics.card, zid.card], { ...center });
      gsap.set(foodics.card, { width: portraitW, height: portraitH, x: -gap, y: 0, autoAlpha: 1, zIndex: 2 });
      gsap.set(zid.card, { width: portraitW, height: portraitH, x: gap, y: 0, autoAlpha: 1, zIndex: 1 });
      data.forEach(({ tiles }) =>
        gsap.set(tiles, { ...center, x: 0, y: 0, scale: 0.5, autoAlpha: 0, filter: "blur(16px)", zIndex: 3 })
      );
      // Gallery words are positioned RELATIVE TO THE RING (set per group below in
      // fanGroup): client name top-left of the composition, GALLERY beside the
      // lowest film tile. Here we just set their hidden/nudged start state.
      gsap.set([foodics.wordL, zid.wordL], { x: -50, autoAlpha: 0, zIndex: 6, right: "auto", bottom: "auto" });
      gsap.set([foodics.wordR, zid.wordR], { x: 50, autoAlpha: 0, zIndex: 6, right: "auto", bottom: "auto" });

      const fanGroup = (d, label) => {
        const pos = ringPositions(d.tiles.length, { rx, ry });
        // anchor the client word at the top-left of the ring's bounding box…
        gsap.set(d.wordL, { left: Math.max(36, cx - rx - tileW / 2), top: navSafe + 4, yPercent: 0 });
        // …and GALLERY just to the right of the lowest film tile ("next to" it),
        // clamped so the word never overflows the right edge.
        let low = 0;
        pos.forEach((p, i) => { if (p.y > pos[low].y) low = i; });
        const fontPx = Math.max(30, Math.min(vw * 0.039, 76));
        const galW = fontPx * 4.2;            // generous width estimate for "GALLERY"
        const cardRight = cx + pos[low].x + tileW / 2;
        const rightSafe = vw - 80 - galW;     // always keep >=80px from the right edge
        let galLeft = Math.min(cardRight + 24, rightSafe);
        galLeft = Math.max(galLeft, cardRight - 30);
        gsap.set(d.wordR, { left: galLeft, top: cy + pos[low].y, yPercent: -50 });
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

      const hold = () => tl.to({}, { duration: 0.6 });

      const tl = gsap.timeline({
        defaults: { ease: EASE },
        scrollTrigger: {
          trigger: stage, start: "top top", end: "+=760%",
          pin: stage, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
        },
      });

      // P0 — intro beat: both cards held side by side so they're clearly seen
      hold();

      // P1 — morph to landscape; Zid slides behind Foodics and hides
      tl.to([foodics.card, zid.card], { width: landW, height: landH, duration: 1.2 }, "morph")
        .to(foodics.card, { x: 0, duration: 1.2 }, "morph")
        .to(zid.card, { x: 0, scale: 0.9, autoAlpha: 0, duration: 1.2 }, "morph");

      // P2 — Foodics shrinks; words + 7 films fan into the ring
      fanGroup(foodics, "fanF");

      // P3 — hold
      hold();

      // P4 — Foodics scrolls UP and out of frame as ONE rigid group (no fade, no
      // collapse): the card + its 7 films + the words all rise away together.
      const foodicsEls = [foodics.card, ...foodics.tiles, foodics.wordL, foodics.wordR];
      tl.addLabel("handoff");
      tl.to(foodicsEls, { y: "-=" + Math.round(vh * 1.3), duration: 1.6, ease: "power2.in" }, "handoff");

      // P5 — Zid emerges from behind the rising Foodics card and slides DOWN to
      // settle in the centre of the fresh section, then fans its films.
      // immediateRender:false so this "from" state doesn't stamp at build time
      // (Zid must stay visible beside Foodics during the intro).
      tl.fromTo(
        zid.card,
        { y: -0.18 * vh, autoAlpha: 0, scale: 1, zIndex: 4 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 1.5, ease: "power3.out", immediateRender: false },
        "handoff+=0.4"
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
