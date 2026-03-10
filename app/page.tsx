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

      {/* Server-rendered SEO content — visible to crawlers, visually subtle */}
      <section className="w-full max-w-3xl mt-20 space-y-12 text-sm text-muted-foreground/70 leading-relaxed">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">WoW Classic Log Analyzer</h2>
          <p>
            ParseForge analyzes your Warcraft Logs reports and compares your performance against top-ranked players on every boss fight. Paste any WoW Classic, TBC, WotLK, or Season of Discovery report URL to get started.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">How It Works</h2>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Paste a Warcraft Logs report URL</li>
            <li>Select a boss fight and your character</li>
            <li>Get a full performance breakdown — DPS percentile, gear audit, consumable tracking, buff uptime, talent comparison, and cast efficiency</li>
            <li>Review personalized improvement suggestions ranked by impact</li>
          </ol>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <h3 className="font-medium text-foreground/80">DPS & HPS Analysis</h3>
              <p>See how your throughput stacks up against the median and top players for your spec and encounter, with percentile rankings.</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground/80">Gear & Enchant Audit</h3>
              <p>Identify missing enchants, empty gem sockets, and compare your gear choices against what top-performing players use.</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground/80">Raid Overview</h3>
              <p>View every player in the raid at a glance — throughput, deaths, consumables, activity, and avoidable damage taken.</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground/80">Buff & Consumable Tracking</h3>
              <p>Track flask, elixir, food, and weapon enhancement uptime for every player across all boss fights in the raid.</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground/80">Talent Comparison</h3>
              <p>Compare your talent build against the consensus build used by top-ranked players for your spec.</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground/80">Personal History</h3>
              <p>Track your improvement over time. See DPS trends, percentile changes, and score deltas between raids on the same boss.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Supported Versions</h2>
          <p>
            ParseForge supports all WoW Classic versions available on Warcraft Logs — Classic Era, Season of Discovery, The Burning Crusade, Wrath of the Lich King, Cataclysm Classic, and Anniversary realms.
          </p>
        </div>
      </section>
    </main>
  );
}
