"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { PROJECTS_BY_SLUG } from "./projects";
import { useProjectModal } from "./useProjectModal";

export default function V22ProjectModal() {
  const { openSlug, close } = useProjectModal();
  const closeBtnRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!openSlug) return;

    // Focus the close button as soon as the modal is open
    closeBtnRef.current?.focus();

    const getFocusable = () =>
      cardRef.current
        ? Array.from(
            cardRef.current.querySelectorAll(
              'button, a[href], [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.disabled)
        : [];

    const onKey = (e) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Tab") {
        const focusable = getFocusable();
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openSlug, close]);

  if (!openSlug || typeof document === "undefined") return null;
  const p = PROJECTS_BY_SLUG[openSlug];
  if (!p) return null;

  return createPortal(
    <div className="v22-modal" role="dialog" aria-modal="true" aria-labelledby="v22-modal-heading">
      <button className="v22-modal-scrim" aria-label="Close" onClick={close} />
      <div ref={cardRef} className="v22-modal-card">
        <button ref={closeBtnRef} className="v22-modal-close" onClick={close} aria-label="Close project">✕</button>
        <p className="v22-eyebrow">{p.client} · {p.category}</p>
        <h2 id="v22-modal-heading" className="v22-modal-title">{p.title}</h2>
        {p.tagline ? <p className="v22-modal-tagline">{p.tagline}</p> : null}
        {p.intro ? <p className="v22-modal-intro">{p.intro}</p> : null}
        {Array.isArray(p.services) && p.services.length ? (
          <ul className="v22-modal-services">
            {p.services.map((s) => <li key={s}>{s}</li>)}
          </ul>
        ) : null}
        {Array.isArray(p.results) && p.results.length ? (
          <div className="v22-modal-results">
            {p.results.map((r) => (
              <div key={r.label} className="v22-modal-result">
                <span className="v22-modal-metric">{r.metric}</span>
                <span className="v22-modal-metric-label">{r.label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
