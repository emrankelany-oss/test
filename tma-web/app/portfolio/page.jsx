import V11ClientRoot from "@/components/portfolio-v11/V11ClientRoot";

export const metadata = {
  title: "Portfolio — The Motion Agency",
  description:
    "A scroll-driven cinematic. Hero → Featured → 39 projects → Stats → Quotes → CTA, all under one continuous film. Built across Amman and Riyadh for category leaders across the GCC.",
  openGraph: {
    title: "Portfolio — The Motion Agency",
    description:
      "Scroll the booster. Foodics, Zid, InvoiceQ, Burger King, Salasa, LSC, Vodafone — six cases and 39 cuts from the studio floor.",
    images: [
      { url: "/assets/v11/poster.webp", width: 1920, height: 1080 },
    ],
  },
};

export default function PortfolioPage() {
  return <V11ClientRoot />;
}
