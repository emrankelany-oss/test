"use client";

// Museum-card label stamped on every image and used as the POV-anchor
// caption. `■ CLIENT · PROJECT · YEAR`. Keep it terse — it earns
// editorial credibility at near-zero cost.

export default function Placard({ items = [], className = "" }) {
  const parts = items.filter(Boolean);
  if (!parts.length) return null;
  return (
    <span className={`v11-placard ${className}`} aria-hidden="true">
      <span className="v11-placard-sq" />
      {parts.map((p, i) => (
        <span key={i} className="v11-placard-seg">
          {i > 0 && <span className="v11-placard-dot">·</span>}
          {p}
        </span>
      ))}
    </span>
  );
}
