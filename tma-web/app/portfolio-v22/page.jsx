import Nav from "@/components/home/Nav";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import V22Cursor from "@/components/portfolio-v22/V22Cursor";
import "@/components/portfolio-v22/v22.css";

export const metadata = {
  title: "Portfolio V22 — The Motion Agency",
  description:
    "Where strategy meets bold storytelling — a motion-led showcase of The Motion Agency's work.",
};

export default function PortfolioV22Page() {
  return (
    <main className="v22-page">
      <SmoothScroll />
      <V22Cursor />
      <ClientShell enableScrolledNav />
      <Nav />
      <section className="v22-section">
        <p className="v22-eyebrow">Where strategy meets bold storytelling.</p>
        <h1 style={{ fontSize: "clamp(40px, 9vw, 132px)", lineHeight: 0.95, letterSpacing: "-0.02em", fontWeight: 600, margin: "12px 0 0" }}>
          Motion-led storytelling<br />that moves brands forward.
        </h1>
        <a href="#v22-featured" data-cursor="view" data-cursor-label="Showreel" data-magnetic
           className="v22-eyebrow" style={{ display: "inline-block", marginTop: 24 }}>
          &#9654; Watch the showreel
        </a>
      </section>
    </main>
  );
}
