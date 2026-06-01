"use client";
import { useSyncExternalStore } from "react";

let openSlug = null;
let lastTrigger = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => openSlug;
const getServerSnapshot = () => null;

export function openProject(slug, triggerEl) {
  lastTrigger = triggerEl || null;
  openSlug = slug;
  emit();
}

// Expose at module evaluation time so window.__v22OpenProject is available
// as soon as this chunk executes (before React hydration completes).
// Also drain any queued calls registered by the beforeInteractive stub.
if (typeof window !== "undefined") {
  window.__v22OpenProject = openProject;
  // Flush any calls that arrived before this module loaded.
  const queue = window.__v22OpenProjectQueue;
  if (Array.isArray(queue)) {
    queue.forEach(([slug, el]) => openProject(slug, el));
    window.__v22OpenProjectQueue = null;
  }
}
export function closeProject() {
  openSlug = null;
  emit();
  if (lastTrigger && typeof lastTrigger.focus === "function") {
    try { lastTrigger.focus({ preventScroll: true }); } catch {}
  }
  lastTrigger = null;
}
export function useProjectModal() {
  const slug = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { openSlug: slug, open: openProject, close: closeProject };
}
