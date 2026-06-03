import Nav from "@/components/home/Nav";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import V21Preloader from "@/components/portfolio-v21/V21Preloader";
import V21Hero from "@/components/portfolio-v21/V21Hero";
import V21FeaturedWork from "@/components/portfolio-v21/V21FeaturedWork";
import V21MotionMatters from "@/components/portfolio-v21/V21MotionMatters";
import V21OurWork from "@/components/portfolio-v21/V21OurWork";
import V21Filament from "@/components/portfolio-v21/V21Filament";
import V21Cursor from "@/components/portfolio-v21/V21Cursor";
import V21ProjectModal from "@/components/portfolio-v21/V21ProjectModal";
import Contact from "@/components/home/Contact";
import Footer from "@/components/home/Footer";
import "@/components/portfolio-v21/v21.css";

export const metadata = {
  title: "Portfolio V21 — The Motion Agency",
  description:
    "Narrative meets design — the showreel hero for The Motion Agency portfolio v21.",
};

export default function PortfolioV21Page() {
  return (
    <main className="v21-page">
      <SmoothScroll />
      <V21Cursor />
      <V21ProjectModal />
      <V21Preloader />
      <ClientShell enableScrolledNav />
      <Nav />
      <V21Hero />
      {/* One filament threads continuously down through both work sections */}
      <div className="v21-worklane">
        <V21Filament />
        <V21FeaturedWork />
        <V21MotionMatters />
        <V21OurWork />
      </div>
      <Contact />
      <Footer />
    </main>
  );
}
