import Nav from "@/components/home/Nav";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import Contact from "@/components/home/Contact";
import Footer from "@/components/home/Footer";
import V23Preloader from "@/components/portfolio-v23/V23Preloader";
import V23Cursor from "@/components/portfolio-v23/V23Cursor";
import V23VideoLightbox from "@/components/portfolio-v23/V23VideoLightbox";
import V23Hero from "@/components/portfolio-v23/V23Hero";
import V23Statement from "@/components/portfolio-v23/V23Statement";
import V23Featured from "@/components/portfolio-v23/V23Featured";
import V23WorkGrid from "@/components/portfolio-v23/V23WorkGrid";
import V23Carousel from "@/components/portfolio-v23/V23Carousel";
import "@/components/portfolio-v23/v23.css";

export const metadata = {
  title: "Portfolio V23 — The Motion Agency",
  description:
    "A motion-led showcase of The Motion Agency's work — Clim-grade grids, cards and motion in TMA blue.",
};

export default function PortfolioV23Page() {
  return (
    <main className="v23-page">
      <V23Preloader />
      <SmoothScroll />
      <V23Cursor />
      <V23VideoLightbox />
      <ClientShell enableScrolledNav />
      <Nav />
      <V23Hero />
      <V23Statement />
      <V23Featured />
      <V23WorkGrid />
      <V23Carousel />
      <Contact />
      <Footer />
    </main>
  );
}
