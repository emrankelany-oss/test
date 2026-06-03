"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * V17 Preloader — "prism bloom".
 *
 * Black screen. The prism ignites from darkness (a colour bloom blooms and
 * expands) while the wordmark fades in, then the veil dissolves and hands off
 * to the hero underneath (no wipe — it *becomes* the hero).
 *
 * Calls onDone() once the hand-off completes so the hero can start its
 * entrance and scrolling can unlock. Reduced motion → instant done.
 *
 * Notes:
 *  - The root is opaque black from CSS (and SSR) so there is never a flash of
 *    the hero before JS runs.
 *  - A `ranRef` guard makes this a true one-shot: React 19 Strict Mode
 *    double-invokes effects in dev, and we must NOT kill the intro timeline
 *    in cleanup (doing so was preventing onDone from ever firing).
 */
export default function V17Preloader({ onDone }) {
  const rootRef = useRef(null);
  const bloomRef = useRef(null);
  const markRef = useRef(null);
  const ranRef = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (typeof window === "undefined" || ranRef.current) return;
    ranRef.current = true;

    const root = rootRef.current;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduce) {
      gsap.set(root, { autoAlpha: 0, pointerEvents: "none" });
      const t = setTimeout(() => doneRef.current?.(), 120);
      return () => clearTimeout(t);
    }

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => doneRef.current?.(),
    });

    gsap.set(bloomRef.current, { scale: 0.18, autoAlpha: 0 });
    gsap.set(markRef.current, { autoAlpha: 0, y: 14 });

    tl.to(bloomRef.current, {
      autoAlpha: 1,
      scale: 1,
      duration: 1.1,
      ease: "expo.out",
    })
      .to(markRef.current, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.35)
      .to({}, { duration: 0.5 }) // hold
      .to(
        bloomRef.current,
        { scale: 2.4, autoAlpha: 0, duration: 1.1, ease: "power2.in" },
        ">-0.05"
      )
      .to(markRef.current, { autoAlpha: 0, y: -12, duration: 0.6 }, "<")
      .to(
        root,
        { autoAlpha: 0, duration: 0.9, ease: "power2.inOut" },
        "<0.15"
      )
      .set(root, { pointerEvents: "none" });

    // Deliberately no cleanup that kills `tl` — this is a one-shot intro and
    // Strict Mode's dev double-invoke must not abort it.
  }, []);

  return (
    <div className="v17-preloader" ref={rootRef} aria-hidden="true">
      <div className="v17-pre-bloom" ref={bloomRef} />
      <div className="v17-pre-mark" ref={markRef}>
        THE MOTION AGENCY
      </div>
    </div>
  );
}
