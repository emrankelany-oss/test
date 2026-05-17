"use client";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { createSceneRegistry } from "./sceneRegistry.js";
import { boundaryState } from "./boundaryState.js";
import { overlayStyle } from "./overlayStyle.js";

const SEAM = 0.18;
const SceneControllerContext = createContext(null);

export function SceneControllerProvider({ children }) {
  const registryRef = useRef(null);
  if (!registryRef.current) registryRef.current = createSceneRegistry();
  const velocityRef = useRef(0);
  const progressRef = useRef(null);
  if (!progressRef.current) progressRef.current = new Map();

  const api = useMemo(
    () => ({
      registry: registryRef.current,
      // Read by the rAF driver below; written by useScene from ScrollTrigger.
      setVelocity(v) {
        velocityRef.current = v;
      },
      getVelocity() {
        return velocityRef.current;
      },
      reportProgress(id, progress) {
        progressRef.current.set(id, progress);
      },
    }),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const overlay = document.querySelector("[data-v14-transition-overlay]");
    if (!overlay) return;

    let raf = 0;
    const tick = () => {
      const entries = registryRef.current.list(); // order-sorted
      const list = entries.map((s) => ({
        id: s.id,
        progress: progressRef.current.get(s.id) ?? 0,
      }));
      const b = boundaryState(list, SEAM);
      if (!b) {
        overlay.style.opacity = "0";
        overlay.style.backdropFilter = "none";
        overlay.style.webkitBackdropFilter = "none";
      } else {
        const fromBleed = entries.find((s) => s.id === b.fromId)?.bleed || "#000";
        const toBleed = entries.find((s) => s.id === b.toId)?.bleed || "#000";
        const s = overlayStyle(b.t, velocityRef.current, fromBleed, toBleed);
        const blur = "blur(" + s.blurPx + "px)";
        overlay.style.backdropFilter = blur;
        overlay.style.webkitBackdropFilter = blur;
        overlay.style.background = s.bleedColor;
        overlay.style.opacity = String(s.opacity * s.bleedAlpha);
        overlay.style.transform = "scale(" + s.scale + ")";
        overlay.style.willChange = "opacity, transform";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <SceneControllerContext.Provider value={api}>
      {children}
      {/* Shared transition overlay — driven by the rAF loop above (SP-2A). */}
      <div
        data-v14-transition-overlay
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 50,
          opacity: 0,
        }}
      />
    </SceneControllerContext.Provider>
  );
}

export function useSceneController() {
  const ctx = useContext(SceneControllerContext);
  if (!ctx) throw new Error("useSceneController must be used within SceneControllerProvider");
  return ctx;
}
