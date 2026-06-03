import V17Experience from "@/components/portfolio-v17/V17Experience";

export const metadata = {
  title: "Portfolio V17 — The Motion Agency",
  description:
    "An interactive, scroll-cinematic portfolio. Hero on the live prism field with mouse parallax, floating featured-work cards, GSAP + Lenis.",
};

export default function PortfolioV17Page() {
  return (
    <main className="v17-page">
      <V17Experience />
    </main>
  );
}
