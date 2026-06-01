"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { PROJECTS_BY_SLUG } from "./projects";
import { useProjectModal } from "./useProjectModal";

export default function V22ProjectModal() {
  const { openSlug, close } = useProjectModal();

  useEffect(() => {
    if (!openSlug) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [openSlug, close]);

  if (!openSlug || typeof document === "undefined") return null;
  const p = PROJECTS_BY_SLUG[openSlug];
  if (!p) return null;

  return createPortal(
    <div className="v22-modal" role="dialog" aria-modal="true" aria-labelledby="v22-modal-heading">
      <button className="v22-modal-scrim" aria-label="Close" onClick={close} />
      <div className="v22-modal-card">
        <button className="v22-modal-close" onClick={close} aria-label="Close project">✕</button>
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
