// V7 "Field Notebook" content — two case spreads, drawn from the same
// deck source as V6. Each spread describes the brief on the left page
// and the artefacts pinned/taped on the right page.

export const notebookSpreads = [
  {
    n: "01",
    client: "Foodics",
    project: "Boundless 22 · 23",
    brief: {
      quote:
        "POS provider, evolving into the F&B growth platform. Market still saw them as just a POS.",
      bullets: [
        "Foodics is now payments, lending, data, marketplaces — not just POS.",
        "Educate thousands of restaurant operators about new tools.",
        "Establish clear market leadership as competition tightens.",
        "Turn a product reveal into a category-defining moment.",
      ],
    },
    arrow: { rotation: -6, label: "→ The Boundless idea" },
    artefacts: [
      {
        type: "polaroid",
        image: "/assets/case-foodics-boundless.png",
        caption: "Boundless · Riyadh",
        rotation: -4,
        tapeColor: "#FCE38A",
        width: 320,
        alt: "Boundless event hero image",
      },
      {
        type: "ooh",
        image: "/assets/portfolio/slide-65.jpg",
        caption: "OOH wave · Riyadh",
        rotation: 3,
        tapeColor: "#A0DDE6",
        width: 240,
        alt: "Foodics OOH collage",
      },
      {
        type: "stat",
        value: "$1B",
        label: "unicorn status",
        rotation: -7,
        width: 180,
        pinColor: "#D43A3A",
      },
      {
        type: "palette",
        colors: ["#330072", "#4E008E", "#74D1EA", "#440099"],
        rotation: 1,
        width: 280,
      },
      {
        type: "note",
        text: "Stage = launchpad. Story = transformation, not POS.",
        rotation: -3,
        width: 240,
      },
    ],
  },
  {
    n: "02",
    client: "Zid",
    project: "Ripple 2024",
    brief: {
      quote:
        "Fragmented systems. Scale barriers. A perception gap to close.",
      bullets: [
        "Merchants juggling separate tools for storefront, social, in-store.",
        "Logistical inefficiencies cap growth.",
        "Zid is the unified Total Commerce platform — not a storebuilder.",
        "Diriyah + 1,000 merchants + AI-powered marketing reveal.",
      ],
    },
    arrow: { rotation: -4, label: "→ One dashboard. One era." },
    artefacts: [
      {
        type: "polaroid",
        image: "/assets/case-zid-ripple.png",
        caption: "Ripple · Diriyah · 2024",
        rotation: 4,
        tapeColor: "#A0DDE6",
        width: 320,
        alt: "Ripple 2024 hero image",
      },
      {
        type: "ooh",
        image: "/assets/portfolio/slide-31.jpg",
        caption: "Brand system · OOH",
        rotation: -3,
        tapeColor: "#FCE38A",
        width: 240,
        alt: "Zid brand system collage",
      },
      {
        type: "stat",
        value: "+200%",
        label: "YoY growth",
        rotation: 6,
        width: 180,
        pinColor: "#1A6BFF",
      },
      {
        type: "palette",
        colors: ["#0E1A47", "#5B5BFF", "#FF7AAD", "#F5F7FB"],
        rotation: -2,
        width: 280,
      },
      {
        type: "note",
        text: "Total Commerce. Build one stage. Launch one platform.",
        rotation: 2,
        width: 240,
      },
    ],
  },
];
