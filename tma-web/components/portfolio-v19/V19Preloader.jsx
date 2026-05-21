"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * V19Preloader — "Monogram Assembly → Cinemascope Split"
 *
 * A cinematic first-hook that becomes the page reveal rather than fading out.
 *
 * Sequence (≈3.4s, cinematic easing throughout):
 *   1. Calm blackout — two black cinemascope panels meet at the vertical
 *      centre; faint grain + a tinted prism glow sit dormant behind.
 *   2. The "M" monogram draws itself in (stroke dash), the wordmark wipes
 *      open, and a hairline seam grows outward from centre.
 *   3. Energy sweep — a counter ticks 00→100 while a progress hairline fills
 *      and the prism glow blooms (layered scale = depth/parallax).
 *   4. Tension — everything contracts a hair and the glow dims (anticipation).
 *   5. Reveal burst — the glow flares, the monogram dissolves upward, and the
 *      two panels split apart (top↑ / bottom↓) with a heavy power4 ease,
 *      opening onto the hero behind them.
 *   6. The hero's own staggered entrance is *released* at the split so its
 *      headline lines rise and cards scale in THROUGH the opening — same
 *      motion language continued, not a new animation.
 *
 * Conventions mirror V5Preloader: SSR renders the overlay (so the hero never
 * flashes first), scroll is held via capture-phase input blockers (never
 * `overflow:hidden`, which would perturb layout), and every exit path frees
 * the page idempotently. A module-level flag skips the full sequence on
 * client-side route returns (the module stays loaded across SPA navigations)
 * while a genuine page reload re-evaluates the module and replays the intro —
 * which is what a hard refresh should do. (sessionStorage was wrong here: it
 * persists across reloads, so a refresh would never replay.)
 *
 * prefers-reduced-motion gets a calm, movement-free variant: the mark + word
 * are shown static and the panels simply cross-fade away.
 */

// Persists across client-side route navigations but resets on a full page
// reload — so the intro plays once per page load, not once per browser session.
let hasPlayedThisLoad = false;

const HOLD_CLASS = "v19-intro-hold"; // pauses the hero's CSS entrance
const FALLBACK_MS = 6000; // hard cap before forcing the reveal
const TAIL_MS = 1100; // panel-split duration + buffer before unmount

export default function V19Preloader() {
  // SSR + first client render both render the overlay → no hero flash and no
  // hydration mismatch. The skip decision happens in the effect (client-only).
  const [done, setDone] = useState(false);

  const rootRef = useRef(null);
  const topRef = useRef(null);
  const botRef = useRef(null);
  const coreRef = useRef(null);
  const glowRef = useRef(null);
  const markRef = useRef(null);
  const wordRef = useRef(null);
  const revealRef = useRef(null);
  const seamRef = useRef(null);
  const counterRef = useRef(null);
  const barRef = useRef(null);
  const metaRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const page = document.querySelector(".v19-page");
    const finish = () => setDone(true);

    // --- Client-side route return: skip the full sequence --------------
    // Hero plays its normal CSS entrance (no hold class added). A real page
    // reload resets hasPlayedThisLoad, so a refresh always replays the intro.
    if (hasPlayedThisLoad) {
      finish();
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // --- Hold the hero entrance until the reveal -----------------------
    // The hero's rise/scale-in animations run on mount; pausing them now (via
    // a parent class) freezes them near t=0 behind the opaque panels. Removing
    // the class at the split lets them play out THROUGH the opening.
    page && page.classList.add(HOLD_CLASS);
    const releaseHero = () => page && page.classList.remove(HOLD_CLASS);

    // --- Hold the viewport at the top (no overflow toggling) -----------
    window.scrollTo(0, 0);
    const block = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const opts = { passive: false, capture: true };
    const keyBlock = (e) => {
      const keys = [" ", "PageDown", "PageUp", "Home", "End", "ArrowDown", "ArrowUp"];
      if (keys.includes(e.key)) block(e);
    };
    window.addEventListener("wheel", block, opts);
    window.addEventListener("touchmove", block, opts);
    window.addEventListener("keydown", keyBlock, true);

    let scrollReleased = false;
    const releaseScroll = () => {
      if (scrollReleased) return;
      scrollReleased = true;
      window.removeEventListener("wheel", block, opts);
      window.removeEventListener("touchmove", block, opts);
      window.removeEventListener("keydown", keyBlock, true);
    };

    // Mark "seen" only at the REVEAL, never at mount. Writing it at mount would
    // make React StrictMode's dev double-invoke (mount→unmount→mount) skip the
    // second pass — the flag must reflect a completed intro, not a started one.
    const markSeen = () => {
      hasPlayedThisLoad = true;
    };

    // Absolute safety net: the page can never stay locked past this cap.
    const hardRelease = window.setTimeout(() => {
      markSeen();
      releaseScroll();
      releaseHero();
      finish();
    }, FALLBACK_MS + TAIL_MS + 1500);

    const counterEl = counterRef.current;
    const setCount = (v) => {
      if (counterEl) counterEl.textContent = String(Math.round(v)).padStart(2, "0");
    };

    let tl;
    const ctx = gsap.context(() => {
      if (reduced) {
        // Calm variant — no movement, just a static mark and a cross-fade.
        setCount(100);
        gsap.set([markRef.current, wordRef.current, glowRef.current, metaRef.current], {
          opacity: 1,
        });
        // clear the CSS hidden start states so the still-frame reads complete.
        gsap.set(revealRef.current, { attr: { width: 1000 } });
        gsap.set(wordRef.current, { strokeDashoffset: 0 });
        gsap.set(barRef.current, { scaleX: 1 });
        gsap.set(seamRef.current, { scaleX: 1 });
        tl = gsap.timeline({
          delay: 0.5,
          onComplete: () => {
            markSeen();
            releaseScroll();
            releaseHero();
            finish();
          },
        });
        // panels + core simply fade — no translate.
        tl.set(rootRef.current, { pointerEvents: "none" }, 0);
        tl.to([coreRef.current], { opacity: 0, duration: 0.4, ease: "power1.out" });
        tl.to([topRef.current, botRef.current], { opacity: 0, duration: 0.5, ease: "power1.out" }, "-=0.15");
        return;
      }

      // Initial (pre-animation) states.
      gsap.set(rootRef.current, { autoAlpha: 1 });
      gsap.set(markRef.current, { opacity: 1 });
      gsap.set(wordRef.current, { strokeDashoffset: 0 });
      gsap.set(metaRef.current, { opacity: 0, y: 8 });
      gsap.set(glowRef.current, { opacity: 0, scale: 0.55 });
      gsap.set(seamRef.current, { scaleX: 0, opacity: 0.85 });
      gsap.set(barRef.current, { scaleX: 0 });
      setCount(0);

      const count = { v: 0 };

      tl = gsap.timeline({
        onComplete: () => finish(),
      });

      // 1 — calm hold, then the monogram draws itself in.
      // wordmark writes itself: a left→right reveal rect uncovers the stroked
      // glyph outlines like a pen moving across the page.
      gsap.set(wordRef.current, { strokeDashoffset: 0 });
      gsap.set(revealRef.current, { attr: { width: 0 } });
      tl.to(revealRef.current, { attr: { width: 1000 }, duration: 1.25, ease: "power2.inOut" }, 0.3);
      tl.fromTo(seamRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.95, ease: "power2.inOut" }, 0.55);
      tl.to(metaRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.95);

      // 2 — energy sweep: glow blooms (layered scale = depth), counter ticks.
      tl.to(glowRef.current, { opacity: 0.6, scale: 1, duration: 1.25, ease: "power2.out" }, 0.85);
      tl.to(count, { v: 100, duration: 1.7, ease: "power1.inOut", onUpdate: () => setCount(count.v) }, 0.6);
      tl.to(barRef.current, { scaleX: 1, duration: 1.7, ease: "power1.inOut" }, 0.6);

      // 3 — tension: a held breath. Everything contracts a hair, glow dims.
      tl.to(coreRef.current, { scale: 0.972, duration: 0.4, ease: "power2.in" }, 2.3);
      tl.to(glowRef.current, { opacity: 0.4, duration: 0.4, ease: "power2.in" }, 2.3);

      // 4 — reveal burst.
      const BURST = 2.72;
      // free interaction + release the hero entrance exactly as the bars part.
      // pointer-events:none lets clicks reach the hero through the opening,
      // before the overlay actually unmounts at the end of the split.
      tl.call(() => {
        markSeen();
        releaseScroll();
        releaseHero();
        gsap.set(rootRef.current, { pointerEvents: "none" });
      }, null, BURST - 0.05);
      // glow flares outward (light through the opening).
      tl.to(glowRef.current, { opacity: 0.95, scale: 1.7, duration: 0.55, ease: "power3.out" }, BURST);
      // monogram + word dissolve upward.
      tl.to(coreRef.current, { opacity: 0, y: -34, scale: 1.05, duration: 0.5, ease: "power2.in" }, BURST);
      // seam flashes bright then thins away.
      tl.to(seamRef.current, { opacity: 1, scaleY: 2.4, duration: 0.18, ease: "power2.out" }, BURST);
      tl.to(seamRef.current, { opacity: 0, duration: 0.45, ease: "power2.in" }, BURST + 0.18);
      // 5 — cinemascope split: panels part with a heavy cinematic ease.
      tl.to(topRef.current, { yPercent: -100, duration: 0.95, ease: "power4.inOut" }, BURST + 0.05);
      tl.to(botRef.current, { yPercent: 100, duration: 0.95, ease: "power4.inOut" }, BURST + 0.05);
      tl.to(glowRef.current, { opacity: 0, duration: 0.5, ease: "power2.in" }, BURST + 0.45);
    }, rootRef);

    return () => {
      window.clearTimeout(hardRelease);
      releaseScroll();
      releaseHero();
      ctx.revert();
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="v19pl"
      role="status"
      aria-live="polite"
      aria-label="Loading The Motion Agency portfolio"
    >
      {/* two black cinemascope panels meeting at the vertical centre */}
      <div ref={topRef} className="v19pl-panel v19pl-panel--top" aria-hidden="true" />
      <div ref={botRef} className="v19pl-panel v19pl-panel--bot" aria-hidden="true" />

      {/* tinted prism glow — depth layer behind the monogram */}
      <div ref={glowRef} className="v19pl-glow" aria-hidden="true" />

      {/* hairline seam along the split line */}
      <div ref={seamRef} className="v19pl-seam" aria-hidden="true" />

      {/* centred core: monogram, wordmark, counter — fades out at the burst */}
      <div ref={coreRef} className="v19pl-core">
        <svg
          ref={markRef}
          className="v19pl-wordmark"
          viewBox="0 0 1000 160"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="v19pl-reveal">
              <rect ref={revealRef} x="0" y="0" width="0" height="160" />
            </clipPath>
            <linearGradient id="v19pl-ink" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9fe0ff" />
              <stop offset="60%" stopColor="#6fd3ff" />
              <stop offset="100%" stopColor="#bfe9ff" />
            </linearGradient>
          </defs>
          <text
            ref={wordRef}
            x="500" y="112" textAnchor="middle"
            clipPath="url(#v19pl-reveal)"
            fill="none"
            stroke="url(#v19pl-ink)"
            strokeWidth="2"
            strokeDasharray="2000"
          >
            The Motion Agency
          </text>
        </svg>

        <div ref={metaRef} className="v19pl-meta" aria-hidden="true">
          <span className="v19pl-bar">
            <span ref={barRef} className="v19pl-bar-fill" />
          </span>
          <span ref={counterRef} className="v19pl-count">00</span>
        </div>
      </div>
    </div>
  );
}
