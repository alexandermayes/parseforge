import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WoW Classic Raid Preparation Checklist",
  description:
    "Complete raid prep checklist for WoW Classic — consumables, enchants, gems, talents, world buffs, and how to verify everything with ParseForge before raid night.",
  alternates: {
    canonical:
      "https://parseforge.gg/guides/raid-preparation-checklist",
  },
  openGraph: {
    title: "WoW Classic Raid Preparation Checklist | ParseForge",
    description:
      "Everything you need before raid night — consumables, enchants, gems, talents, and verification.",
    url: "https://parseforge.gg/guides/raid-preparation-checklist",
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
      name: "WoW Classic Raid Preparation Checklist",
      item: "https://parseforge.gg/guides/raid-preparation-checklist",
    },
  ],
};

export default function RaidPrepGuide() {
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
            WoW Classic Raid Preparation Checklist
          </h1>
          <p className="text-muted-foreground text-lg">
            A no-nonsense checklist for everything you should have sorted before
            the first pull. Use ParseForge after your raid to verify you
            didn&apos;t miss anything.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Gear</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                All slots have the best available gear equipped — check your
                bank and bags for upgrades you forgot to swap in.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Every piece is fully repaired. Broken gear mid-boss is an
                avoidable wipe.
              </span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Enchants</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Every enchantable slot has an enchant — head, shoulders, chest,
                wrists, gloves, legs, boots, and weapons.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Enchants match your spec&apos;s stat priority (spell power for
                casters, attack power or agility for melee, etc.).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Temporary weapon enchants (sharpening stones, wizard oil) are
                stocked in your bags.
              </span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Gems (TBC / WotLK / Cata)</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                No empty gem sockets. Even a cheap gem beats an empty slot.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Socket bonuses are evaluated — sometimes ignoring the bonus for
                a pure stat gem is better.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Meta gem is active (check that color requirements are met).
              </span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Talents</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Talent build matches the current raid tier. Some bosses reward
                different builds.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Glyphs (WotLK / Cata) are correctly set for PvE content.
              </span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Consumables</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Flask or elixirs for the full raid duration (bring extras for
                wipes).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Stat food — at least 20 portions for a full clear night.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Potions for pre-pot and in-combat use (haste potions, mana
                potions, etc.).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Healthstones and bandages as emergency survivability tools.
              </span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">World Buffs (Classic Era / SoD)</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Coordinate with your guild for buff timing — Rallying Cry of the
                Dragonslayer, Songflower, DMF buff, etc.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Log out in the instance or use Chronoboon to preserve buffs
                until raid time.
              </span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Logging</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Enable combat logging with{" "}
                <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">
                  /combatlog
                </code>{" "}
                before the first pull.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-from" />
              <span>
                Upload to Warcraft Logs after the raid and paste the URL into{" "}
                <Link href="/" className="text-gold-from hover:underline">
                  ParseForge
                </Link>{" "}
                to verify your prep was solid.
              </span>
            </li>
          </ul>
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
              <Link href="/guides/improve-dps-wow-classic" className="text-gold-from hover:underline">
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
