"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Clim "tLine" line reveal: split a heading/paragraph into lines and slide each
 * up from y:50%→0% with a 0.15s stagger (×0.8 when >4 lines), expo.out.
 */
export function useLineReveal(ref, { start = "top 85%", y = "50%" } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    let split;
    const ctx = gsap.context(() => {
      split = new SplitText(el, { type: "lines", linesClass: "line" });
      // wrap each line so overflow:hidden clips the slide-in
      const lines = split.lines;
      const scale = lines.length > 4 ? 0.8 : 1;
      gsap.set(lines, { yPercent: parseFloat(y), opacity: 0 });
      gsap.to(lines, {
        yPercent: 0,
        opacity: 1,
        duration: 0.8 * scale,
        ease: "expo.out",
        stagger: 0.15 * scale,
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);
    return () => {
      split && split.revert();
      ctx.revert();
    };
  }, [ref, start, y]);
}

/**
 * Clim iris media reveal: animate CSS var --mask 0%→75% so the
 * clip-path: ellipse(var(--mask) var(--mask)) irises open as it enters view.
 */
export function useIrisReveal(ref, { start = "top 85%", to = 75 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced()) {
      el.style.setProperty("--mask", `${to}%`);
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { "--mask": "0%" },
        {
          "--mask": `${to}%`,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start, once: true },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [ref, start, to]);
}

/**
 * Lazy-autoplay every `video[data-lazy]` inside the container: load + play only
 * while on-screen, pause off-screen. No-op under reduced motion.
 */
export function useLazyAutoplayVideos(containerRef) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    if (reduced()) return;
    const vids = Array.from(root.querySelectorAll("video[data-lazy]"));
    if (!vids.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          const v = en.target;
          if (en.isIntersecting) {
            if (!v.src && v.dataset.src) v.src = v.dataset.src;
            v.play?.().catch(() => {});
          } else {
            v.pause?.();
          }
        });
      },
      { rootMargin: "200px 0px" }
    );
    vids.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [containerRef]);
}

/**
 * Reveal a group of media nodes (querySelector inside `containerRef`). Each
 * matching `.v23-im` iris-opens on its own ScrollTrigger.
 */
export function useIrisRevealAll(containerRef, selector = ".v23-im") {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll(selector));
    if (reduced()) {
      nodes.forEach((n) => n.style.setProperty("--mask", "75%"));
      return;
    }
    const ctx = gsap.context(() => {
      nodes.forEach((n) => {
        gsap.fromTo(
          n,
          { "--mask": "0%" },
          {
            "--mask": "75%",
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: n, start: "top 88%", once: true },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, [containerRef, selector]);
}
