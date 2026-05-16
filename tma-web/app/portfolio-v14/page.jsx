import V14Experience from "@/components/portfolio-v14/V14Experience";

export const metadata = {
  title: "Portfolio V14 — The Motion Agency",
  description:
    "A continuous cinematic journey controlled by scroll. Built with GSAP, Lenis and a frame-sequence engine.",
};

export default function PortfolioV14Page() {
  return (
    <main data-v14-root className="v14-page">
      <V14Experience />
    </main>
  );
}
