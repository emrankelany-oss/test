import V9ClientRoot from "@/components/portfolio-v9/V9ClientRoot";

export const metadata = {
  title: "Portfolio V9 — The Signal · The Motion Agency",
  description:
    "An evolving cinematic motion-energy entity called The Signal. Scroll-synchronized film, project manifestation, and motion systems for GCC category leaders.",
  openGraph: {
    title: "Portfolio V9 — The Signal",
    description:
      "Cinematic scroll-driven storytelling. Signal Birth, Evolution, Project Manifestation, Creative Systems, Synchronization, Infinite Motion.",
    images: [
      { url: "/assets/case-foodics-boundless.png", width: 1600, height: 900 },
    ],
  },
};

export default function PortfolioV9Page() {
  return <V9ClientRoot />;
}
