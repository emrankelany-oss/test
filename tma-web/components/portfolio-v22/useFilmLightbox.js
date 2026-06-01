"use client";
import { useSyncExternalStore } from "react";

let openFilmObj = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => openFilmObj;
const getServerSnapshot = () => null;

export function openFilm(film) { openFilmObj = film; emit(); }
export function closeFilm() { openFilmObj = null; emit(); }
export function useFilmLightbox() {
  const film = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { film, open: openFilm, close: closeFilm };
}
// test/debug affordance, same pattern as the project modal
if (typeof window !== "undefined") window.__v22OpenFilm = openFilm;
