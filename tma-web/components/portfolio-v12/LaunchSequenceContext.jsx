"use client";

import { createContext, useContext, useRef, useCallback, useSyncExternalStore } from "react";
import { phaseFor } from "./phase.js";

const Ctx = createContext(null);

export function LaunchSequenceProvider({ children }) {
  const progress = useRef(0);
  const phase = useRef("ignition");
  const subs = useRef(new Set());

  const setProgress = useCallback((p) => {
    progress.current = p;
    const next = phaseFor(p);
    const phaseChanged = next !== phase.current;
    phase.current = next;
    for (const fn of subs.current) fn(phaseChanged);
  }, []);

  const subscribe = useCallback((fn) => {
    subs.current.add(fn);
    return () => subs.current.delete(fn);
  }, []);

  const getProgress = useCallback(() => progress.current, []);
  const getPhase = useCallback(() => phase.current, []);

  return (
    <Ctx.Provider value={{ setProgress, subscribe, getProgress, getPhase }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLaunchStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLaunchStore must be used within LaunchSequenceProvider");
  return v;
}

// Re-renders only when the phase string changes.
export function useLaunchPhase() {
  const { subscribe, getPhase } = useLaunchStore();
  return useSyncExternalStore(
    (cb) => subscribe((phaseChanged) => phaseChanged && cb()),
    getPhase,
    () => "ignition"
  );
}

// Imperative progress reader for rAF loops (no re-render).
export function useLaunchProgressRef() {
  const { subscribe, getProgress } = useLaunchStore();
  return { subscribe, getProgress };
}
