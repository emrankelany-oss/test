import V12ClientRoot from "@/components/portfolio-v12/V12ClientRoot";

export const metadata = {
  title: "Launch Sequence — The Motion Agency",
  description:
    "A cinematic launch sequence. We don't build brands — we launch them. Foodics, Zid and the studio floor, scrolled like a film.",
  openGraph: {
    title: "Launch Sequence — The Motion Agency",
    description:
      "Ignition to orbit: Foodics and Zid deep cases, a motion reel of real campaigns, built across Amman and Riyadh.",
    images: [{ url: "/assets/case-foodics-boundless.png", width: 1920, height: 1080 }],
  },
};

export default function PortfolioV12Page() {
  return <V12ClientRoot />;
}
