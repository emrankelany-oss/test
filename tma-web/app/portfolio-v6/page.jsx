import Nav from "@/components/home/Nav";
import Footer from "@/components/home/Footer";
import ClientShell from "@/components/shell/ClientShell";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import PortfolioMotion from "@/components/portfolio/PortfolioMotion";
import V6ColdOpen from "@/components/portfolio-v6/V6ColdOpen";
import V6TitleCard from "@/components/portfolio-v6/V6TitleCard";
import V6Episode from "@/components/portfolio-v6/V6Episode";
import V6Interlude from "@/components/portfolio-v6/V6Interlude";
import V6ShortFilm from "@/components/portfolio-v6/V6ShortFilm";
import V6BRoll from "@/components/portfolio-v6/V6BRoll";
import V6EndCredits from "@/components/portfolio-v6/V6EndCredits";
import BigCTA from "@/components/portfolio/BigCTA";
import { filmEpisodes, filmShorts, filmInterludes } from "@/data/portfolio-film";

export const metadata = {
  title: "Portfolio V6 — The Motion Agency",
  description:
    "Cases worth telling — a film in four parts. Documentary-style scroll that reveals problem, idea, and result one act at a time.",
  openGraph: {
    title: "Portfolio V6 — The Motion Agency",
    description:
      "Documentary scroll. Two feature episodes, two short films, and a b-roll reel of 39 cuts from the studio floor.",
    images: [
      { url: "/assets/case-foodics-boundless.png", width: 1600, height: 900 },
    ],
  },
};

export default function PortfolioV6Page() {
  return (
    <div className="pf-page v6-page">
      <ClientShell enableScrolledNav />
      <SmoothScroll />
      <PortfolioMotion />
      <Nav />

      <V6ColdOpen />
      <V6TitleCard />

      <V6Episode episode={filmEpisodes[0]} index={0} />
      <V6Interlude line={filmInterludes.betweenEpisodes} />
      <V6Episode episode={filmEpisodes[1]} index={1} />

      <V6Interlude line={filmInterludes.beforeShorts} />
      <V6ShortFilm short={filmShorts[0]} index={0} />
      <V6ShortFilm short={filmShorts[1]} index={1} />

      <V6Interlude line={filmInterludes.beforeBRoll} />
      <V6BRoll />

      <V6EndCredits />
      <BigCTA />
      <Footer />
    </div>
  );
}
