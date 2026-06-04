import Nav from "@/components/home/Nav";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import Contact from "@/components/home/Contact";
import Footer from "@/components/home/Footer";
import V23Cursor from "@/components/portfolio-v23/V23Cursor";
import V24Preloader from "@/components/portfolio-v24/V24Preloader";
import V24GradientField from "@/components/portfolio-v24/V24GradientField";
import V24Hero from "@/components/portfolio-v24/V24Hero";
import V24StatsBand from "@/components/portfolio-v24/V24StatsBand";
import V24Featured from "@/components/portfolio-v24/V24Featured";
import V24VideoLightbox from "@/components/portfolio-v24/V24VideoLightbox";
import V24Categories from "@/components/portfolio-v24/V24Categories";
import "@/components/portfolio-v24/v24.css";

export const metadata = {
  title: "Portfolio V24 — The Motion Agency",
  description:
    "The Motion Agency's final showcase — work classified by category, real numbers, on the brand's prismatic gradient.",
};

export default function PortfolioV24Page() {
  return (
    <main className="v24-page">
      <V24Preloader />
      <V24GradientField />
      <SmoothScroll />
      <V23Cursor />
      <V24VideoLightbox />
      <ClientShell enableScrolledNav />
      <Nav />
      <V24Hero />
      <V24StatsBand />
      <V24Featured />
      <V24Categories />
      <Contact />
      <Footer />
    </main>
  );
}
