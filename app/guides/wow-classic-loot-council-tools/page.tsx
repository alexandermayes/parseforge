import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Loot Council Tools for WoW Classic",
  description:
    "Compare the top loot council and raid loot management tools for WoW Classic guilds — features, setup, and how to combine them with log analysis for fair loot distribution.",
  alternates: {
    canonical:
      "https://parseforge.gg/guides/wow-classic-loot-council-tools",
  },
  openGraph: {
    title: "Best Loot Council Tools for WoW Classic | ParseForge",
    description:
      "A practical comparison of loot council tools for WoW Classic guilds, plus how to use log data to make fair loot decisions.",
    url: "https://parseforge.gg/guides/wow-classic-loot-council-tools",
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
      name: "Best Loot Council Tools for WoW Classic",
      item: "https://parseforge.gg/guides/wow-classic-loot-council-tools",
    },
  ],
};

export default function LootCouncilToolsGuide() {
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
            Best Loot Council Tools for WoW Classic
          </h1>
          <p className="text-muted-foreground text-lg">
            Running loot council without good tooling leads to drama. Here&apos;s
            how to pick the right tools and combine them with log analysis for
            fairer, faster loot decisions.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Why Loot Council Needs Data
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Loot council works best when decisions are backed by evidence, not
            gut feeling. Tools that track attendance, performance trends, and
            gear gaps give your council objective criteria to point to — which
            reduces the &quot;why did they get loot over me?&quot; conversations
            that kill guilds.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            What to Look For in a Loot Tool
          </h2>
          <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-foreground">Loot list management</strong>{" "}
              — players submit their wishlists before raid so the council can
              plan ahead
            </li>
            <li>
              <strong className="text-foreground">Attendance tracking</strong>{" "}
              — automated logging of who shows up, ideally pulled from Warcraft
              Logs
            </li>
            <li>
              <strong className="text-foreground">Gear audit integration</strong>{" "}
              — see who actually needs an upgrade vs. who&apos;s fishing for
              minor sidegrades
            </li>
            <li>
              <strong className="text-foreground">Transparency</strong> — a
              master sheet or history view so the whole raid can see loot
              distribution over time
            </li>
            <li>
              <strong className="text-foreground">Performance context</strong>{" "}
              — log-based analysis showing who&apos;s putting in the work with
              their current gear
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Using Log Analysis for Loot Decisions
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            This is where{" "}
            <Link href="/" className="text-gold-from hover:underline">
              ParseForge
            </Link>{" "}
            fits in. Before your council meets, run the raid log through
            ParseForge to see:
          </p>
          <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
            <li>
              Which players have gear gaps flagged by the{" "}
              <Link
                href="/guides/how-to-analyze-wow-classic-logs"
                className="text-gold-from hover:underline"
              >
                gear audit
              </Link>
            </li>
            <li>
              Who&apos;s consistently performing well relative to their gear
              (high percentile with worse items = high-value loot target)
            </li>
            <li>
              Who&apos;s missing enchants or consumables — a sign they may not
              get the most out of new gear
            </li>
            <li>
              Buff uptime and activity percentages to complement attendance data
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            The Bottom Line
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The best loot council setup combines a loot tracking tool for
            wishlists and distribution history with a log analyzer like
            ParseForge for performance context. Objective data makes loot
            decisions defensible — and keeps your raiders happy.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-white/[0.06] bg-surface-1 p-5">
          <h2 className="text-sm font-semibold">Related Guides</h2>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link
                href="/guides/how-to-analyze-wow-classic-logs"
                className="text-gold-from hover:underline"
              >
                How to Analyze WoW Classic Logs
              </Link>
            </li>
            <li>
              <Link
                href="/guides/raid-preparation-checklist"
                className="text-gold-from hover:underline"
              >
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
