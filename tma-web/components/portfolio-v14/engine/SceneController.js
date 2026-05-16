"use client";
import { createContext, useContext, useMemo, useRef } from "react";
import { createSceneRegistry } from "./sceneRegistry.js";

const SceneControllerContext = createContext(null);

export function SceneControllerProvider({ children }) {
  const registryRef = useRef(null);
  if (!registryRef.current) registryRef.current = createSceneRegistry();
  const velocityRef = useRef(0);

  const api = useMemo(
    () => ({
      registry: registryRef.current,
      // Read by scenes/transitions; updated by useScene from ScrollTrigger.getVelocity().
      setVelocity(v) {
        velocityRef.current = v;
      },
      getVelocity() {
        return velocityRef.current;
      },
    }),
    []
  );

  return (
    <SceneControllerContext.Provider value={api}>
      {children}
      {/* Shared transition overlay: a single fixed layer scenes draw boundary
          effects into. SP-0 ships the mount point; primitives from
          transitions.js are blended here in SP-4. */}
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
