import Link from "next/link";
import NavPortfolioLink from "./NavPortfolioLink";

export default function Nav() {
  return (
    <nav className="nav">
      <Link href="/#top" className="nav-logo" aria-label="The Motion Agency — home">
        <img className="nav-logo-img light" src="/assets/tma-logo-white.png" alt="" />
        <img className="nav-logo-img dark" src="/assets/tma-logo-black.png" alt="" />
      </Link>
      <div className="nav-links">
        <NavPortfolioLink />
        <Link href="/#proof">Case Studies</Link>
        <Link href="/#services">Services</Link>
        <Link href="/#about">About</Link>
        <Link href="/#insights">Insights</Link>
        <Link href="/careers">Careers</Link>
      </div>
      <Link href="/#contact" className="nav-cta">
        <span className="nav-dot" />
        Start a project
      </Link>
    </nav>
  );
}
