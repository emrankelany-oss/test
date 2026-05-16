import Nav from "@/components/home/Nav";
import Footer from "@/components/home/Footer";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import PortfolioMotion from "@/components/portfolio/PortfolioMotion";
import V7Paper from "@/components/portfolio-v7/V7Paper";
import V7Cover from "@/components/portfolio-v7/V7Cover";
import V7Spread from "@/components/portfolio-v7/V7Spread";
import V7Roster from "@/components/portfolio-v7/V7Roster";
import V7Closing from "@/components/portfolio-v7/V7Closing";
import BigCTA from "@/components/portfolio/BigCTA";
import { notebookSpreads } from "@/data/portfolio-notebook";

export const metadata = {
  title: "Portfolio V7 — The Motion Agency",
  description:
    "Field Notes Vol. 01 — a designer's notebook of how we shipped two of the GCC's biggest B2B launches. Polaroids, sticky notes, hand-drawn arrows.",
  openGraph: {
    title: "Portfolio V7 — The Motion Agency",
    description:
      "Designer's journal. Two case spreads + a client roster, drawn by hand and pinned to the page.",
    images: [
      { url: "/assets/case-zid-ripple.png", width: 1600, height: 900 },
    ],
  },
};

export default function PortfolioV7Page() {
  return (
    <div className="pf-page v7-page">
      <ClientShell enableScrolledNav />
      <SmoothScroll />
      <PortfolioMotion />
      <V7Paper />
      <Nav />

      <V7Cover />
      {notebookSpreads.map((spread, i) => (
        <V7Spread key={spread.n} caseStudy={spread} index={i} />
      ))}
      <V7Roster />
      <V7Closing />

      <BigCTA />
      <Footer />
    </div>
  );
}
