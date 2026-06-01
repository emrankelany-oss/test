// V22 sources its content from the shared v20 roster — single source of truth.
import { PROJECTS, PROJECTS_BY_SLUG } from "@/components/portfolio-v20/projects";

export { PROJECTS, PROJECTS_BY_SLUG };

// Curated lead set for the Featured section: the deep case studies first,
// then a few high-recognition brands.
const FEATURED_EXTRA = ["burger-king-krispier", "lg-lifes-good", "vodafone-global"];
export const FEATURED = [
  ...PROJECTS.filter((p) => p.deep),
  ...FEATURED_EXTRA.map((s) => PROJECTS_BY_SLUG[s]).filter(Boolean),
];

export const CAPABILITIES = [
  {
    key: "creativity",
    title: "Creativity",
    body: "Strategy-first concepts that turn category noise into bold, ownable stories.",
  },
  {
    key: "collaboration",
    title: "Collaboration",
    body: "We embed with your team end-to-end — from the core idea to final delivery.",
  },
  {
    key: "craftsmanship",
    title: "Craftsmanship",
    body: "Motion, design and production crafted to a standard that earns attention.",
  },
];

// Numeric values kept separate from formatting so V22Impact can count up.
export const IMPACT = [
  { value: 35.6, prefix: "+", suffix: "%", label: "Revenue YoY (Foodics 2023→2024)" },
  { value: 32000, prefix: "", suffix: "+", label: "Merchants onboarded" },
  { value: 1, prefix: "$", suffix: "B", label: "Unicorn valuation reached" },
  { value: 35, prefix: "", suffix: "%", label: "Saudi market share" },
];
