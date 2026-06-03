"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Module-level state survives React Strict Mode's mount/unmount/mount cycle
 * AND Next's client-side route changes (shared JS bundle).
 *
 *  'idle' — never played this session, or a replay was just requested
 *  'done' — timeline finished; revisits skip straight to the hero
 *
 * 'playing' is intentionally NOT a guarded state: in Strict Mode, mount 1
 * starts a timeline against mount 1's DOM, then unmounts. Mount 2's DOM is
 * fresh and needs its OWN timeline — so each mount that finds state ≠ 'done'
 * runs its own animation. Cleanup reverts only if the timeline didn't
 * complete naturally, so on a real unmount the user doesn't see a snap-back.
 */
let STATE = "idle";

/**
 * V18Preloader
 *
 * A short, identity-bearing opening: agency wordmark + an orbiting progress
 * ring that fills 0 → 100, then plays a two-stage exit (mark flash → curtain
 * lift) before calling onDone. The hero is mounted behind us, so when the
 * curtain leaves the user lands directly on the hero with its title rising.
 */
export default function V18Preloader({ onDone }) {
  const rootRef = useRef(null);
  const wordmarkRef = useRef(null);
  const ringRef = useRef(null);
  const orbitRef = useRef(null);
  const counterRef = useRef(null);
  const tagRef = useRef(null);
  const [count, setCount] = useState(0);

  // Capture onDone in a ref so the boot effect's deps stay empty. The parent
  // passes an inline arrow which changes identity every render; if we depended
  // on it directly, calling onDone() (which flips parent state) would re-run
  // the effect mid-animation, hit the "done" branch on a second pass, and
  // hide the preloader before it ever played.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Drive the 0 → 100 counter, then play the exit.
  useEffect(() => {
    // Replay request — set by the home nav's Portfolio link so every click
    // gets the agency intro instead of an instant Next-router cut.
    if (typeof window !== "undefined") {
      try {
        if (sessionStorage.getItem("v18-replay-preloader")) {
          STATE = "idle";
          sessionStorage.removeItem("v18-replay-preloader");
        }
      } catch {
        /* sessionStorage may be unavailable in privacy modes */
      }
    }

    // Already played this session: skip straight to the hero.
    if (STATE === "done") {
      if (rootRef.current) rootRef.current.style.display = "none";
      onDoneRef.current?.();
      return;
    }

    let finished = false;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      // Dev-only knob: ?slow=N divides timeline speed for design iteration.
      if (typeof window !== "undefined") {
        const slow = new URLSearchParams(window.location.search).get("slow");
        if (slow) tl.timeScale(1 / Math.max(1, Number(slow) || 1));
      }

      // Entrance — wordmark + ring slide-in
      tl.from(wordmarkRef.current, {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
      })
        .from(
          ringRef.current,
          { scale: 0.6, opacity: 0, duration: 0.6, ease: "power3.out" },
          "<0.05"
        )
        .from(
          tagRef.current,
          { y: 12, opacity: 0, duration: 0.5, ease: "power2.out" },
          "<0.1"
        )
        .from(
          counterRef.current,
          { y: 12, opacity: 0, duration: 0.5, ease: "power2.out" },
          "<"
        );

      // Loading — count and ring fill
      const progress = { v: 0 };
      tl.to(progress, {
        v: 100,
        duration: 2.0,
        ease: "power2.inOut",
        onUpdate: () => {
          const v = Math.round(progress.v);
          setCount(v);
          if (ringRef.current) {
            ringRef.current.style.setProperty("--p", String(progress.v / 100));
          }
        },
      });

      // Resolve — ring flashes, wordmark pulses
      tl.to(ringRef.current, {
        scale: 1.08,
        duration: 0.25,
        ease: "power2.out",
      })
        .to(ringRef.current, {
          opacity: 0,
          duration: 0.35,
          ease: "power2.in",
        }, "<0.05")
        .to(wordmarkRef.current, {
          scale: 1.04,
          duration: 0.3,
          ease: "power2.out",
        }, "<");

      // Exit — split-curtain lift; hero is already behind us
      tl.to(
        [counterRef.current, tagRef.current],
        { opacity: 0, y: -8, duration: 0.35, ease: "power2.in" },
        "+=0.05"
      )
        .to(wordmarkRef.current, {
          y: -36,
          opacity: 0,
          duration: 0.6,
          ease: "power3.inOut",
        })
        .to(
          rootRef.current,
          {
            yPercent: -100,
            duration: 1.0,
            ease: "expo.inOut",
            onComplete: () => {
              finished = true;
              STATE = "done";
              onDoneRef.current?.();
            },
          },
          "-=0.35"
        );
    }, rootRef);

    // Cleanup: revert ONLY if the user is leaving before the timeline finished.
    // If finished is true, the preloader has already lifted off-screen and the
    // hero is visible — reverting would yank everything back into view.
    return () => {
      if (!finished) ctx.revert();
    };
  }, []);

  // Subtle orbiting dot — runs forever during boot, hidden by ring fade-out.
  useEffect(() => {
    if (!orbitRef.current) return;
    const tween = gsap.to(orbitRef.current, {
      rotate: 360,
      duration: 1.6,
      ease: "none",
      repeat: -1,
      transformOrigin: "50% 50%",
    });
    return () => tween.kill();
  }, []);

  return (
    <div ref={rootRef} className="v18-preloader" aria-hidden>
      <div className="v18-pre-vignette" />

      <div className="v18-pre-stage">
        <div ref={wordmarkRef} className="v18-pre-wordmark">
          <span className="v18-pre-mark">
            <img src="/assets/tma-logo-white.png" alt="" />
          </span>
          <span className="v18-pre-name">THE MOTION AGENCY</span>
        </div>

        <div ref={ringRef} className="v18-pre-ring" style={{ "--p": 0 }}>
          <svg viewBox="0 0 120 120" aria-hidden>
            <circle className="v18-pre-ring-track" cx="60" cy="60" r="54" />
            <circle className="v18-pre-ring-fill" cx="60" cy="60" r="54" />
          </svg>
          <div ref={orbitRef} className="v18-pre-orbit">
            <span className="v18-pre-orbit-dot" />
          </div>
          <span className="v18-pre-ring-core" />
        </div>

        <div ref={tagRef} className="v18-pre-tag">
          <span className="dot" /> EST. 2019 · AMMAN ↔ RIYADH
        </div>
      </div>

      <div ref={counterRef} className="v18-pre-counter">
        <span className="v18-pre-counter-num">
          {String(count).padStart(3, "0")}
        </span>
        <span className="v18-pre-counter-pct">%</span>
        <span className="v18-pre-counter-lbl">LOADING EXPERIENCE</span>
      </div>
    </div>
  );
}
