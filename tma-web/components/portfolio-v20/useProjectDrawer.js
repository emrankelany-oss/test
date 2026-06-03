"use client";

/* Tiny external store for the V20 project drawer. Lets the cursor, the
   tiles, and the drawer share state without a React provider. */

import { useSyncExternalStore } from "react";

let openSlug = null;
let lastTrigger = null;
const listeners = new Set();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => openSlug;
const getServerSnapshot = () => null;

export function useProjectDrawer() {
  const slug = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    openSlug: slug,
    open(nextSlug, triggerEl) {
      lastTrigger = triggerEl || null;
      openSlug = nextSlug;
      emit();
    },
    close() {
      openSlug = null;
      emit();
      // restore focus to whatever opened the drawer
      if (lastTrigger && typeof lastTrigger.focus === "function") {
        try { lastTrigger.focus({ preventScroll: true }); } catch {}
      }
      lastTrigger = null;
    },
  };
}
