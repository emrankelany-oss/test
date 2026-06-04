// V24 content layer — single source of truth for the final version.
// Imports only alias-free data modules so node --test resolves the chain.
import { PROJECTS, PROJECTS_BY_SLUG } from "../portfolio-v20/projects.js";
import { SHOWREEL } from "../portfolio-v22/showreel.js";

export { PROJECTS, PROJECTS_BY_SLUG };

// Agency-level KPIs (deck slide 6). Real numbers, fixed order.
export const AGENCY_STATS = [
  { metric: "178%", label: "Growth" },
  { metric: "30+", label: "Clients" },
  { metric: "500+", label: "Businesses created" },
  { metric: "29+", label: "Team & experience" },
];

// ── Taxonomy ────────────────────────────────────────────────────────────────
// Explicit membership first; anything unlisted is routed by its category string
// in routeUnlisted() so no project is ever dropped.
const EXPLICIT = {
  events: ["foodics-boundless", "zid-ripple"],
  brand: [
    "invoiceq-identity", "transform-identity", "fraed-international",
    "foodics-pay", "foodics-display",
  ],
  social: [
    "sol-brand", "salasa-2034", "lsc-vision-2034", "burger-king-krispier",
    "lg-lifes-good", "vanellis", "buffalo-wild-wings", "avis", "mixy",
    "tawasol", "almarai", "electrolux", "foodics-egypt-ooh",
  ],
  film: [
    "rubicon-exotic", "zaintech-drones", "investcorp-capital",
    "mawani-vision-2030", "world-government-summit",
    "family-development-finance", "sharjah-data-smart-gov", "vodafone-global",
  ],
  digital: ["linc-card"],
};

const META = {
  events: { key: "events", label: "Events & Experiences" },
  brand: { key: "brand", label: "Brand & Identity" },
  social: { key: "social", label: "Social & Campaigns" },
  film: { key: "film", label: "Film, TVC & Animation" },
  digital: { key: "digital", label: "Digital & Product" },
};
const ORDER = ["events", "brand", "social", "film", "digital"];

// Route any project not in EXPLICIT to a bucket using its category string.
function routeUnlisted(project) {
  const c = (project.category || "").toLowerCase();
  if (/event|launch/.test(c)) return "events";
  if (/identity|brand/.test(c)) return "brand";
  if (/social|campaign|ooh/.test(c)) return "social";
  if (/film|tvc|animation|corporate|technology|product film/.test(c)) return "film";
  if (/landing|page|product/.test(c)) return "digital";
  return "social"; // safe default
}

// Build slug→bucket map once, merging explicit + routed.
const BUCKET_OF = (() => {
  const map = {};
  for (const [key, slugs] of Object.entries(EXPLICIT)) {
    for (const s of slugs) if (PROJECTS_BY_SLUG[s]) map[s] = key;
  }
  for (const p of PROJECTS) if (!map[p.slug]) map[p.slug] = routeUnlisted(p);
  return map;
})();

export const CATEGORIES = ORDER.map((key) => META[key]);

// Works in a category, in PROJECTS order (stable, deterministic).
export function worksFor(category) {
  return PROJECTS.filter((p) => BUCKET_OF[p.slug] === category.key);
}

// ── Per-work stats ────────────────────────────────────────────────────────
export function statsFor(project) {
  if (Array.isArray(project.results) && project.results.length) {
    return project.results.slice(0, 4);
  }
  const stats = [];
  if (project.year) stats.push({ metric: project.year, label: "Year" });
  if (project.category) stats.push({ metric: project.category, label: "Discipline" });
  if (Array.isArray(project.services) && project.services.length) {
    stats.push({ metric: String(project.services.length), label: "Services" });
  }
  if (Array.isArray(project.gallery) && project.gallery.length) {
    stats.push({ metric: String(project.gallery.length), label: "Deliverables" });
  }
  return stats;
}

// ── Per-work media ──────────────────────────────────────────────────────────
const REEL_BY_SLUG = Object.fromEntries(SHOWREEL.map((r) => [r.slug, r]));

export function mediaFor(project) {
  const reel = REEL_BY_SLUG[project.slug];
  if (reel && reel.cardVideo) {
    return { type: "video", src: reel.cardVideo, poster: reel.poster || project.hero || project.thumb };
  }
  return { type: "image", src: project.hero || project.thumb };
}

// Description shown on the stats side (deck-sourced).
export function descFor(project) {
  return project.intro || project.tagline || "";
}
