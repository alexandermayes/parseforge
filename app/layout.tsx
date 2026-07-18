import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";
import PostHogProvider from "./components/PostHogProvider";

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
    default: "Free WoW Classic & TBC Log Analyzer — ParseForge",
    template: "%s | ParseForge",
  },
  description:
    "Free WoW Classic & TBC log analyzer — paste a Warcraft Logs URL to compare your raid DPS against top players, audit gear and buffs, and get improvement tips.",
  keywords: [
    "WoW Classic",
    "Warcraft Logs",
    "WoW log analyzer",
    "DPS analysis",
    "raid analysis",
    "WoW Classic TBC",
    "WoW Classic WotLK",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script id="wowhead-config" strategy="beforeInteractive">
          {`const whTooltips = {colorLinks: true, iconizeLinks: true, renameLinks: true, iconSize: 'small'};`}
        </Script>
        <Script
          src="https://wow.zamimg.com/js/tooltips.js"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background bg-noise`}
      >
        <PostHogProvider>
          <Navbar />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16">
            {children}
          </div>
        </PostHogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
