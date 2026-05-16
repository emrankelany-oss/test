"use client";
import { motion } from "framer-motion";

// Logo "sticker" page — every client logo arranged like collected pins
// in a flat-lay journal layout. Each sticker has a deterministic small
// rotation (per index seed) so the page feels handmade but renders
// consistently on SSR vs CSR.

const LOGOS = [
  "abu-kass", "alissar", "arab-bank", "aramco", "bank-of-jordan",
  "buffalo-wild-wings", "burger-king", "cairo-amman-bank", "cyberx",
  "electrolux", "flex", "foodics", "invoiceq", "jadwa", "lsc",
  "ministry-economy", "reflect", "salasa", "shaker-group", "sol",
  "webook", "western-union", "zaintech", "zid",
];

// Tiny deterministic pseudo-random: stable across SSR/CSR.
// Round to 2 decimals so SSR and CSR produce the same transform string
// (Framer Motion's float→string serialization differs subtly between
// the server-rendered HTML and the post-hydration style, which causes
// hydration mismatches when we use raw 15-digit floats).
const seeded = (i) => {
  const v = Math.sin((i + 1) * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};
const round2 = (n) => Math.round(n * 100) / 100;

export default function V7Roster() {
  return (
    <section className="v7-roster" data-section="v7-roster" aria-label="Client roster">
      <div className="v7-roster-page">
        <header className="v7-roster-head">
          <span className="v7-page-tag">SPREAD C</span>
          <h2 className="v7-roster-title">The Roster</h2>
          <p className="v7-roster-sub">
            Stickers we've collected along the way.
            <span className="v7-handwritten-mini"> {LOGOS.length} brands and counting.</span>
          </p>
        </header>

        <div className="v7-roster-grid">
          {LOGOS.map((slug, i) => {
            const rot = round2((seeded(i) - 0.5) * 12); // -6.0 .. +6.0 deg
            const lift = Math.round((seeded(i + 100) - 0.5) * 8); // -4 .. +4 px (int)
            return (
              <motion.div
                key={slug}
                className="v7-sticker"
                initial={{ opacity: 0, y: 12, rotate: round2(rot - 4) }}
                whileInView={{ opacity: 1, y: lift, rotate: rot }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  type: "spring",
                  stiffness: 140,
                  damping: 16,
                  delay: (i % 8) * 0.04,
                }}
                whileHover={{
                  y: lift - 6,
                  rotate: round2(rot - 1),
                  transition: { type: "spring", stiffness: 240, damping: 18 },
                }}
              >
                <img
                  src={`/assets/logos/${slug}.png`}
                  alt={slug.replace(/-/g, " ")}
                  loading="lazy"
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
