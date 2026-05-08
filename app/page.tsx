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

      {/* Below-fold SEO content — visible, crawlable */}
      <section className="w-full max-w-3xl mt-16 space-y-8 text-left border-t border-white/[0.06] pt-12">
        <div className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            What is ParseForge?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ParseForge analyzes your Warcraft Logs reports and compares your
            performance against top-ranked players on every boss fight. Paste any
            WoW Classic report URL to get a full performance breakdown — DPS
            percentile, gear audit, consumable tracking, buff uptime, talent
            comparison, and cast efficiency.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            How It Works
          </h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside leading-relaxed">
            <li>Paste a Warcraft Logs report URL</li>
            <li>Select a boss fight and your character</li>
            <li>
              Get a full performance breakdown with percentile rankings, gear
              audits, and buff tracking
            </li>
            <li>
              Review personalized improvement suggestions ranked by impact
            </li>
          </ol>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Supported Versions
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Classic Era, Season of Discovery, The Burning Crusade, Wrath of the
            Lich King, Cataclysm Classic, and Anniversary realms.
          </p>
        </div>
      </section>
    </main>
  );
}
