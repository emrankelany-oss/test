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

// Exact brand iridescent-glass palette, median-cut quantized straight from the
// official "Fluidity" blob (_slide10_img2.png) — the true vivid colours in the
// order they read across the blob: electric blue → blue → cyan → bright cyan →
// mint → white-yellow highlight → orange → red → deep red → wine/magenta.
export const GALAXY_STOPS = [
  "#042886", "#034B98", "#0368AD", "#168FBB", "#11B2D5", "#10DFEF",
  "#A7E2DC", "#F6F6CE", "#E55D3B", "#E1151E", "#940C1C", "#42132C",
];

// ── Featured deep studies (Foodics / Zid) ───────────────────────────────────
// Built from the real films in SHOWREEL, mirroring portfolio-v23's span/ratio
// rhythm. Featured projects are excluded from the category taxonomy below.
export const FEATURED_SLUGS = ["foodics-boundless", "zid-ripple"];
const FEATURED_SLUG_SET = new Set(FEATURED_SLUGS);

const FEATURED_LAYOUT = {
  "foodics-boundless": [
    { span: 1, ratio: "16 / 9" }, { span: 2, ratio: "4 / 5" }, { span: 2, ratio: "4 / 5" },
    { span: 1, ratio: "16 / 7" }, { span: 2, ratio: "1 / 1" }, { span: 2, ratio: "1 / 1" },
    { span: 1, ratio: "16 / 9" },
  ],
  "zid-ripple": [ { span: 2, ratio: "16 / 10" }, { span: 2, ratio: "16 / 10" } ],
};

function buildFeatured(slug) {
  const project = PROJECTS_BY_SLUG[slug];
  const reel = SHOWREEL.find((r) => r.slug === slug);
  if (!project || !reel) return null;
  const layout = FEATURED_LAYOUT[slug] || [];
  const media = reel.films.map((f, i) => {
    const box = layout[i] || { span: i % 3 === 0 ? 1 : 2, ratio: "4 / 5" };
    if (f.kind === "youtube") {
      return { kind: "youtube", youtubeId: f.youtubeId, href: `https://www.youtube.com/watch?v=${f.youtubeId}`, poster: f.poster, title: f.title, group: f.group, ...box };
    }
    return { kind: "video", src: f.src, poster: f.poster, title: f.title, group: f.group, ...box };
  });
  return { slug, client: project.client, title: project.title, tagline: project.tagline, intro: project.intro, results: project.results || [], solution: project.solution || [], media };
}

export const FEATURED = FEATURED_SLUGS.map(buildFeatured).filter(Boolean);

// ── Taxonomy ────────────────────────────────────────────────────────────────
// Explicit membership first; anything unlisted is routed by its category string
// in routeUnlisted() so no project is ever dropped. Featured studies
// (Foodics / Zid) are skipped entirely and never appear in a category grid.
const EXPLICIT = {
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
  brand: { key: "brand", label: "Brand & Identity" },
  social: { key: "social", label: "Social & Campaigns" },
  film: { key: "film", label: "Film, TVC & Animation" },
  digital: { key: "digital", label: "Digital & Product" },
};
const ORDER = ["brand", "social", "film", "digital"];

// Route any project not in EXPLICIT to a bucket using its category string.
function routeUnlisted(project) {
  const c = (project.category || "").toLowerCase();
  if (/identity|brand/.test(c)) return "brand";
  if (/social|campaign|ooh/.test(c)) return "social";
  if (/film|tvc|animation|corporate|technology|product film/.test(c)) return "film";
  if (/landing|page|product/.test(c)) return "digital";
  return "social"; // safe default
}

// Build slug→bucket map once, merging explicit + routed. Featured slugs are
// skipped so they are never assigned to any category.
const BUCKET_OF = (() => {
  const map = {};
  for (const [key, slugs] of Object.entries(EXPLICIT)) {
    for (const s of slugs) if (PROJECTS_BY_SLUG[s] && !FEATURED_SLUG_SET.has(s)) map[s] = key;
  }
  for (const p of PROJECTS) {
    if (FEATURED_SLUG_SET.has(p.slug)) continue;
    if (!map[p.slug]) map[p.slug] = routeUnlisted(p);
  }
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
    return project.results.slice(0, 4); // featured cases keep their real KPIs
  }
  // Every grid work shows the SAME two universally-present fields, in the same
  // order, so the cards stay uniform (year exists on <half the works; category
  // and services exist on all 27).
  const services = Array.isArray(project.services) ? project.services.length : 0;
  return [
    { metric: project.category || "Creative", label: "Discipline" },
    { metric: services ? String(services) : "—", label: "Services" },
  ];
}

// ── Per-work media ──────────────────────────────────────────────────────────
// Video-aware: projects with a `video` field render a looping video card;
// everything else renders its still.
export function mediaFor(project) {
  if (project.video) {
    return { type: "video", src: project.video, poster: project.hero || project.thumb };
  }
  return { type: "image", src: project.hero || project.thumb };
}
export function hasVideo(project) { return !!project.video; }

// Description shown on the stats side (deck-sourced).
export function descFor(project) {
  return project.intro || project.tagline || "";
}
