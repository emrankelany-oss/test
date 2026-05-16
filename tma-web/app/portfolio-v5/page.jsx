import Nav from "@/components/home/Nav";
import Footer from "@/components/home/Footer";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import PortfolioMotion from "@/components/portfolio/PortfolioMotion";
import V5Background from "@/components/portfolio-v5/V5Background";
import V5Stage from "@/components/portfolio-v5/V5Stage";
import V5Preloader from "@/components/portfolio-v5/V5Preloader";
import V5OurWork from "@/components/portfolio-v5/V5OurWork";
import V5ZoomTour from "@/components/portfolio-v5/V5ZoomTour";
import BigCTA from "@/components/portfolio/BigCTA";

export const metadata = {
  title: "Portfolio V5 — The Motion Agency",
  description:
    "A cinematic deck of featured projects that unfolds through scroll into the work itself.",
  openGraph: {
    title: "Portfolio V5 — The Motion Agency",
    description:
      "Floating cinematic deck → featured projects. Built with Lenis, GSAP & Framer Motion.",
    images: [
      { url: "/assets/case-foodics-boundless.png", width: 1600, height: 900 },
    ],
  },
};

export default function PortfolioV5Page() {
  return (
    <div className="pf-page v5-page">
      <V5Preloader />
      <ClientShell enableScrolledNav />
      <SmoothScroll />
      <PortfolioMotion />
      <V5Background />
      <Nav />
      <V5Stage />
      <V5ZoomTour />
      <V5OurWork />
      <BigCTA />
      <Footer />
    </div>
  );
}
