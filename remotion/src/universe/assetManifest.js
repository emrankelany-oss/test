// Deterministic ordered list of universe panels.
// index 0 is the Foodics hero — the camera-arc's final settle target.
// `file` is the path relative to remotion/public (used with staticFile()).
const LOGOS = [
  "abu-kass", "alissar", "arab-bank", "aramco", "bank-of-jordan",
  "buffalo-wild-wings", "burger-king", "cairo-amman-bank", "cyberx",
  "electrolux", "flex", "foodics", "invoiceq", "jadwa", "lsc",
  "ministry-economy", "reflect", "salasa", "shaker-group", "sol",
  "webook", "western-union", "zaintech", "zid",
];

export const ASSET_MANIFEST = [
  { id: "foodics-hero", kind: "hero", file: "universe/foodics-hero.webp" },
  { id: "zid-hero", kind: "hero", file: "universe/zid-hero.webp" },
  ...LOGOS.map((name) => ({
    id: `logo-${name}`,
    kind: "logo",
    file: `universe/logo-${name}.webp`,
  })),
];
