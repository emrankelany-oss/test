"use client";
import { useSyncExternalStore } from "react";

let current = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => current;
const getServerSnapshot = () => null;

export function openFilms(data) { current = data; emit(); }
export function closeFilms() { current = null; emit(); }
export function useV24FilmsModal() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { data, open: openFilms, close: closeFilms };
}
if (typeof window !== "undefined") window.__v24OpenFilms = openFilms;
