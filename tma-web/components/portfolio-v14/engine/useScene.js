"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSceneController } from "./SceneController.js";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Registers a pinned scene. `viewports` = scroll length in viewport-heights.
 * `bleed` = the scene's dominant CSS color, used by the transition overlay to
 * color-bleed across the seam (default "#000").
 * onProgress(p, velocity) fires every ScrollTrigger update.
 * Reduced motion: no pin/scrub; fires onProgress(1) and reports progress 1 once.
 */
export function useScene({ id, order, viewports = 4, onProgress, bleed = "#000" }) {
  const controller = useSceneController();
  const elRef = useRef(null);
  const cbRef = useRef(onProgress);
  cbRef.current = onProgress;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const unregister = controller.registry.register({ id, order, el, viewports, bleed });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      cbRef.current?.(1, 0);
      controller.reportProgress(id, 1);
      return () => unregister();
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: `+=${viewports * 100}%`,
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        const v = self.getVelocity();
        controller.setVelocity(v);
        controller.reportProgress(id, self.progress);
        cbRef.current?.(self.progress, v);
      },
    });

    return () => {
      st.kill();
      unregister();
    };
  }, [id, order, viewports, bleed, controller]);

  return elRef;
}
