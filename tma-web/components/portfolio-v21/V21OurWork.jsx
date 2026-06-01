"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROJECTS } from "./projects";
import { useProjectDrawer } from "./useProjectDrawer";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/* =====================================================================
   V21 — Our Work  (Continuum Phase 3)
   ---------------------------------------------------------------------
   Airy 2-up editorial gallery of ALL projects.
   Every item carries data-cursor="play" + onClick → opens the project
   drawer with the project's full PDF content.
   Header (.v21ow-title-word + em) preserved as filament TAIL anchors.
   ===================================================================== */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function V21OurWork() {
  const { open } = useProjectDrawer();
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef(null);

  /* gentle scroll-reveal for each gallery item */
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".v21ow-gitem").forEach((it) => {
        ScrollTrigger.create({
          trigger: it,
          start: "top 86%",
          once: true,
          onEnter: () => it.classList.add("is-revealed"),
        });
      });
      /* Refresh so any items already in-viewport at mount-time are
         revealed immediately (fixes headless-Playwright timing). */
      ScrollTrigger.refresh();
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section className="v21ow" ref={rootRef}>
      <header className="v21ow-header container">
        <span className="v21ow-eyebrow">
          <span className="v21ow-eyebrow-tick" />
          The archive · selected clients
        </span>
        <h2 className="v21ow-title">
          <span className="v21ow-title-word">Our</span> <em>work</em>
        </h2>
        <p className="v21ow-lede">
          Campaigns, identities and films across the GCC — click any work to
          read the full story.
        </p>
      </header>

      <div className="container">
        <ul className="v21ow-gal">
          {PROJECTS.map((p, i) => (
            <li
              className={`v21ow-gitem${i % 2 === 1 ? " v21ow-gitem--offset" : ""}`}
              key={p.slug || i}
            >
              <a
                className="v21ow-gitem-link"
                href={`#${p.slug || ""}`}
                data-cursor="play"
                onClick={(e) => {
                  e.preventDefault();
                  open(p.slug, e.currentTarget);
                }}
                aria-label={`Open ${p.client} — ${p.title}`}
              >
                <div className="v21ow-gitem-media">
                  <img
                    className="v21ow-gitem-img"
                    src={p.thumb || p.hero}
                    alt=""
                    loading="lazy"
                  />
                </div>
                <div className="v21ow-gitem-cap">
                  <span className="v21ow-gitem-client">{p.client}</span>
                  <span className="v21ow-gitem-meta">{p.year ? `${p.category} · ${p.year}` : p.category}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
