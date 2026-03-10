import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    default: "ParseForge — WoW Classic Log Analyzer",
    template: "%s | ParseForge",
  },
  description:
    "Analyze your WoW Classic raid logs against top-ranked players. Get DPS comparisons, gear audits, consumable tracking, buff uptime analysis, and improvement suggestions — all from a single Warcraft Logs URL.",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://parseforge.gg",
    siteName: "ParseForge",
    title: "ParseForge — WoW Classic Log Analyzer",
    description:
      "Analyze your WoW Classic raid logs against top-ranked players. DPS comparisons, gear audits, buff tracking, and actionable improvement suggestions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ParseForge — WoW Classic Log Analyzer",
    description:
      "Analyze your WoW Classic raid logs against top-ranked players. DPS comparisons, gear audits, buff tracking, and improvement suggestions.",
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
      </body>
    </html>
  );
}
