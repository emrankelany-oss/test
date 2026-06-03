import Nav from "@/components/home/Nav";
import ClientShell from "@/components/shell/ClientShell";
import V19Preloader from "@/components/portfolio-v19/V19Preloader";
import V19Hero from "@/components/portfolio-v19/V19Hero";
import V19FeaturedWork from "@/components/portfolio-v19/V19FeaturedWork";
import V19OurWork from "@/components/portfolio-v19/V19OurWork";
import V19Filament from "@/components/portfolio-v19/V19Filament";
import Contact from "@/components/home/Contact";
import Footer from "@/components/home/Footer";
import "@/components/portfolio-v19/v19.css";

export const metadata = {
  title: "Portfolio V19 — The Motion Agency",
  description:
    "Narrative meets design — the showreel hero for The Motion Agency portfolio v19.",
};

export default function PortfolioV19Page() {
  return (
    <main className="v19-page">
      <V19Preloader />
      <ClientShell enableScrolledNav />
      <Nav />
      <V19Hero />
      {/* One filament threads continuously down through both work sections */}
      <div className="v19-worklane">
        <V19Filament />
        <V19FeaturedWork />
        <V19OurWork />
      </div>
      <Contact />
      <Footer />
    </main>
  );
}
