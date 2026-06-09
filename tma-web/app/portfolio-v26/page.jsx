import Nav from "@/components/home/Nav";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import Contact from "@/components/home/Contact";
import Footer from "@/components/home/Footer";
import V23Cursor from "@/components/portfolio-v23/V23Cursor";
import V26Backdrop from "@/components/portfolio-v26/V26Backdrop";
import V26Hero from "@/components/portfolio-v26/V26Hero";
import V26WorkGrid from "@/components/portfolio-v26/V26WorkGrid";
import V26ProjectModal from "@/components/portfolio-v26/V26ProjectModal";
import "@/components/portfolio-v26/v26.css";

export const metadata = {
  title: "Portfolio V26 — The Motion Agency",
  description:
    "The Motion Agency's work, in an IMPACT-style editorial grid — filterable by category, on the brand spectrum.",
};

export default function PortfolioV26Page() {
  return (
    <main className="v26-page">
      <V26Backdrop />
      <SmoothScroll duration={1.1} />
      <V23Cursor />
      <ClientShell enableScrolledNav />
      <Nav />
      <V26Hero />
      <V26WorkGrid />
      <Contact />
      <Footer />
      <V26ProjectModal />
    </main>
  );
}
