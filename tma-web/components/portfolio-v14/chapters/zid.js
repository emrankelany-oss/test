export const zid = {
  id: "zid",
  order: 50,
  viewports: 6,
  bleed: "#04141c",
  accent: "#4ED1C5",
  image: "/assets/case-zid-ripple.png",
  plan: {
    acts: [
      { id: "hook", weight: 0.15 },
      { id: "problem", weight: 0.27 },
      { id: "solution", weight: 0.3 },
      { id: "results", weight: 0.28 },
    ],
    inFrac: 0.2,
    outFrac: 0.2,
  },
  acts: [
    {
      id: "hook",
      kind: "hook",
      label: "ZID · RIPPLE 2024",
      headline: "Ripple: Launching the Total Commerce Era",
    },
    {
      id: "problem",
      kind: "problem",
      label: "THE PROBLEM",
      body: [
        "Fragmented systems — merchants juggled separate tools for e-commerce, social, and physical retail.",
        "Scale barriers — logistical inefficiencies and disconnected marketing capped growth.",
        "Perception gap — Zid needed to be the unified, future-ready commerce partner, not just a storefront builder.",
      ],
    },
    {
      id: "solution",
      kind: "solution",
      label: "WHAT WE DID",
      body: [
        "Launched Total Commerce — one ecosystem for e-commerce, social, and offline retail.",
        "Hosted the flagship Ripple event in Diriyah with 1,000+ merchants and industry leaders.",
        "Showcased a unified dashboard and cross-border logistics from one interface.",
        "Revealed AI-powered marketing and integrations — TikTok, Amazon, Snapchat, Meta.",
      ],
    },
    {
      id: "results",
      kind: "results",
      label: "THE RESULTS",
      metrics: [
        { label: "YoY growth", from: 0, to: 200, format: "%s%", note: "revitalized brand" },
        { label: "Active merchants", from: 0, to: 12000, format: "%s+", note: "+30% in 2024" },
        { label: "Basket & conversion", from: 0, to: 50, format: "+%s%", note: "both up" },
        { label: "GMV", from: 0, to: 25, format: "+%s%", note: "YoY" },
      ],
      support: "Unified perception — Zid as the go-to Total Commerce solution, not just a storebuilder.",
    },
  ],
};
