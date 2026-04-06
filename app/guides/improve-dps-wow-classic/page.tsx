import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Improve Your DPS in WoW Classic",
  description:
    "Practical tips to increase your DPS in WoW Classic raids — consumables, enchants, rotation, buff uptime, and how to benchmark against top players with ParseForge.",
  alternates: {
    canonical: "https://parseforge.gg/guides/improve-dps-wow-classic",
  },
  openGraph: {
    title: "How to Improve Your DPS in WoW Classic | ParseForge",
    description:
      "Practical tips to increase your DPS in WoW Classic raids — consumables, enchants, rotation, and benchmarking.",
    url: "https://parseforge.gg/guides/improve-dps-wow-classic",
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
      name: "How to Improve Your DPS in WoW Classic",
      item: "https://parseforge.gg/guides/improve-dps-wow-classic",
    },
  ],
};

export default function ImproveDpsGuide() {
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
            How to Improve Your DPS in WoW Classic
          </h1>
          <p className="text-muted-foreground text-lg">
            Parsing higher in WoW Classic isn&apos;t just about mashing buttons
            faster. Most DPS gains come from preparation, uptime, and
            eliminating mistakes — not raw skill.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            1. Get Your Consumables Right
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Consumables are the single biggest &quot;free&quot; DPS increase.
            Flasks, elixirs, food buffs, weapon enhancements, and potions can
            add 10-20% to your total output depending on your class. Use
            ParseForge&apos;s consumable tracker to verify you had full uptime —
            a flask that falls off mid-fight is wasted gold.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            2. Enchant and Gem Every Slot
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Missing enchants and empty gem sockets are the most common
            performance leaks. Even temporary gear should be enchanted if
            you&apos;re raiding with it. ParseForge&apos;s gear audit flags
            every empty slot and mismatched gem color so nothing slips through
            the cracks.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            3. Maximize Your Active Time
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Activity percentage is one of the most underrated metrics. If
            you&apos;re only casting 85% of the fight, that&apos;s 15% of
            potential damage left on the table — no gear upgrade will fix that.
            Common culprits: running too far during mechanics, late
            target-switching on adds, and standing idle during transitions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            4. Nail Your Rotation Priorities
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Every class has a priority system for abilities. The difference
            between a 50th and 90th percentile parse is often just executing
            that priority correctly under pressure. Practice on target dummies,
            then check your logs to see if you&apos;re clipping DoTs, delaying
            cooldowns, or wasting global cooldowns on low-priority spells.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            5. Use the Right Talent Build
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Off-meta talent builds can cost you several percent of DPS.
            ParseForge compares your talents against the consensus build used by
            top players for your spec and encounter. One misplaced talent point
            usually isn&apos;t a dealbreaker, but a fundamentally different build
            can be.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            6. Maintain Buff Uptime
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Class buffs, debuffs on the boss, and self-buffs all need to stay
            active. A Warlock who lets Curse of Elements drop, or a Warrior who
            forgets Battle Shout, hurts the entire raid. Track your uptime
            in ParseForge to see exactly when buffs fell off and why.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            7. Benchmark Against Top Players
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The fastest way to improve is to compare yourself to someone doing
            it better. ParseForge pulls top-ranked data for your class, spec,
            and encounter so you can see exactly where the gap is — whether
            it&apos;s gear, consumables, uptime, or something else entirely.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            8. Track Your Progress Over Time
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Improvement isn&apos;t instant. Log every raid, analyze it
            afterward, pick one or two things to fix, and check the next log to
            see if it worked. ParseForge&apos;s history feature lets you track
            DPS trends and percentile changes across multiple raids on the same
            boss.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-white/[0.06] bg-surface-1 p-5">
          <h2 className="text-sm font-semibold">Related Guides</h2>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link href="/guides/how-to-analyze-wow-classic-logs" className="text-gold-from hover:underline">
                How to Analyze WoW Classic Logs
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
