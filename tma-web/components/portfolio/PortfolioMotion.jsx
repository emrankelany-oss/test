"use client";
import { useReveal } from "@/lib/useReveal";
import { useCountUp } from "@/lib/useCountUp";

export default function PortfolioMotion() {
  useReveal("[data-reveal]");
  useCountUp("[data-countup]");
  return null;
}
