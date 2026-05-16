"use client";

import { DeepChapter, MidChapter } from "../ProjectChapter.jsx";
import { deepCases, midCases } from "@/data/portfolio-v12.js";

export default function FeaturedProjects() {
  return (
    <section aria-label="Featured Projects">
      {deepCases.map((c) => (
        <DeepChapter key={c.id} data={c} />
      ))}
      {midCases.map((m) => (
        <MidChapter key={m.id} data={m} />
      ))}
    </section>
  );
}
