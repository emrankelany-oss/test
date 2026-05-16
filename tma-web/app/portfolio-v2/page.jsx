import Nav from "@/components/home/Nav";
import Footer from "@/components/home/Footer";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import V2PersistentBG from "@/components/portfolio-v2/V2PersistentBG";
import V2Hero from "@/components/portfolio-v2/V2Hero";
import V2Why from "@/components/portfolio-v2/V2Why";
import V2HorizontalCards from "@/components/portfolio-v2/V2HorizontalCards";
import V2KineticType from "@/components/portfolio-v2/V2KineticType";
import V2StackingCards from "@/components/portfolio-v2/V2StackingCards";
import V2InUse from "@/components/portfolio-v2/V2InUse";

export const metadata = {
  title: "Portfolio V2 — The Motion Agency",
  description:
    "Experimental V2 — lenis.dev-inspired immersive scroll portfolio. Kinetic typography, sticky horizontal cards, stacking work.",
  openGraph: {
    title: "Portfolio V2 — The Motion Agency",
    description: "Immersive scroll-storytelling portfolio.",
    images: [
      { url: "/assets/case-foodics-boundless.png", width: 1600, height: 900 },
    ],
  },
};

export default function PortfolioV2Page() {
  return (
    <div className="v2-page">
      <ClientShell enableScrolledNav />
      <SmoothScroll />
      <V2PersistentBG />
      <Nav />
      <V2Hero />
      <V2Why />
      <V2HorizontalCards />
      <V2KineticType />
      <V2StackingCards />
      <V2InUse />
      <Footer />
    </div>
  );
}
