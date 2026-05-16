"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { opening } from "@/data/portfolio-v12.js";

export default function OpeningSequence() {
  const ref = useRef(null);
  const rise = {
    hidden: { y: "110%" },
    show: (i) => ({ y: "0%", transition: { duration: 1.1, delay: 0.2 + i * 0.5, ease: [0.16, 1, 0.3, 1] } }),
  };
  return (
    <section ref={ref} style={{ minHeight: "180vh" }}>
      <div className="v12-pin" style={{ position: "sticky", top: 0, flexDirection: "column", textAlign: "center" }}>
        <h1 className="v12-h" aria-label={`${opening.line1} ${opening.line2}`}>
          {[opening.line1, opening.line2].map((line, i) => (
            <span key={i} style={{ display: "block", overflow: "hidden" }}>
              <motion.span style={{ display: "block" }} variants={rise} custom={i} initial="hidden" animate="show">
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p
          className="v12-sub"
          style={{ marginTop: "2rem" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 1.6, duration: 1.2 } }}
        >
          {opening.sub}
        </motion.p>
        <motion.div
          aria-hidden="true"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1, transition: { delay: 2.2, duration: 1 } }}
          style={{ marginTop: "3rem", width: 1, height: 64, background: "var(--v12-glow)", transformOrigin: "top" }}
        />
      </div>
    </section>
  );
}
