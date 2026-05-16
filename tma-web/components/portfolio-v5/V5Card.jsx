"use client";
import { forwardRef } from "react";
import { motion } from "framer-motion";

/**
 * A single cinematic glass card. Forwarded ref so the parent stage can
 * drive its transform via GSAP scroll scrub. Framer Motion handles the
 * tactile micro-interactions (hover lift, image zoom, glow shift) so they
 * stay decoupled from the scroll timeline.
 */
const V5Card = forwardRef(function V5Card({ item, index }, ref) {
  return (
    <motion.a
      ref={ref}
      href={item.href}
      className="v5-card"
      data-card-index={index}
      style={{ "--card-i": index }}
      initial={false}
      whileHover={{
        y: -6,
        transition: { type: "spring", stiffness: 220, damping: 22 },
      }}
      whileTap={{ scale: 0.985 }}
      aria-label={`${item.client} — ${item.project}`}
    >
      <div className="v5-card-frame">
        <div
          className="v5-card-img"
          style={{ backgroundImage: `url("${item.image}")` }}
          role="img"
        />
        <div className="v5-card-shade" />
        <div className="v5-card-rim" />
        <div className="v5-card-gloss" />

        <div className="v5-card-body">
          <div className="v5-card-top">
            <span className="v5-card-num">{item.n}</span>
            <span className="v5-card-kpi">
              <em>{item.kpi.v}</em>
              <span>{item.kpi.l}</span>
            </span>
          </div>
          <div className="v5-card-bottom">
            <span className="v5-card-client">{item.client}</span>
            <span className="v5-card-title">{item.project}</span>
            <span className="v5-card-headline">{item.headline}</span>
            <ul className="v5-card-tags">
              {item.tags.slice(0, 3).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.a>
  );
});

export default V5Card;
