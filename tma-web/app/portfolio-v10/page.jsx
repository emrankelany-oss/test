import V10ClientRoot from "@/components/portfolio-v10/V10ClientRoot";

export const metadata = {
  title: "Portfolio V10 — Liftoff · The Motion Agency",
  description:
    "A scroll-driven 3D booster sequence. Descent, touchdown, traverse, re-entry, final landing — controlled by your scroll wheel.",
  openGraph: {
    title: "Portfolio V10 — Liftoff",
    description: "Scroll the rocket. The booster lives.",
    images: [
      { url: "/assets/case-foodics-boundless.png", width: 1600, height: 900 },
    ],
  },
};

export default function PortfolioV10Page() {
  return <V10ClientRoot />;
}
