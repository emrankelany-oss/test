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
export function closeProject() {
  openSlug = null;
  emit();
  if (lastTrigger && typeof lastTrigger.focus === "function") {
    try { lastTrigger.focus({ preventScroll: true }); } catch {}
  }
  lastTrigger = null;
}
export function useV23ProjectModal() {
  const slug = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { openSlug: slug, open: openProject, close: closeProject };
}
if (typeof window !== "undefined") window.__v23OpenProject = openProject;
