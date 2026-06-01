import Nav from "@/components/home/Nav";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import Contact from "@/components/home/Contact";
import Footer from "@/components/home/Footer";
import V22Cursor from "@/components/portfolio-v22/V22Cursor";
import V22ProjectModal from "@/components/portfolio-v22/V22ProjectModal";
import V22Hero from "@/components/portfolio-v22/V22Hero";
import V22Marquee from "@/components/portfolio-v22/V22Marquee";
import V22FeaturedWork from "@/components/portfolio-v22/V22FeaturedWork";
import V22Capabilities from "@/components/portfolio-v22/V22Capabilities";
import V22WorkArchive from "@/components/portfolio-v22/V22WorkArchive";
import V22Impact from "@/components/portfolio-v22/V22Impact";
import V22Preloader from "@/components/portfolio-v22/V22Preloader";
import "@/components/portfolio-v22/v22.css";

export const metadata = {
  title: "Portfolio V22 — The Motion Agency",
  description:
    "Where strategy meets bold storytelling — a motion-led showcase of The Motion Agency's work.",
};

export default function PortfolioV22Page() {
  return (
    <main className="v22-page">
      <V22Preloader />
      <SmoothScroll />
      <V22Cursor />
      <V22ProjectModal />
      <ClientShell enableScrolledNav />
      <Nav />
      <V22Hero />
      <V22Marquee />
      <V22FeaturedWork />
      <V22Capabilities />
      <V22WorkArchive />
      <V22Impact />
      <Contact />
      <Footer />
    </main>
  );
}
