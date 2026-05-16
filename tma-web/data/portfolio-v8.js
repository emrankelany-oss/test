// Portfolio V8 — content + scene config
// Story arc: Hero → Stats → Work → Services → CTA (5 rooms)
// Inspired by Lusion.co's room-to-room virtual-scroll storytelling.

export const v8Brand = {
  ink: "#0a0a0a",
  paper: "#f4f4f1",
  accentCyan: "#33e6ff",
  accentMagenta: "#ff3df3",
  accentLime: "#c5ff3a",
  accentWhite: "#ffffff",
};

export const v8Rooms = [
  { key: "hero",     range: [0.00, 0.20], ambient: "hero" },
  { key: "stats",    range: [0.20, 0.40], ambient: "stats" },
  { key: "work",     range: [0.40, 0.65], ambient: "work" },
  { key: "services", range: [0.65, 0.85], ambient: "services" },
  { key: "cta",      range: [0.85, 1.00], ambient: "cta" },
];

export const v8Hero = {
  eyebrow: "The Motion Agency",
  headline: "We turn bold strategy into motion that moves markets.",
  scrollHint: "scroll to explore",
};

// Stats from deck slide 6 (verified)
export const v8Stats = [
  { value: "178%", label: "Growth"           },
  { value: "30+",  label: "Clients"          },
  { value: "500+", label: "Business created" },
  { value: "29+",  label: "Years experience" },
];

// 6 featured projects — locked in clarifying round
export const v8Projects = [
  {
    slug: "foodics",
    title: "Foodics",
    tags: ["brand · strategy · GTM"],
    image: "/assets/case-foodics-boundless.png",
    href: "/case/foodics-boundless",
    accent: "#33e6ff",
  },
  {
    slug: "zid",
    title: "Zid",
    tags: ["brand · campaign · launch"],
    image: "/assets/case-zid-ripple.png",
    href: "/case/zid-ripple",
    accent: "#ff3df3",
  },
  {
    slug: "boundless",
    title: "Boundless 2023",
    tags: ["flagship event · narrative"],
    image: "/assets/portfolio/slide-50.jpg",
    href: "/case/foodics-boundless",
    accent: "#c5ff3a",
  },
  {
    slug: "ripple",
    title: "Ripple 2024",
    tags: ["product event · positioning"],
    image: "/assets/portfolio/slide-30.jpg",
    href: "/case/zid-ripple",
    accent: "#ffffff",
  },
  {
    slug: "burger-king",
    title: "Burger King KSA",
    tags: ["campaign · OOH · TVC"],
    image: "/assets/portfolio/slide-24.jpg",
    href: "/portfolio",
    accent: "#ff3df3",
  },
  {
    slug: "lg",
    title: "LG",
    tags: ["seasonal · social"],
    image: "/assets/portfolio/slide-25.jpg",
    href: "/portfolio",
    accent: "#33e6ff",
  },
];

// 8 services from deck slides 9–10
export const v8Services = [
  { n: "01", title: "Brand Strategy & Positioning",        line: "Crucial insights, compelling strategies, category leadership." },
  { n: "02", title: "Brand Design & Experience",           line: "Identity systems and guidelines that build equity and ROI." },
  { n: "03", title: "Go-to-Market & Growth Strategy",      line: "Complete GTM blueprints, launch playbooks, market architectures." },
  { n: "04", title: "Growth Marketing & Reputation",       line: "Performance campaigns + cultural storytelling. Demand and trust." },
  { n: "05", title: "Event & Experience Marketing",        line: "Flagship events and immersive experiences that build authority." },
  { n: "06", title: "Product Marketing & Innovation",      line: "Concept-to-rollout — turning big ideas into sales-driving realities." },
  { n: "07", title: "Social Media & Community",            line: "Always-on cultural relevance with sustained community engagement." },
  { n: "08", title: "Content Studio & Campaign Production",line: "Editorial, film, design, animation — delivered across every channel." },
];

export const v8Cta = {
  eyebrow: "Let's work together",
  headline: "Let's build bold stories with strategic impact.",
  primary: { label: "info@themotionagency.net", href: "mailto:info@themotionagency.net" },
  secondary: { label: "View full portfolio", href: "/portfolio" },
  offices: [
    { city: "Amman",  street: "Al-Abdali, 432, Amman, Jordan",          tel: "+962 79 924 5366" },
    { city: "Riyadh", street: "Al-Olaya, Riyadh, Saudi Arabia",         tel: "+966 57 353 2604" },
  ],
};
