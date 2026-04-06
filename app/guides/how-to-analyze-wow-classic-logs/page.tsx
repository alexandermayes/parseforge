import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Analyze WoW Classic Logs",
  description:
    "Learn how to read Warcraft Logs reports and use ParseForge to compare your WoW Classic raid performance against top-ranked players. Step-by-step guide.",
  alternates: {
    canonical:
      "https://parseforge.gg/guides/how-to-analyze-wow-classic-logs",
  },
  openGraph: {
    title: "How to Analyze WoW Classic Logs | ParseForge",
    description:
      "Step-by-step guide to reading Warcraft Logs reports and turning raw data into actionable raid improvements.",
    url: "https://parseforge.gg/guides/how-to-analyze-wow-classic-logs",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://parseforge.gg",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Guides",
      item: "https://parseforge.gg/guides",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "How to Analyze WoW Classic Logs",
      item: "https://parseforge.gg/guides/how-to-analyze-wow-classic-logs",
    },
  ],
};

export default function AnalyzeLogsGuide() {
  return (
    <main className="mx-auto max-w-3xl py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="prose-custom space-y-8">
        <header className="space-y-3">
          <Link
            href="/guides"
            className="text-sm text-muted-foreground hover:text-gold-from"
          >
            &larr; All Guides
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">
            How to Analyze WoW Classic Logs
          </h1>
          <p className="text-muted-foreground text-lg">
            Warcraft Logs captures everything that happens in a raid, but raw
            data isn&apos;t the same as insight. This guide walks you through
            reading a log report and using ParseForge to surface the changes
            that actually matter.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Step 1: Upload Your Log to Warcraft Logs
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            If you haven&apos;t already, install the{" "}
            <a
              href="https://www.warcraftlogs.com/client/download"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-from hover:underline"
            >
              Warcraft Logs Uploader
            </a>
            . Enable combat logging in-game with{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">
              /combatlog
            </code>{" "}
            before the raid, then upload the file after. You&apos;ll get a
            unique report URL like{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">
              classic.warcraftlogs.com/reports/abc123
            </code>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Step 2: Paste the URL into ParseForge
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Head to{" "}
            <Link href="/" className="text-gold-from hover:underline">
              parseforge.gg
            </Link>{" "}
            and paste your report URL. ParseForge pulls your data from the
            Warcraft Logs API and immediately starts comparing your performance
            against top-ranked players for every boss fight in the report.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Step 3: Pick a Fight and Your Character
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Use the fight selector to choose a boss encounter, then pick your
            character from the raid roster. ParseForge focuses the analysis on
            your performance for that specific kill.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Step 4: Read the DPS &amp; HPS Analysis
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The summary tab shows your DPS or HPS compared to the median and
            top-performing players for your class and spec on that encounter.
            Percentile rankings tell you where you stand relative to all logged
            kills — a 50th-percentile parse means half of players did more
            damage and half did less.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Step 5: Audit Your Gear, Enchants &amp; Gems
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The gear audit compares every slot of your equipment against what
            top players use. Missing enchants, empty gem sockets, and mismatched
            gem colors are flagged instantly. This is often the fastest way to
            find free performance — a missing enchant on gloves can cost you
            hundreds of DPS for virtually no effort to fix.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Step 6: Check Consumables &amp; Buffs
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            ParseForge tracks your flask, elixir, food buff, and weapon
            enhancement uptime throughout the fight. Dropped buffs mid-fight are
            highlighted so you know exactly when your consumable coverage
            slipped.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Step 7: Review the Raid Overview
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The raid overview tab gives officers and raid leaders a bird&apos;s-eye
            view of the entire raid — throughput rankings, death counts,
            consumable compliance, and activity percentages for every player.
            Use it to spot patterns: if half the raid dropped food buffs on the
            same pull, that&apos;s a systemic issue worth addressing.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What to Do with the Results</h2>
          <p className="text-muted-foreground leading-relaxed">
            Focus on the highest-impact suggestions first. A missing enchant or
            dropped flask is a bigger gain than squeezing one extra cast into
            your rotation. Work through improvements one at a time, re-log your
            next raid, and compare again to track your progress over time.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-white/[0.06] bg-surface-1 p-5">
          <h2 className="text-sm font-semibold">Related Guides</h2>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link href="/guides/improve-dps-wow-classic" className="text-gold-from hover:underline">
                How to Improve Your DPS in WoW Classic
              </Link>
            </li>
            <li>
              <Link href="/guides/raid-preparation-checklist" className="text-gold-from hover:underline">
                WoW Classic Raid Preparation Checklist
              </Link>
            </li>
          </ul>
        </section>

        <footer className="flex items-center justify-between border-t border-white/[0.06] pt-6">
          <Link
            href="/guides"
            className="text-sm text-muted-foreground hover:text-gold-from"
          >
            &larr; All Guides
          </Link>
          <Link href="/" className="text-sm text-gold-from hover:underline">
            Try ParseForge &rarr;
          </Link>
        </footer>
      </article>
    </main>
  );
}
