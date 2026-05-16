"use client";

import { motion } from "framer-motion";
import { cta, contact } from "@/data/portfolio-v12.js";

export default function FinalCTA() {
  return (
    <section aria-label="Initiate project" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 6vw", gap: "2.5rem" }}>
      <motion.h2 className="v12-h" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}>
        {cta.kicker}
      </motion.h2>
      <motion.a
        href={`mailto:${contact.email}`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.8 }}
        style={{ border: "1px solid var(--v12-glow)", color: "var(--v12-white)", padding: "1.1rem 2.4rem", borderRadius: 999, letterSpacing: ".22em", textDecoration: "none", fontSize: ".9rem" }}
      >
        {cta.button}
      </motion.a>
      <footer className="v12-sub" style={{ maxWidth: "none", marginTop: "4rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "2rem", width: "100%", textAlign: "left" }}>
        {contact.offices.map((o) => (
          <div key={o.city}>
            <strong style={{ color: "var(--v12-white)" }}>{o.city}</strong>
            <div>{o.address}</div>
            <div>{o.tel}</div>
          </div>
        ))}
        <div>
          <a href={`mailto:${contact.email}`} style={{ color: "var(--v12-silver)" }}>{contact.email}</a>
          <div>{contact.site}</div>
        </div>
      </footer>
    </section>
  );
}
