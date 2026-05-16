"use client";
import { motion } from "framer-motion";
import Link from "next/link";

// Closing journal page — ruled "what's next?" page that invites the
// reader to write themselves in. The blank line is a button that
// scrolls to / opens the contact CTA below.
export default function V7Closing() {
  return (
    <section className="v7-closing" data-section="v7-closing" aria-label="What's next">
      <div className="v7-closing-page">
        <header className="v7-closing-head">
          <span className="v7-page-tag">FINAL PAGE</span>
          <h2 className="v7-closing-title">What's next?</h2>
        </header>

        <div className="v7-closing-rules" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="v7-rule-line" />
          ))}
        </div>

        <motion.p
          className="v7-closing-hint"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Want to <span className="v7-handwritten">write yourself in?</span>
        </motion.p>

        <Link href="/#contact" className="v7-closing-cta">
          <span>Tell us about your project</span>
          <span aria-hidden="true">→</span>
        </Link>

        <footer className="v7-closing-footer">
          <span>The Motion Agency</span>
          <span>info@themotionagency.net</span>
          <span>Amman · Riyadh</span>
        </footer>
      </div>
    </section>
  );
}
