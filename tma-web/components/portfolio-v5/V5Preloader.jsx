"use client";
import { useEffect, useRef, useState } from "react";

/**
 * V5 opening preloader — the first hook.
 *
 * The "THE MOTION AGENCY INC." wordmark loop (slide 8 of the deck) is shown
 * as a small, background-less loader the instant the page opens. Its black
 * is blend-keyed out so only the mark sits on the page's black. The clip
 * loops; near the end of each loop it briefly inverts (black mark on
 * white) — we deliberately ride that white flip as the exit cue.
 *
 * Once the page has loaded AND the clip has run a couple of full loops, on
 * the next white-flip the loader flies + scales precisely onto the Nav
 * logo box in the top-left while the hero fades in behind it, then the
 * loader fades out — so it reads as the loader *becoming* the site logo.
 *
 * Scroll is held at the top via capture-phase input blockers (not
 * `overflow:hidden`) so ScrollTrigger's measurement of the pinned hero
 * underneath is never perturbed.
 *
 * Source asset: tma-web/public/assets/v5/slide8-loop.{webm,mp4}
 */
const MIN_LOOPS = 2; // full clip loops before we're allowed to exit
const WHITE_LEAD = 0.3; // s before loop-end — the inverted white flip
const FALLBACK_MS = 6000; // hard cap if loop/metadata detection fails
const FLY_MS = 900; // keep in sync with CSS .is-fly transform transition
// The loader stays solid through the whole flight and the real logo is
// hidden the entire intro; we swap right as it lands (a one-frame, in-place
// hand-off) so it reads as the loader freezing into the logo.
const DONE_BUFFER = 80;

export default function V5Preloader() {
  // SSR + first paint render the overlay so the hero never flashes first.
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(0);
  const rootRef = useRef(null);
  const boxRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // --- Hide the real Nav logo for the whole intro -------------------
    // The loader IS the logo until it flies home; the static Nav logo is
    // only revealed at the instant the loader lands (one-frame swap, same
    // spot/size). Scoped to .v5-page so other routes are untouched, and
    // always cleared on teardown so it can never get stuck hidden.
    const pageEl = document.querySelector(".v5-page");
    pageEl && pageEl.classList.add("v5-logo-hidden");

    // --- Hold the viewport at the top without touching overflow --------
    window.scrollTo(0, 0);
    const block = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const opts = { passive: false, capture: true };
    window.addEventListener("wheel", block, opts);
    window.addEventListener("touchmove", block, opts);
    const keyBlock = (e) => {
      const keys = [" ", "PageDown", "PageUp", "Home", "End", "ArrowDown", "ArrowUp"];
      if (keys.includes(e.key)) block(e);
    };
    window.addEventListener("keydown", keyBlock, true);

    // Scroll-lock release is decoupled from React unmount. It is idempotent
    // and called from EVERY path that should free the page: when the loader
    // starts flying out, an absolute safety timeout, and unmount cleanup.
    // This is the fix for the page-frozen bug — previously the only release
    // was the unmount-at-"done" cleanup, so any timing/environment that
    // delayed "done" left these window blockers attached forever while the
    // overlay was already transparent (deck visible but nothing scrolls).
    let scrollReleased = false;
    const releaseScroll = () => {
      if (scrollReleased) return;
      scrollReleased = true;
      window.removeEventListener("wheel", block, opts);
      window.removeEventListener("touchmove", block, opts);
      window.removeEventListener("keydown", keyBlock, true);
    };

    let raf = 0;
    let triggered = false;
    let pageReady = false;
    let loops = 0;
    let lastTime = 0;
    let cleanupMotion = null;
    const start = performance.now();

    // Absolute safety net: no matter what happens (autoplay blocked, load
    // never firing, an exception in the exit path), the page can never stay
    // scroll-locked past this hard cap.
    const hardRelease = window.setTimeout(
      releaseScroll,
      FALLBACK_MS + FLY_MS + DONE_BUFFER + 1500
    );

    // --- Readiness: real page load + fonts ---------------------------
    // `loaded` also resolves on a timeout so a hung resource can't keep the
    // preloader stuck in "loading" forever (which would never reach "done").
    const loaded = new Promise((res) => {
      if (document.readyState === "complete") return res();
      window.addEventListener("load", () => res(), { once: true });
      window.setTimeout(res, FALLBACK_MS);
    });
    const fonts =
      document.fonts && document.fonts.ready
        ? document.fonts.ready.catch(() => {})
        : Promise.resolve();
    Promise.all([loaded, fonts]).then(() => {
      pageReady = true;
    });

    // --- Fly the loader onto the exact Nav logo box ------------------
    const fly = () => {
      if (triggered) return;
      triggered = true;

      // The loader is leaving and the overlay becomes transparent +
      // pointer-events:none now — free the page immediately rather than
      // waiting for the unmount that may never come.
      releaseScroll();

      const root = rootRef.current;
      const box = boxRef.current;
      const logo = document.querySelector(".nav-logo");
      if (root && box && logo) {
        const b = box.getBoundingClientRect();
        const l = logo.getBoundingClientRect();
        const bcx = b.left + b.width / 2;
        const bcy = b.top + b.height / 2;
        const lcx = l.left + l.width / 2;
        const lcy = l.top + l.height / 2;
        const scale = l.width > 2 && b.width > 2 ? l.width / b.width : 0.32;
        root.style.setProperty("--fly-x", `${Math.round(lcx - bcx)}px`);
        root.style.setProperty("--fly-y", `${Math.round(lcy - bcy)}px`);
        root.style.setProperty("--fly-s", scale.toFixed(4));
      }

      setProgress(100);
      setPhase("fly");
      window.setTimeout(() => setPhase("done"), FLY_MS + DONE_BUFFER);
    };

    // Reduced motion: no clip ride, no flight — just settle out quickly.
    if (prefersReducedMotion) {
      Promise.all([loaded, fonts]).then(() => window.setTimeout(fly, 400));
    } else {
      // Count full loops + detect the end-of-loop white flip.
      const v = videoRef.current;
      const onTime = () => {
        if (!v || triggered) return;
        const t = v.currentTime;
        if (t + 0.05 < lastTime) loops += 1; // wrapped → one loop done
        lastTime = t;

        const dur = v.duration;
        const nearEnd =
          Number.isFinite(dur) && dur > 0 && t >= dur - WHITE_LEAD;
        if (pageReady && loops >= MIN_LOOPS && nearEnd) fly();
      };
      v && v.addEventListener("timeupdate", onTime);

      // Safety net if autoplay/metadata is blocked.
      const fallback = window.setInterval(() => {
        if (triggered) return;
        if (performance.now() - start >= FALLBACK_MS && pageReady) fly();
      }, 200);

      cleanupMotion = () => {
        v && v.removeEventListener("timeupdate", onTime);
        window.clearInterval(fallback);
      };
    }

    // --- Progress hint: eases up while we wait, snaps to 100 on exit -
    const tickProgress = (now) => {
      const elapsed = now - start;
      const timePct = Math.min(1, elapsed / FALLBACK_MS);
      const target = triggered ? 100 : 8 + timePct * 84;
      setProgress((p) => {
        const next = p + (target - p) * 0.1;
        return next > 99.4 ? 100 : next;
      });
      if (!triggered) raf = requestAnimationFrame(tickProgress);
    };
    raf = requestAnimationFrame(tickProgress);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hardRelease);
      releaseScroll();
      if (typeof cleanupMotion === "function") cleanupMotion();
      // Safety: never leave the real logo stuck hidden.
      pageEl && pageEl.classList.remove("v5-logo-hidden");
    };
  }, []);

  // --- Reveal the real logo + release scroll the moment we finish ----
  // Removing the class and unmounting happen in the same React commit, so
  // the static logo appears in the exact spot the loader just vacated —
  // no gap, no double logo: the loader "becomes" the logo.
  useEffect(() => {
    if (phase === "done" && typeof window !== "undefined") {
      const pageEl = document.querySelector(".v5-page");
      pageEl && pageEl.classList.remove("v5-logo-hidden");
      window.scrollTo(0, 0);
    }
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      ref={rootRef}
      className={`v5-preloader is-${phase}`}
      role="status"
      aria-live="polite"
      aria-label="Loading The Motion Agency"
    >
      <div className="v5-preloader-stage">
        <div className="v5-preloader-box" ref={boxRef}>
          <video
            ref={videoRef}
            className="v5-preloader-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/assets/v5/slide8-poster.jpg"
          >
            <source src="/assets/v5/slide8-loop.webm" type="video/webm" />
            <source src="/assets/v5/slide8-loop.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="v5-preloader-progress" aria-hidden="true">
          <div className="v5-preloader-bar">
            <span
              className="v5-preloader-bar-fill"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <span className="v5-preloader-pct">
            {String(Math.round(Math.min(100, progress))).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
