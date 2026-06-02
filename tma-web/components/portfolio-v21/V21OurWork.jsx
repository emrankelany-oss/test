"use client";

import { useEffect, useRef } from "react";
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

export default function V21OurWork() {
  const { open } = useProjectDrawer();
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef(null);

  /* gentle scroll-reveal for each gallery item
     Progressive enhancement: the gallery starts in its natural state (items
     visible). JS opts items into the scroll-reveal animation by adding the
     --animated modifier, THEN immediately checks which items are already in
     view and reveals them — so the test window (scroll → wait) always wins. */
  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;
    const gal = root.querySelector(".v21ow-gal");
    if (!gal) return;

    /* 1. Opt into animation (makes items opacity:0 via CSS) */
    gal.classList.add("v21ow-gal--animated");

    const items = Array.from(root.querySelectorAll(".v21ow-gitem"));
    const reveal = (el) => el.classList.add("is-revealed");

    /* 2. Immediately reveal items already in viewport (handles any scroll
          position set before/during hydration). */
    const revealVisible = () => {
      const vh = window.innerHeight;
      items.forEach((it) => {
        if (it.classList.contains("is-revealed")) return;
        const r = it.getBoundingClientRect();
        if (r.top < vh + 100 && r.bottom > -100) reveal(it);
      });
    };
    revealVisible();

    /* 3. Observer for items that scroll into view later */
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0, rootMargin: "100px 0px 100px 0px" }
    );
    items.forEach((it) => {
      if (!it.classList.contains("is-revealed")) io.observe(it);
    });

    /* 4. Also listen to native scroll to re-check on window.scrollTo calls */
    const onScroll = () => revealVisible();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* 5. Safety net: poll every 100ms for up to 1s after mount, covering any
          window.scrollTo calls that happen after this effect fires. */
    const polls = [100, 200, 400, 700, 1000].map((ms) =>
      setTimeout(revealVisible, ms)
    );

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      polls.forEach(clearTimeout);
      gal.classList.remove("v21ow-gal--animated");
    };
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
