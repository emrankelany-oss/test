import V8ClientRoot from "@/components/portfolio-v8/V8ClientRoot";

export const metadata = {
  title: "Portfolio V8 — The Motion Agency",
  description:
    "An immersive 3D portfolio. Scroll through five rooms of bold strategy, kinetic storytelling, and the work behind GCC's loudest B2B launches.",
  openGraph: {
    title: "Portfolio V8 — The Motion Agency",
    description:
      "Cinematic single-canvas storytelling. Hero → Stats → Work → Services → CTA. Built in WebGL.",
    images: [
      { url: "/assets/case-foodics-boundless.png", width: 1600, height: 900 },
    ],
  },
};

export default function PortfolioV8Page() {
  return <V8ClientRoot />;
}
