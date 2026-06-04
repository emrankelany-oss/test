"use client";
import { useMemo, useRef } from "react";
import V24Media from "./V24Media";
import { statsFor, mediaFor, descFor } from "./data";
import { useV24Reveal } from "./useV24Reveal";

// One work: 50% media, 50% stats+description. Even index = media left,
// odd index = media right (alternating cadence down the page).
export default function V24WorkRow({ project, index }) {
  const infoRef = useRef(null);
  const mediaRef = useRef(null);
  useV24Reveal(infoRef);
  useV24Reveal(mediaRef);

  const media = useMemo(() => mediaFor(project), [project]);
  const stats = statsFor(project);
  const mediaRight = index % 2 === 1;

  return (
    <article className={`v24-row${mediaRight ? " media-right" : ""}`}>
      <div ref={mediaRef} className="v24-row-media v24-rv">
        <V24Media media={media} title={`${project.client} — ${project.title}`} />
      </div>
      <div ref={infoRef} className="v24-row-info v24-rv">
        <span className="v24-row-client">{project.client}</span>
        <h3 className="v24-row-title">{project.title}</h3>
        <p className="v24-row-desc">{descFor(project)}</p>
        <dl className="v24-row-stats">
          {stats.map((s, i) => (
            <div key={i} className="v24-rs">
              <dd className="v24-rs-metric">{s.metric}</dd>
              <dt className="v24-rs-label">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
