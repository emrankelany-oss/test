import Nav from "@/components/home/Nav";
import Footer from "@/components/home/Footer";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import PortfolioMotion from "@/components/portfolio/PortfolioMotion";
import V3BackgroundWash from "@/components/portfolio-v3/V3BackgroundWash";
import V3AtmosphericLayer from "@/components/portfolio-v3/V3AtmosphericLayer";
import V3MotionEngine from "@/components/portfolio-v3/V3MotionEngine";
import V3Hero from "@/components/portfolio-v3/V3Hero";
import V3WorkAlternating from "@/components/portfolio-v3/V3WorkAlternating";
import BigCTA from "@/components/portfolio/BigCTA";

export const metadata = {
  title: "Portfolio V3 — The Motion Agency",
  description:
    "Immersive scroll portfolio. A floating motion engine travels with you from hero across the work in an alternating two-column grid.",
  openGraph: {
    title: "Portfolio V3 — The Motion Agency",
    description: "Cinematic motion engine + alternating two-column work showcase.",
    images: [
      { url: "/assets/case-foodics-boundless.png", width: 1600, height: 900 },
    ],
  },
};

export default function PortfolioV3Page() {
  return (
    <div className="pf-page v3-page">
      <ClientShell enableScrolledNav />
      <SmoothScroll />
      <PortfolioMotion />
      <Nav />
      <V3BackgroundWash />
      <V3AtmosphericLayer />
      <V3MotionEngine />
      <V3Hero />
      <V3WorkAlternating />
      <BigCTA />
      <Footer />
    </div>
  );
}
