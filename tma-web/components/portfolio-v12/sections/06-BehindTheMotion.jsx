"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { studioProcess } from "@/data/portfolio-v12.js";

export default function BehindTheMotion() {
  return (
    <section aria-label="Behind the Motion" style={{ padding: "16vh 6vw" }}>
      <h2 className="v12-h" style={{ marginBottom: "6vh" }}>Behind the motion</h2>
      <div style={{ display: "grid", gap: "10vh" }}>
        {studioProcess.map((p, i) => (
          <motion.div
            key={p.phase}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4vw", alignItems: "center", direction: i % 2 ? "rtl" : "ltr" }}
          >
            <div style={{ direction: "ltr", position: "relative", aspectRatio: "16/10" }}>
              <Image src={p.image} alt={p.phase} fill style={{ objectFit: "cover" }} sizes="50vw" />
            </div>
            <div style={{ direction: "ltr" }}>
              <h3 className="v12-h" style={{ fontSize: "clamp(1.5rem,4vw,3rem)" }}>{p.phase}</h3>
              <p className="v12-sub">{p.copy}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
