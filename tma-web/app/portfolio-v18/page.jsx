import Nav from "@/components/home/Nav";
import ClientShell from "@/components/shell/ClientShell";
import V18Experience from "@/components/portfolio-v18/V18Experience";

export const metadata = {
  title: "Portfolio V18 — The Motion Agency",
  description:
    "Selected work from The Motion Agency — bold brands set in motion across the GCC.",
};

export default function PortfolioV18Page() {
  return (
    <main className="v18-page">
      <ClientShell enableScrolledNav />
      <Nav />
      <V18Experience />
    </main>
  );
}
