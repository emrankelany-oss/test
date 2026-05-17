export const foodics = {
  id: "foodics",
  order: 40,
  viewports: 6,
  bleed: "#150829",
  accent: "#74D1EA",
  image: "/assets/case-foodics-boundless.png",
  plan: {
    acts: [
      { id: "hook", weight: 0.15 },
      { id: "problem", weight: 0.3 },
      { id: "solution", weight: 0.27 },
      { id: "results", weight: 0.28 },
    ],
    inFrac: 0.2,
    outFrac: 0.2,
  },
  acts: [
    {
      id: "hook",
      kind: "hook",
      label: "FOODICS · BOUNDLESS",
      headline: "Boundless: Launching What's Next for F&B",
    },
    {
      id: "problem",
      kind: "problem",
      label: "THE PROBLEM",
      body: [
        "Evolving from POS provider to a complete F&B growth platform — payments, lending, data, marketplaces.",
        "The market still saw them as just a POS system.",
        "Thousands of restaurant owners needed educating on the new tools.",
        "Clear market leadership had to be established as competition intensified.",
      ],
    },
    {
      id: "solution",
      kind: "solution",
      label: "WHAT WE DID",
      body: [
        "Created a flagship annual stage positioning Foodics as the authority shaping F&B tech.",
        "Crafted end-to-end event narratives — Foodics Pay, Capital, the Marketplace.",
        "Designed experiences that educated and excited: live demos, data, launches.",
        "Transformed perception — no longer a POS provider but the growth engine for F&B.",
      ],
    },
    {
      id: "results",
      kind: "results",
      label: "THE RESULTS",
      metrics: [
        { label: "Revenue", from: 15.4, to: 20.8, format: "$%sM", note: "+35.6% YoY" },
        { label: "Merchants", from: 8000, to: 32000, format: "%s+", note: "35% Saudi market share" },
        { label: "Valuation", from: 0, to: 1, format: "$%sB", note: "unicorn" },
      ],
      support: "Recognized as the F&B growth platform — fueling the trajectory to unicorn status.",
    },
  ],
};
