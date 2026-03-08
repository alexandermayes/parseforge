import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ParseForge — Warcraft Logs Performance Analysis",
  description:
    "Compare your WoW Classic / SoD raid performance against top-ranked players. Get actionable improvement suggestions for DPS, gear, talents, buffs, and rotation.",
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
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16">
          {children}
        </div>
      </body>
    </html>
  );
}
