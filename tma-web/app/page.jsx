import Nav from "@/components/home/Nav";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import Manifesto from "@/components/home/Manifesto";
import Services from "@/components/home/Services";
import Proof from "@/components/home/Proof";
import ProofBand from "@/components/home/ProofBand";
import Clients from "@/components/home/Clients";
import About from "@/components/home/About";
import Insights from "@/components/home/Insights";
import Careers from "@/components/home/Careers";
import Contact from "@/components/home/Contact";
import Footer from "@/components/home/Footer";
import ClientShell from "@/components/shell/ClientShell";

const tickers1 = [
  "BRAND STRATEGY", "BOLD STORYTELLING", "GO-TO-MARKET", "EVENT EXPERIENCE",
  "PERFORMANCE GROWTH", "CONTENT STUDIO", "AMMAN ↔ RIYADH",
];
const tickers2 = [
  "BRAND STRATEGY", "BRAND DESIGN", "GO-TO-MARKET", "GROWTH MARKETING",
  "EVENT EXPERIENCE", "PRODUCT MARKETING", "SOCIAL & COMMUNITY", "CONTENT STUDIO",
];

export default function Home() {
  return (
    <>
      <ClientShell enableScrolledNav />
      <Nav />
      <Hero />
      <Marquee items={tickers1} />
      <Manifesto />
      <Marquee items={tickers2} inv />
      <Services />
      <Proof />
      <ProofBand />
      <Clients />
      <About />
      <Insights />
      <Careers />
      <Contact />
      <Footer />
    </>
  );
}
