"use client";
import { useSyncExternalStore } from "react";

let openProjectObj = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => openProjectObj;
const getServerSnapshot = () => null;

export function openV26Project(project) { openProjectObj = project; emit(); }
export function closeV26Project() { openProjectObj = null; emit(); }
export function useV26Modal() {
  const project = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { project, open: openV26Project, close: closeV26Project };
}

if (typeof window !== "undefined") window.__v26OpenProject = openV26Project;
