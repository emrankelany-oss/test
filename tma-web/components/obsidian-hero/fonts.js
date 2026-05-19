import { Fraunces, Space_Grotesk } from "next/font/google";

// Editorial high-contrast display serif (OA-grade) + grotesk for labels.
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--oh-serif",
});

export const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--oh-sans",
});
