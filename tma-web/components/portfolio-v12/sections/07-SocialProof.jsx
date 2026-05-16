"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { clients, manifestoQuote, stats } from "@/data/portfolio-v12.js";

export default function SocialProof() {
  return (
    <section aria-label="Clients and manifesto" style={{ padding: "16vh 6vw" }}>
      <motion.blockquote
        className="v12-h"
        style={{ fontSize: "clamp(1.8rem,4.5vw,4rem)", maxWidth: "20ch", margin: "0 0 12vh" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        {manifestoQuote}
      </motion.blockquote>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: "1.5rem", marginBottom: "12vh" }}>
        {clients.map((src, i) => (
          <motion.div
            key={src}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 0.65, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 8) * 0.05, duration: 0.6 }}
            style={{ position: "relative", aspectRatio: "3/2", filter: "grayscale(1) brightness(1.6)" }}
          >
            <Image src={src} alt="" fill style={{ objectFit: "contain" }} sizes="120px" />
          </motion.div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "2rem" }}>
        {stats.map((s) => (
          <div key={s.label}>
            <div className="v12-h" style={{ fontSize: "clamp(2.5rem,6vw,5rem)" }}>{s.value}</div>
            <div className="v12-sub" style={{ textTransform: "uppercase", letterSpacing: ".15em" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
