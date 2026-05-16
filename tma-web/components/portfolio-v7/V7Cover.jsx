"use client";
import { motion } from "framer-motion";
import Paperclip from "./atoms/Paperclip";
import V7Artefact from "./V7Artefact";

export default function V7Cover() {
  return (
    <section className="v7-cover" data-section="v7-cover" aria-label="Field Notes — cover">
      <div className="v7-cover-page">
        <motion.span
          className="v7-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          THE MOTION AGENCY · A FIELD NOTEBOOK
        </motion.span>

        <motion.h1
          className="v7-cover-title"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
        >
          Field Notes
          <span className="v7-cover-title-sub">— Vol. 01</span>
        </motion.h1>

        <motion.p
          className="v7-cover-meta"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
        >
          AMMAN · RIYADH · 2019 — 2025
        </motion.p>

        <div className="v7-cover-clip">
          <div className="v7-cover-polaroid-wrap">
            <Paperclip rotation={-14} size={48} className="v7-cover-paperclip" />
            <V7Artefact
              rotation={-4}
              pin="none"
              width={300}
              className="v7-cover-polaroid"
              ariaLabel="Studio team — Foodics Boundless"
            >
              <div
                className="v7-polaroid"
                style={{ backgroundImage: 'url("/assets/case-foodics-boundless.png")' }}
              />
              <div className="v7-polaroid-caption">studio · 2024</div>
            </V7Artefact>
          </div>
        </div>

        <motion.p
          className="v7-cover-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.8 }}
        >
          turn the page <span aria-hidden="true">↓</span>
        </motion.p>
      </div>
    </section>
  );
}
