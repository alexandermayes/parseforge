import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";
import PostHogProvider from "./components/PostHogProvider";
import ThemeProvider from "./components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://parseforge.gg"),
  title: {
    // Reverted from "Free WoW TBC Log Analyzer & Raid Audit". `tbc audit`
    // looked like generic tool intent, but it's navigational for the
    // competitor tbc-audit.com: 0.58% CTR at position 4.7, ~10x below what
    // that position should yield, while every qualified variant
    // (`wow tbc audit`, `raid audit tbc`) converts 5-20x better. Chasing it
    // cost the title length that "Classic" needs — `wow classic log
    // analyzer` converts at 33%. Audit intent lives on /tbc-audit instead.
    default: "Free WoW Classic & TBC Log Analyzer — ParseForge",
    template: "%s | ParseForge",
  },
  description:
    "Paste a Warcraft Logs URL to audit your TBC or Classic raid in seconds — compare DPS and HPS against top parses, and catch missing gear, gems, enchants, buffs, and consumables.",
  keywords: [
    "WoW Classic",
    "Warcraft Logs",
    "WoW log analyzer",
    "DPS analysis",
    "raid analysis",
    "WoW Classic TBC",
    "WoW Classic WotLK",
    "TBC audit",
    "raid audit",
    "TBC Anniversary logs",
    "gear audit",
    "buff tracking",
    "consumable tracking",
    "raid performance",
    "WoW parse",
    "log analyzer",
    "ParseForge",
  ],
  authors: [{ name: "ParseForge" }],
  creator: "ParseForge",
  alternates: {
    canonical: "https://parseforge.gg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://parseforge.gg",
    siteName: "ParseForge",
    title: "ParseForge — Free WoW Classic & TBC Log Analyzer",
    description:
      "Free WoW Classic & TBC log analyzer — paste a Warcraft Logs URL to compare your raid DPS against top players, audit gear and buffs, and get improvement tips.",
    images: [
      {
        url: "https://parseforge.gg/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ParseForge — WoW Classic Log Analyzer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ParseForge — Free WoW Classic & TBC Log Analyzer",
    description:
      "Free WoW Classic & TBC log analyzer — paste a Warcraft Logs URL to compare your raid DPS against top players, audit gear and buffs, and get improvement tips.",
    images: ["https://parseforge.gg/opengraph-image"],
  },
};

const GOOGLE_CMP_PUB_ID = process.env.NEXT_PUBLIC_GOOGLE_CMP_PUB_ID ?? "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="wowhead-config" strategy="beforeInteractive">
          {`const whTooltips = {colorLinks: true, iconizeLinks: true, renameLinks: true, iconSize: 'small'};`}
        </Script>
        <Script
          src="https://wow.zamimg.com/js/tooltips.js"
          strategy="afterInteractive"
        />
        {GOOGLE_CMP_PUB_ID && (
          <Script
            id="google-cmp"
            src={`https://fundingchoicesmessages.google.com/i/${GOOGLE_CMP_PUB_ID}?ers=1`}
            strategy="afterInteractive"
            async
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background bg-noise`}
      >
        <ThemeProvider>
          <PostHogProvider>
            <Navbar />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16">
              {children}
            </div>
          </PostHogProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
