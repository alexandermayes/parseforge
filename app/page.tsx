import Link from "next/link";
import { LandingHero } from "./components/LandingHero";
import FeaturedReports from "./components/FeaturedReports";

// ISR: regenerate hourly so the server-rendered report links below stay fresh
// without a redeploy, and so the WCL meta fan-out in FeaturedReports runs at most
// once per hour rather than per request.
export const revalidate = 3600;

// Direct homepage → guide-article links. The Navbar only links the /guides hub;
// linking each article from the site's highest-authority page passes authority
// straight to the individual guides so the thinner ones get indexed.
const GUIDES = [
  { href: "/guides/how-to-analyze-wow-classic-logs", title: "How to Analyze WoW Classic Logs" },
  { href: "/guides/improve-dps-wow-classic", title: "How to Improve Your DPS in WoW Classic" },
  { href: "/guides/raid-preparation-checklist", title: "WoW Classic Raid Preparation Checklist" },
  { href: "/guides/wow-classic-loot-council-tools", title: "Best Loot Council Tools for WoW Classic" },
  { href: "/guides/warcraft-logs-vs-parseforge", title: "Warcraft Logs vs ParseForge" },
];

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
            TBC Raid Audit
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Running The Burning Crusade? The{" "}
            <Link href="/tbc-audit" className="text-gold-from hover:underline">
              TBC raid audit
            </Link>{" "}
            checks every raider for missing enchants, empty gem sockets, flasks,
            food buffs, weapon oils, raid buffs, and unspent talent points — the
            whole raid in one pass.
          </p>
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

        <FeaturedReports />

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Guides</h2>
          <ul className="space-y-2 text-sm leading-relaxed">
            {GUIDES.map((g) => (
              <li key={g.href}>
                <Link
                  href={g.href}
                  className="text-gold-from hover:underline"
                >
                  {g.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/guides" className="text-muted-foreground hover:text-foreground">
                All guides &rarr;
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
