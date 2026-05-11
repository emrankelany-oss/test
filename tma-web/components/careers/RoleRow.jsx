"use client";
import { useState } from "react";

export default function RoleRow({ role, onApply }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`role-row ${open ? "open" : ""}`} id={role.id}>
      <button
        className="role-row-head"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="role-row-title">
          <h3>{role.title}</h3>
          <div className="role-row-meta">
            <span>{role.team}</span>
            <span>·</span>
            <span>{role.location}</span>
            <span>·</span>
            <span>{role.type}</span>
          </div>
        </div>
        <div className="role-row-toggle" aria-hidden="true">
          <span className="plus">{open ? "—" : "+"}</span>
          <span className="lbl">{open ? "Close" : "View role"}</span>
        </div>
      </button>

      {open && (
        <div className="role-row-body">
          <div className="role-summary">
            <div className="mono">— About the role</div>
            <p>{role.summary}</p>
          </div>

          <div className="role-cols">
            <div>
              <div className="mono">— What you'll do</div>
              <ul>
                {role.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div>
              <div className="mono">— What we're looking for</div>
              <ul>
                {role.requirements.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>

          <button className="role-apply-cta" onClick={() => onApply(role)}>
            Apply for this role <span>↗</span>
          </button>
        </div>
      )}
    </article>
  );
}
