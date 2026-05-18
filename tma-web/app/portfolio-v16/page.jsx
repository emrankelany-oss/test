import V16Experience from "@/components/portfolio-v16/V16Experience";

export const metadata = {
  title: "Portfolio V16 — The Motion Agency",
  description:
    "A scroll-controlled cinematic frame sequence. Built with GSAP ScrollTrigger, Lenis, Framer Motion and a Three.js particle overlay.",
};

export default function PortfolioV16Page() {
  return (
    <main className="v16-page">
      <V16Experience />
    </main>
  );
}
