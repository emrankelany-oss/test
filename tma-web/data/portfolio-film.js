// V6 "Origin Film" narrative data.
//
// Every quote / bullet / stat is sourced from the agency's deck — see
// the project's auto-memory `tma_portfolio_deck.md`. Do not invent copy
// here; if a piece of narrative isn't in the deck, omit it.

export const filmOpening = {
  // The cold-open line types out word by word. Counter ticks below it.
  line: "Eight thousand restaurants. One vision.",
  counter: { from: 8000, to: 32000, suffix: "+" },
  subtitle: "A film in four parts.",
};

export const filmTitleCard = {
  title: "Cases worth telling.",
  subtitle: "A film in four parts.",
  markers: [
    { kind: "EP", n: "01", label: "Foodics" },
    { kind: "EP", n: "02", label: "Zid" },
    { kind: "SHORT", n: "—", label: "Vancouver" },
    { kind: "SHORT", n: "—", label: "InvoiceQ" },
  ],
};

export const filmEpisodes = [
  {
    id: "ep-foodics-boundless",
    n: "01",
    client: "Foodics",
    project: "Boundless 22 · 23",
    poster: "/assets/case-foodics-boundless.png",
    tagline: "From POS provider to $1B unicorn.",
    acts: {
      problem: {
        kicker: "Act I — The problem",
        quote: "Perceived as just a POS system.",
        bullets: [
          "Foodics was evolving from POS provider to complete F&B growth platform — payments, lending, data, marketplaces.",
          "Market still perceived them as just a POS system.",
          "Thousands of restaurant owners needed educating about the new tools.",
          "Competition was tightening in Saudi and beyond.",
        ],
        plate: "/assets/case-foodics-boundless.png",
      },
      idea: {
        kicker: "Act II — The idea",
        quote: "Build the stage that re-defines the category.",
        bullets: [
          "Created a flagship annual stage — Boundless — to position Foodics as the authority shaping the future of F&B tech.",
          "Crafted end-to-end event narratives showing how Foodics solves merchant problems — from payments (Foodics Pay) to financing (Foodics Capital) to scaling via Marketplace.",
          "Designed experiences that educated and excited: live demos, case studies, data insights, launches that made complex products feel essential.",
        ],
        parallax: [
          "/assets/portfolio/slide-50.jpg",
          "/assets/portfolio/slide-32.jpg",
          "/assets/portfolio/slide-44.jpg",
        ],
      },
      result: {
        kicker: "Act III — The result",
        quote: "From POS provider to $1B unicorn.",
        stats: [
          { from: 15.4, to: 20.8, prefix: "$", suffix: "M", label: "Revenue 2023 → 2024", decimals: 1 },
          { from: 8000, to: 32000, suffix: "+", label: "Merchants on platform" },
          { from: 0, to: 35, suffix: "%", label: "Saudi market share" },
        ],
        closing: "Post-Boundless, Foodics is no longer the POS provider — it's the growth engine for F&B.",
      },
    },
  },
  {
    id: "ep-zid-ripple",
    n: "02",
    client: "Zid",
    project: "Ripple 2024",
    poster: "/assets/case-zid-ripple.png",
    tagline: "Launching the Total Commerce era.",
    acts: {
      problem: {
        kicker: "Act I — The problem",
        quote: "Fragmented systems. Scale barriers. A perception gap.",
        bullets: [
          "Merchants struggled to juggle separate tools for e-commerce, social channels, and physical outlets.",
          "Logistical inefficiencies and disconnected marketing limited merchant growth.",
          "Zid needed to be the unified, future-ready commerce partner — not just a storefront builder.",
        ],
        plate: "/assets/case-zid-ripple.png",
      },
      idea: {
        kicker: "Act II — The idea",
        quote: "Launch one stage. Launch one platform. Launch one era.",
        bullets: [
          "Launched Total Commerce as Zid's core product — a seamless ecosystem for e-commerce, social, and offline retail.",
          "Hosted the flagship Ripple event in Diriyah with 1,000+ merchants, industry leaders, and government figures.",
          "Showcased a unified dashboard plus cross-border logistics — manage inventory, fulfillment, and ops from one interface.",
          "Revealed AI-powered marketing and integrations: TikTok, Amazon, Snapchat, Meta, plus predictive analytics.",
        ],
        parallax: [
          "/assets/portfolio/slide-31.jpg",
          "/assets/portfolio/slide-30.jpg",
          "/assets/portfolio/slide-74.jpg",
        ],
      },
      result: {
        kicker: "Act III — The result",
        quote: "From storefront builder to Total Commerce platform.",
        stats: [
          { from: 0, to: 200, suffix: "%", label: "YoY growth" },
          { from: 8000, to: 12000, suffix: "+", label: "Active merchants in 2024" },
          { from: 0, to: 50, suffix: "%", label: "Basket size + conversion lift" },
        ],
        closing: "Cross-border frameworks (Trendyol, Noon, Amazon) set the stage for Gulf-wide scale.",
      },
    },
  },
];

export const filmShorts = [
  {
    id: "short-vancouver",
    label: "Short film",
    client: "Foodics",
    project: "Vancouver Canada — TVC + OOH",
    poster: "/assets/portfolio/slide-65.jpg",
    tagline: "فودكس .. أساس مطعمك السيستم",
    taglineEn: "Foodics — your restaurant's system foundation.",
    blurb: "A two-spot TVC anchored on a Vancouver-cafe aesthetic, plus a full OOH wave across Riyadh.",
    frames: [
      "/assets/portfolio/slide-64.jpg",
      "/assets/portfolio/slide-66.jpg",
      "/assets/portfolio/slide-67.jpg",
      "/assets/portfolio/slide-65.jpg",
    ],
    closing: "Since I installed Foodics, everything has been running in order.",
  },
  {
    id: "short-invoiceq",
    label: "Short film",
    client: "InvoiceQ",
    project: "Brand Identity v1.0",
    poster: "/assets/portfolio/slide-34.jpg",
    tagline: "More practical, consistent, dynamic.",
    blurb: "A complete brand system for a B2B SaaS launch — logo, palette, typography, app UI mockups.",
    frames: [
      "/assets/portfolio/slide-34.jpg",
    ],
    palette: ["#0E1F47", "#00B0E6", "#0B0F1A", "#F5F7FB"],
    closing: "From naming convention to app icon to product UI — one cohesive launch.",
  },
  // ---------------------------------------------------------------
  // SCAFFOLDED — copy not yet sourced from the deck.
  // Replace every [TODO] string with verbatim deck copy before ship.
  // Client/project/imagery are factual (sourced from data/portfolio.js
  // gallery), so the scaffold is structurally valid for the renderer
  // and dev preview. Renderer should skip a short if any non-image
  // field still starts with "[TODO]".
  // ---------------------------------------------------------------
  {
    id: "short-salasa",
    label: "Short film",
    client: "Salasa",
    project: "Fulfilled.",
    poster: "/assets/portfolio/slide-37.jpg",
    tagline: "[TODO: tagline from deck — Salasa positioning]",
    blurb: "[TODO: 1-2 sentence blurb covering World Cup 2034 host-nation campaign + 25+ Shipping Partners social system]",
    frames: [
      "/assets/portfolio/slide-37.jpg",
      "/assets/portfolio/slide-38.jpg",
    ],
    closing: "[TODO: one-line closing — what the work proved for Salasa]",
  },
  {
    id: "short-lsc",
    label: "Short film",
    client: "LSC",
    project: "Sector Positioning",
    poster: "/assets/portfolio/slide-39.jpg",
    tagline: "[TODO: tagline from deck — LSC positioning]",
    blurb: "[TODO: 1-2 sentence blurb covering AI shipping launch, Ramadan campaign, WCA Dubai team activation]",
    frames: [
      "/assets/portfolio/slide-39.jpg",
      "/assets/portfolio/slide-40.jpg",
    ],
    closing: "[TODO: one-line closing — what the work proved for LSC]",
  },
];

export const filmInterludes = {
  betweenEpisodes: "Same playbook. Different industry.",
  beforeShorts: "Cut to the studio floor.",
  beforeBRoll: "And there's more.",
};

export const filmCredits = {
  title: "And 39 others from the studio floor.",
  subtitle: "B-roll, cutting-room favourites, and the work that didn't fit in two acts.",
  rolesRoll: [
    { role: "Brand Strategy", by: "TMA" },
    { role: "Brand Design", by: "TMA" },
    { role: "Go-to-Market", by: "TMA" },
    { role: "Growth Marketing", by: "TMA" },
    { role: "Event & Experience", by: "TMA" },
    { role: "Product Marketing", by: "TMA" },
    { role: "Social & Community", by: "TMA" },
    { role: "Content & Production", by: "TMA" },
  ],
};
