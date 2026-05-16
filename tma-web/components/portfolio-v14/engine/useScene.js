"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSceneController } from "./SceneController.js";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Registers a pinned scene. `viewports` = scroll length in viewport-heights.
 * onProgress(p, velocity) is called on every ScrollTrigger update.
 * Reduced motion: no pin/scrub; fires onProgress(1) once so the scene paints
 * its static end state and the page stays a normal scroll document.
 */
export function useScene({ id, order, viewports = 4, onProgress }) {
  const controller = useSceneController();
  const elRef = useRef(null);
  const cbRef = useRef(onProgress);
  cbRef.current = onProgress;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const unregister = controller.registry.register({ id, order, el, viewports });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      cbRef.current?.(1, 0);
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
        cbRef.current?.(self.progress, v);
      },
    });

    return () => {
      st.kill();
      unregister();
    };
  }, [id, order, viewports, controller]);

  return elRef;
}
