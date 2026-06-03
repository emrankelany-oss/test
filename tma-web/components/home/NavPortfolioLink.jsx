"use client";

import Link from "next/link";

/**
 * Portfolio nav link.
 *
 * Sets a sessionStorage flag on click that V18Preloader reads to reset its
 * "already played" latch — so every time the user arrives at /portfolio-v18
 * via this link, they see the agency preloader animation (instead of being
 * dropped straight into the hero by the default Next router behavior).
 */
export default function NavPortfolioLink() {
  const onClick = () => {
    try {
      sessionStorage.setItem("v18-replay-preloader", "1");
    } catch {
      // sessionStorage can throw in privacy modes — fall back to default nav.
    }
  };

  return (
    <Link href="/portfolio-v18" onClick={onClick}>
      Portfolio
    </Link>
  );
}
