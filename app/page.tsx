import { LandingHero } from "./components/LandingHero";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ParseForge",
  url: "https://parseforge.gg",
  description:
    "Free WoW Classic log analyzer. Compare your raid performance against top-ranked players — DPS, gear, consumables, buffs, and talents.",
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "DPS and HPS percentile analysis",
    "Gear and enchant auditing",
    "Consumable and buff uptime tracking",
    "Raid-wide performance overview",
    "Talent build comparison",
    "Personal improvement tracking across raids",
  ],
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingHero />

      {/* Server-rendered SEO content — hidden visually, crawlable by search engines */}
      <section className="sr-only" aria-hidden="false">
        <h2>ParseForge — WoW Classic Raid Log Analyzer</h2>
        <p>ParseForge analyzes your Warcraft Logs reports and compares your performance against top-ranked players on every boss fight. Paste any WoW Classic, TBC, WotLK, or Season of Discovery report URL to get started.</p>
        <h3>How It Works</h3>
        <p>1. Paste a Warcraft Logs report URL. 2. Select a boss fight and your character. 3. Get a full performance breakdown — DPS percentile, gear audit, consumable tracking, buff uptime, talent comparison, and cast efficiency. 4. Review personalized improvement suggestions ranked by impact.</p>
        <h3>Features</h3>
        <p>DPS and HPS percentile analysis. Gear and enchant auditing. Consumable and buff uptime tracking. Raid-wide performance overview. Talent build comparison. Personal improvement tracking across raids.</p>
        <h3>Supported Versions</h3>
        <p>Classic Era, Season of Discovery, The Burning Crusade, Wrath of the Lich King, Cataclysm Classic, and Anniversary realms.</p>
      </section>
    </main>
  );
}
