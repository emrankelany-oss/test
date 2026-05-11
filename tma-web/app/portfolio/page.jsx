import Nav from "@/components/home/Nav";
import Footer from "@/components/home/Footer";
import ClientShell from "@/components/shell/ClientShell";
import PortfolioHero from "@/components/portfolio/PortfolioHero";
import PortfolioMotion from "@/components/portfolio/PortfolioMotion";
import TrustBar from "@/components/portfolio/TrustBar";
import FeaturedWorkGrid from "@/components/portfolio/FeaturedWorkGrid";
import CaseSpotlightSection from "@/components/portfolio/CaseSpotlightSection";
import WorkGallery from "@/components/portfolio/WorkGallery";
import BigCTA from "@/components/portfolio/BigCTA";

export const metadata = {
  title: "Portfolio — The Motion Agency",
  description:
    "Building category leaders across the GCC. Foodics, Zid, InvoiceQ, Burger King, Salasa, LSC, Vodafone — explore our case studies, campaigns, brand systems, and production work.",
  openGraph: {
    title: "Portfolio — The Motion Agency",
    description:
      "Case studies, campaigns, brand systems and production work from across the GCC.",
    images: [{ url: "/assets/case-foodics-boundless.png", width: 1600, height: 900 }],
  },
};

export default function PortfolioPage() {
  return (
    <div className="pf-page">
      <ClientShell enableScrolledNav />
      <PortfolioMotion />
      <Nav />
      <PortfolioHero />
      <TrustBar />
      <FeaturedWorkGrid />
      <CaseSpotlightSection />
      <WorkGallery />
      <BigCTA />
      <Footer />
    </div>
  );
}
