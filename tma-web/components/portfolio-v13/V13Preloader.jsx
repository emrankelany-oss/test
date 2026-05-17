"use client";
import { useEffect, useRef, useState } from "react";

/**
 * V13 opening preloader.
 *
 * Reuses the V5 slide-8 wordmark clip (a light mark on black with a brief
 * white inversion near the end). We keep ONLY the black-background
 * section: a hidden canvas samples each frame's average luminance every
 * rAF; the instant it rises clearly above the learned black-section
 * baseline (the white flip approaching) we snap currentTime back to 0 — so
 * the white is never shown and the black loop is perpetual and seamless.
 *
 * No flight, no nav-logo handoff (nothing else of V13 exists yet): once
 * the page is ready AND a couple of black loops have run, the overlay
 * fades out and unmounts to reveal the page.
 *
 * Scroll is held at the top via capture-phase input blockers (not
 * `overflow:hidden`), released on every exit path + a hard safety cap.
 *
 * Source asset (reused as-is): /assets/v5/slide8-loop.{webm,mp4}
 */
const MIN_LOOPS = 2; // full black loops before we're allowed to exit
const MIN_VISIBLE_MS = 3000; // floor on-screen time so the loop reads as a hook
const FALLBACK_MS = 6000; // hard cap if metadata/autoplay detection fails
const FADE_MS = 600; // keep in sync with CSS .is-out opacity transition
// Measured from the asset (slide8-loop): duration 2.25s, pure black until
// ~1.8s, where a white inversion ramps (≈0.44 → 0.83) and holds to the
// end. We loop a FIXED window [0, LOOP_END_SEC] driven by a TIMER (not
// rAF/rVFC — those are frame-coupled and get throttled to a few calls/sec
// here, skipping straight past the cut into the white). 1.55s leaves a
// 0.25s margin before the white so even a throttled timer wraps in time.
// If this asset is ever swapped, re-measure and update this.
const LOOP_END_SEC = 1.55;
const POLL_MS = 40; // wrap-check cadence (timer, throttle-resistant)
const SAMPLE_W = 32; // luminance sample canvas size (telemetry only)
const SAMPLE_H = 18;
// Belt-and-suspenders: if currentTime ever runs past the window without
// our wrap taking effect, a frame brighter than this forces a wrap. Raw
// black ≤0.09, white ramp ≥0.39 — 0.30 cleanly separates them.
const LUMA_ABS = 0.3;

export default function V13Preloader() {
  // SSR + first paint render the overlay so the page never flashes first.
  const [phase, setPhase] = useState("loading"); // loading → out → done
  const [progress, setProgress] = useState(0);
  const rootRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

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
      const keys = [
        " ",
        "PageDown",
        "PageUp",
        "Home",
        "End",
        "ArrowDown",
        "ArrowUp",
      ];
      if (keys.includes(e.key)) block(e);
    };
    window.addEventListener("keydown", keyBlock, true);

    // Idempotent scroll-lock release, called from every path that should
    // free the page: on exit, the hard safety cap, and unmount cleanup.
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
    let cleanupMotion = null;
    const start = performance.now();

    // Absolute safety net: the page can never stay scroll-locked past this.
    const hardRelease = window.setTimeout(
      releaseScroll,
      FALLBACK_MS + FADE_MS + 1500
    );

    // --- Readiness: real page load + fonts ---------------------------
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

    // --- Exit: fade the overlay out, then unmount --------------------
    const exit = () => {
      if (triggered) return;
      triggered = true;
      releaseScroll();
      setProgress(100);
      setPhase("out");
      window.setTimeout(() => setPhase("done"), FADE_MS + 60);
    };

    // Reduced motion: no clip ride — settle out quickly once ready.
    if (prefersReducedMotion) {
      Promise.all([loaded, fonts]).then(() =>
        window.setTimeout(() => exit("reduced-motion"), 400)
      );
    } else {
      // --- Deterministic black-only loop -----------------------------
      // We loop a FIXED window [0, LOOP_END_SEC]: a timer polls
      // currentTime and wraps to 0 before the white tail can paint. We
      // drive play() ourselves from frame 0 and only reveal the clip once
      // the loop is armed — so the white never shows, not even on loop
      // one. Luma is telemetry + belt-and-suspenders only.
      const v = videoRef.current;
      const cvs = document.createElement("canvas");
      cvs.width = SAMPLE_W;
      cvs.height = SAMPLE_H;
      const cx = cvs.getContext("2d", { willReadFrequently: true });

      let armed = false; // clip revealed + loop running
      let seeking = false; // true between our wrap and its "seeked"

      const onSeeked = () => {
        seeking = false;
      };
      v && v.addEventListener("seeked", onSeeked);

      // Luma of the current frame. Records maxLuma ONLY for frames the
      // user can actually see (armed, not mid-seek) so the metric is a
      // faithful "did white ever paint" proxy.
      const sampleLuma = () => {
        try {
          cx.drawImage(v, 0, 0, SAMPLE_W, SAMPLE_H);
          const data = cx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;
          let sum = 0;
          for (let i = 0; i < data.length; i += 4) {
            sum +=
              0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          }
          const L = sum / (data.length / 4) / 255;
          if (armed && !seeking && L > tel.maxLuma) {
            tel.maxLuma = +L.toFixed(3);
          }
          if (armed && !seeking && L > 0.3) {
            tel.diag.whiteHits.push({
              ct: +(v.currentTime || 0).toFixed(3),
              L: +L.toFixed(3),
            });
          }
          return L;
        } catch {
          return null;
        }
      };

      const wrap = () => {
        seeking = true;
        tel.diag.wrapsAt.push(+(v.currentTime || 0).toFixed(3));
        v.currentTime = 0;
        loops += 1;
        tel.loops = loops;
        if (
          pageReady &&
          loops >= MIN_LOOPS &&
          performance.now() - start >= MIN_VISIBLE_MS
        ) {
          exit("loops");
          return true;
        }
        return false;
      };

      // Timer-driven wrap check (NOT frame-coupled — survives the rVFC/rAF
      // throttling that let currentTime jump past the cut into the white).
      let loopTimer = 0;
      const check = () => {
        if (triggered) {
          window.clearInterval(loopTimer);
          return;
        }
        if (v && v.readyState >= 2) {
          const ct = v.currentTime || 0;
          tel.diag.frames += 1;
          if (armed && !seeking) {
            const step = ct - tel.diag.lastCt;
            if (step > tel.diag.biggestStep)
              tel.diag.biggestStep = +step.toFixed(3);
            if (ct > tel.diag.maxCtArmed) tel.diag.maxCtArmed = +ct.toFixed(3);
          }
          tel.diag.lastCt = ct;
          const L = sampleLuma();
          if (!seeking && ct >= LOOP_END_SEC) {
            wrap(); // primary — fixed-time wrap
          } else if (!seeking && L != null && L > LUMA_ABS) {
            wrap(); // belt — frame brighter than black
          }
        }
      };

      // Drive playback ourselves from frame 0, reveal, then poll.
      const startLoop = () => {
        try {
          v.currentTime = 0;
        } catch {}
        rootRef.current && rootRef.current.classList.add("is-armed");
        armed = true;
        v.play().catch(() => {});
        loopTimer = window.setInterval(check, POLL_MS);
      };

      // Start as soon as the clip can render a frame (readyState ≥ 2).
      let canPlayListener = null;
      if (v && v.readyState >= 2) {
        startLoop();
      } else if (v) {
        canPlayListener = () => {
          v.removeEventListener("loadeddata", canPlayListener);
          v.removeEventListener("canplay", canPlayListener);
          canPlayListener = null;
          if (!triggered) startLoop();
        };
        v.addEventListener("loadeddata", canPlayListener);
        v.addEventListener("canplay", canPlayListener);
        // If it never becomes ready, still try (the fallback timer will
        // exit the preloader if playback truly never starts).
        window.setTimeout(() => {
          if (canPlayListener && !triggered) {
            v.removeEventListener("loadeddata", canPlayListener);
            v.removeEventListener("canplay", canPlayListener);
            canPlayListener = null;
            startLoop();
          }
        }, 1500);
      }

      // Safety net if autoplay / sampling is blocked entirely.
      const fallback = window.setInterval(() => {
        if (triggered) return;
        if (performance.now() - start >= FALLBACK_MS && pageReady)
          exit("fallback");
      }, 200);

      cleanupMotion = () => {
        window.clearInterval(loopTimer);
        window.clearInterval(fallback);
        v && v.removeEventListener("seeked", onSeeked);
        if (canPlayListener) {
          v.removeEventListener("loadeddata", canPlayListener);
          v.removeEventListener("canplay", canPlayListener);
        }
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
    };
  }, []);

  useEffect(() => {
    if (phase === "done" && typeof window !== "undefined" && window.__v13pl) {
      window.__v13pl.doneAt = Date.now();
    }
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      ref={rootRef}
      className={`v13-preloader is-${phase}`}
      role="status"
      aria-live="polite"
      aria-label="Loading The Motion Agency"
    >
      <div className="v13-preloader-stage">
        <div className="v13-preloader-box">
          <video
            ref={videoRef}
            className="v13-preloader-video"
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/assets/v5/slide8-loop.webm" type="video/webm" />
            <source src="/assets/v5/slide8-loop.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="v13-preloader-progress" aria-hidden="true">
          <div className="v13-preloader-bar">
            <span
              className="v13-preloader-bar-fill"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <span className="v13-preloader-pct">
            {String(Math.round(Math.min(100, progress))).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
