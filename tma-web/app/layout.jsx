import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter-tight",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata = {
  metadataBase: new URL("https://themotionagency.net"),
  title: {
    default: "The Motion Agency — Where Strategy Meets Bold Storytelling",
    template: "%s — The Motion Agency",
  },
  description:
    "A creative powerhouse with offices in Amman and Riyadh, delivering bold ideas and meaningful results across the GCC. We embed with B2B brands and build them into category leaders.",
  keywords: [
    "creative agency",
    "brand strategy",
    "GTM",
    "Amman",
    "Riyadh",
    "GCC",
    "B2B branding",
    "event marketing",
  ],
  openGraph: {
    title: "The Motion Agency — Where Strategy Meets Bold Storytelling",
    description:
      "A creative powerhouse with offices in Amman and Riyadh. We embed with B2B brands and build them into category leaders across the GCC.",
    url: "https://themotionagency.net",
    siteName: "The Motion Agency",
    images: [{ url: "/assets/case-foodics-boundless.png", width: 1600, height: 900 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Motion Agency",
    description: "Strategy meets bold storytelling. GCC-built category leaders.",
    images: ["/assets/case-foodics-boundless.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${interTight.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
