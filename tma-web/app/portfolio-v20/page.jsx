import Nav from "@/components/home/Nav";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import V20Preloader from "@/components/portfolio-v20/V20Preloader";
import V20Hero from "@/components/portfolio-v20/V20Hero";
import V20FeaturedWork from "@/components/portfolio-v20/V20FeaturedWork";
import V20MotionMatters from "@/components/portfolio-v20/V20MotionMatters";
import V20OurWork from "@/components/portfolio-v20/V20OurWork";
import V20Filament from "@/components/portfolio-v20/V20Filament";
import V20Cursor from "@/components/portfolio-v20/V20Cursor";
import V20ProjectDrawer from "@/components/portfolio-v20/V20ProjectDrawer";
import Contact from "@/components/home/Contact";
import Footer from "@/components/home/Footer";
import "@/components/portfolio-v20/v20.css";

export const metadata = {
  title: "Portfolio V20 — The Motion Agency",
  description:
    "Narrative meets design — the showreel hero for The Motion Agency portfolio v20.",
};

export default function PortfolioV20Page() {
  return (
    <main className="v20-page">
      <SmoothScroll />
      <V20Cursor />
      <V20ProjectDrawer />
      <V20Preloader />
      <ClientShell enableScrolledNav />
      <Nav />
      <V20Hero />
      {/* One filament threads continuously down through both work sections */}
      <div className="v20-worklane">
        <V20Filament />
        <V20FeaturedWork />
        <V20MotionMatters />
        <V20OurWork />
      </div>
      <Contact />
      <Footer />
    </main>
  );
}
