import Script from "next/script";
import Nav from "@/components/home/Nav";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import V22Cursor from "@/components/portfolio-v22/V22Cursor";
import V22Hero from "@/components/portfolio-v22/V22Hero";
import V22Marquee from "@/components/portfolio-v22/V22Marquee";
import V22ProjectModal from "@/components/portfolio-v22/V22ProjectModal";
import "@/components/portfolio-v22/v22.css";

export const metadata = {
  title: "Portfolio V22 — The Motion Agency",
  description:
    "Where strategy meets bold storytelling — a motion-led showcase of The Motion Agency's work.",
};

export default function PortfolioV22Page() {
  return (
    <main className="v22-page">
      {/* Queue stub: available synchronously before any React chunk loads.
          Calls are flushed when useProjectModal.js evaluates. */}
      <Script id="v22-open-stub" strategy="beforeInteractive">{`
        window.__v22OpenProjectQueue=window.__v22OpenProjectQueue||[];
        window.__v22OpenProject=window.__v22OpenProject||function(s,el){window.__v22OpenProjectQueue.push([s,el]);};
      `}</Script>
      <SmoothScroll />
      <V22Cursor />
      <V22ProjectModal />
      <ClientShell enableScrolledNav />
      <Nav />
      <V22Hero />
      <V22Marquee />
    </main>
  );
}
