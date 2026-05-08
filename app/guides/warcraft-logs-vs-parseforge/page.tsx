import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Warcraft Logs vs ParseForge — What's the Difference?",
  description:
    "Warcraft Logs stores your raid data. ParseForge analyzes it. Learn how they complement each other and when to use which tool for WoW Classic raid improvement.",
  alternates: {
    canonical: "https://parseforge.gg/guides/warcraft-logs-vs-parseforge",
  },
  openGraph: {
    title: "Warcraft Logs vs ParseForge | ParseForge",
    description:
      "How ParseForge and Warcraft Logs work together to help you improve your WoW Classic raid performance.",
    url: "https://parseforge.gg/guides/warcraft-logs-vs-parseforge",
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
      name: "Warcraft Logs vs ParseForge",
      item: "https://parseforge.gg/guides/warcraft-logs-vs-parseforge",
    },
  ],
};

export default function WCLvsParseForgeGuide() {
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
            Warcraft Logs vs ParseForge
          </h1>
          <p className="text-muted-foreground text-lg">
            Warcraft Logs stores your raid data. ParseForge analyzes it.
            Here&apos;s how they work together and when to use which.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            What Warcraft Logs Does Well
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Warcraft Logs is the gold standard for combat log hosting. It
            captures every event in your raid — damage, healing, deaths, buffs,
            debuffs, positioning — and presents it in detailed tables and
            timelines. It also provides server-wide and global rankings so you
            can see how your parse stacks up.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            If you need to know exactly what happened at timestamp 2:34 of your
            Kel&apos;Thuzad kill, Warcraft Logs is the place to look.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Where ParseForge Adds Value</h2>
          <p className="text-muted-foreground leading-relaxed">
            ParseForge sits on top of the Warcraft Logs API and answers a
            different question: <em>what should I change for next raid?</em>
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Instead of browsing raw tables, you paste a report URL and get:
          </p>
          <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-foreground">Percentile context</strong> —
              your DPS/HPS compared to top players for your spec on that boss
            </li>
            <li>
              <strong className="text-foreground">Gear audit</strong> — missing
              enchants, empty gem sockets, and item comparisons against
              top-performing players
            </li>
            <li>
              <strong className="text-foreground">
                Consumable &amp; buff tracking
              </strong>{" "}
              — uptime percentages for flasks, elixirs, food, and weapon
              enhancements across the fight
            </li>
            <li>
              <strong className="text-foreground">Talent comparison</strong> —
              your build vs. the consensus build used by top-ranked players
            </li>
            <li>
              <strong className="text-foreground">Raid overview</strong> — a
              single-screen view of every player&apos;s throughput, deaths,
              consumables, and activity
            </li>
            <li>
              <strong className="text-foreground">Actionable suggestions</strong>{" "}
              — ranked by impact so you know what to fix first
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Side-by-Side Comparison</h2>
          <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-surface-1">
                  <th className="px-4 py-2.5 text-left font-medium text-foreground">
                    Feature
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-foreground">
                    Warcraft Logs
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-foreground">
                    ParseForge
                  </th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-white/[0.04]">
                  <td className="px-4 py-2">Log hosting &amp; upload</td>
                  <td className="px-4 py-2 text-emerald-400">Yes</td>
                  <td className="px-4 py-2">No (uses WCL data)</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="px-4 py-2">Raw event timeline</td>
                  <td className="px-4 py-2 text-emerald-400">Yes</td>
                  <td className="px-4 py-2">No</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="px-4 py-2">Global rankings</td>
                  <td className="px-4 py-2 text-emerald-400">Yes</td>
                  <td className="px-4 py-2">Uses WCL rankings</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="px-4 py-2">Gear &amp; enchant audit</td>
                  <td className="px-4 py-2">Basic</td>
                  <td className="px-4 py-2 text-emerald-400">
                    Detailed + comparison
                  </td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="px-4 py-2">Consumable uptime</td>
                  <td className="px-4 py-2">Manual lookup</td>
                  <td className="px-4 py-2 text-emerald-400">Automatic</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="px-4 py-2">Talent comparison</td>
                  <td className="px-4 py-2">No</td>
                  <td className="px-4 py-2 text-emerald-400">
                    vs. top players
                  </td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="px-4 py-2">Raid-wide overview</td>
                  <td className="px-4 py-2">Separate tabs</td>
                  <td className="px-4 py-2 text-emerald-400">
                    Single screen
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Improvement suggestions</td>
                  <td className="px-4 py-2">No</td>
                  <td className="px-4 py-2 text-emerald-400">
                    Ranked by impact
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Use Them Together</h2>
          <p className="text-muted-foreground leading-relaxed">
            The best workflow is to use both. Upload your log to Warcraft Logs as
            usual, then paste the report URL into{" "}
            <Link href="/" className="text-gold-from hover:underline">
              ParseForge
            </Link>{" "}
            for a quick performance summary and improvement roadmap. When you
            need to dig into a specific mechanic or death, switch back to the
            full Warcraft Logs timeline.
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
                href="/guides/improve-dps-wow-classic"
                className="text-gold-from hover:underline"
              >
                How to Improve Your DPS in WoW Classic
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
