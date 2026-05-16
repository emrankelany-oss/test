"use client";
import { useRef } from "react";
import { featuredWork } from "@/data/portfolio";
import { useScrollProgress } from "@/lib/useScrollProgress";

export default function V2StackingCards() {
  const ref = useRef(null);
  useScrollProgress(ref, [{ name: "--progress", start: 0, end: 1 }]);

  return (
    <section ref={ref} className="v2-stack" data-section="featuring" id="featured">
      <div className="v2-stack-sticky">
        <div className="v2-stack-header">
          <div className="v2-section-num">
            <span className="dot" />
            05 / Featured work
          </div>
          <h2 className="v2-stack-title">
            Six projects. <span className="ital">One playbook.</span>
          </h2>
        </div>
      </div>

      <div className="v2-stack-track">
        {featuredWork.map((work, i) => (
          <article
            key={work.id}
            className="v2-stack-card"
            style={{ "--i": i }}
          >
            <div className="v2-stack-card-img" style={{ backgroundImage: `url("${work.image}")` }} />
            <div className="v2-stack-card-shade" />
            <div className="v2-stack-card-body">
              <div className="v2-stack-card-meta">
                <span className="v2-stack-card-n">{work.n}</span>
                <span>{work.client}</span>
                <span className="dot">·</span>
                <span>{work.project}</span>
              </div>
              <h3 className="v2-stack-card-title">{work.headline}</h3>
              <div className="v2-stack-card-foot">
                <div className="v2-stack-card-kpi">
                  <span className="v">{work.kpi.v}</span>
                  <span className="l">{work.kpi.l}</span>
                </div>
                <a className="v2-stack-card-cta" href={work.href}>
                  {work.href.startsWith("/case/") ? "Read case study" : "Explore"} <span>↗</span>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
