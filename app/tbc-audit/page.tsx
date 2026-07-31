import type { Metadata } from "next";
import Link from "next/link";
import { Gem, FlaskConical, Sparkles, ScrollText } from "lucide-react";
import ReportUrlForm from "@/app/components/ReportUrlForm";

// Dedicated landing page for `tbc audit` search intent. GSC (Jul 2026) shows
// ~3.3k impressions/28d at position ~4.9 for that query with the homepage as
// the only thing ranking — unlike the navigational "wow tbc logs" cluster,
// these searchers want an auditing tool, which is exactly the Buff & Gear
// Audit tab. This page targets that intent directly instead of making the
// general-purpose homepage compete for it.
export const metadata: Metadata = {
  // Keep short: the root layout appends " | ParseForge" (13 chars), so this
  // must stay under ~47 to survive SERP truncation at ~60.
  title: "WoW TBC Raid Audit — Free Buff & Gear Checker",
  description:
    "Free TBC raid audit. Paste a Warcraft Logs URL to check every raider for missing enchants, empty gem sockets, flasks, food buffs, weapon oils, and raid buffs.",
  alternates: {
    canonical: "https://parseforge.gg/tbc-audit",
  },
  openGraph: {
    title: "WoW TBC Raid Audit — Free Buff & Gear Checker | ParseForge",
    description:
      "Paste a Warcraft Logs URL to audit your whole TBC raid for missing enchants, gems, flasks, food, weapon oils, and raid buffs.",
    url: "https://parseforge.gg/tbc-audit",
  },
};

const GEAR_CHECKS = [
  {
    label: "Missing enchants",
    severity: "CRITICAL",
    detail:
      "Every enchantable slot is checked against what the player actually had equipped during the pull.",
  },
  {
    label: "Empty gem sockets",
    severity: "WARNING",
    detail: "Sockets left unfilled on otherwise raid-ready gear.",
  },
  {
    label: "Wrong gem type",
    severity: "WARNING",
    detail:
      "Gems that don't match the socket color or the player's role — a stamina gem in a caster's gear, for example.",
  },
  {
    label: "Missing weapon oil or sharpening stone",
    severity: "NOTE",
    detail:
      "Superior Wizard Oil, Superior Mana Oil, Adamantite Sharpening Stone, Fel Sharpening Stone and the rest of the TBC set.",
  },
  {
    label: "Under-leveled items",
    severity: "NOTE",
    detail:
      "Pieces well below the item level of the rest of the raider's gear, flagged as likely upgrade slots.",
  },
];

const CONSUMABLE_CHECKS = [
  {
    icon: FlaskConical,
    title: "Flasks & elixirs",
    body: "Flasks, plus the battle-elixir and guardian-elixir pairing that TBC raiders run instead. A raider with only one half of the pair gets flagged.",
  },
  {
    icon: ScrollText,
    title: "Food buffs & scrolls",
    body: "Well Fed food buffs and stat scrolls, checked per pull rather than per night — so a raider who ate before the first boss and never again is visible.",
  },
  {
    icon: Sparkles,
    title: "Raid buffs",
    body: "Paladin Blessings, Power Word: Fortitude and the other class buff families, matched against the roles that should have received them. Blessing of Salvation on a tank is called out as a threat problem.",
  },
  {
    icon: Gem,
    title: "Talent builds",
    body: "Incomplete builds — a TBC raider should have all 61 talent points spent, and unspent points are easy to miss for weeks.",
  },
];

const FAQ = [
  {
    q: "What does the TBC raid audit check?",
    a: "Gear (missing enchants, empty or mismatched gem sockets, missing weapon oils and sharpening stones, under-leveled items), consumables (flasks, battle and guardian elixirs, food buffs, scrolls), raid buffs from every buff-giving class, and incomplete talent builds. Every check runs for the whole raid at once, per pull.",
  },
  {
    q: "Is it free?",
    a: "Yes. ParseForge is free, there is no account to create, and there is no limit on how many reports you can audit.",
  },
  {
    q: "Do I need to install an addon?",
    a: "No. The audit reads a Warcraft Logs report you have already uploaded, so anything your raid logged is available. Nothing gets installed in-game.",
  },
  {
    q: "Which TBC raids are supported?",
    a: "Karazhan, Gruul's Lair, Magtheridon's Lair, Serpentshrine Cavern, Tempest Keep, Hyjal Summit, Black Temple, Sunwell Plateau, and Zul'Aman — including TBC Anniversary realms.",
  },
  {
    q: "Can I audit a single raider instead of the whole raid?",
    a: "Yes. The audit runs raid-wide by default, and you can also open any individual character to see their gear, consumables, buff uptime, and talent build on their own.",
  },
  {
    q: "Does it work for Classic Era and Wrath too?",
    a: "Yes. ParseForge supports Classic Era, Season of Discovery, The Burning Crusade, Wrath of the Lich King, Cataclysm Classic, and Anniversary realms. The consumable, enchant, and talent databases switch to match the expansion your log came from.",
  },
];

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
      name: "TBC Raid Audit",
      item: "https://parseforge.gg/tbc-audit",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

function severityClass(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "badge-bad";
    case "WARNING":
      return "badge-warn";
    default:
      return "badge-info";
  }
}

export default function TbcAuditPage() {
  return (
    <main className="mx-auto max-w-3xl py-16 space-y-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="space-y-5">
        <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">
          WoW TBC Raid Audit
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Paste a Warcraft Logs report URL and ParseForge audits every raider in
          it — missing enchants, empty gem sockets, flasks, food buffs, weapon
          oils, raid buffs, and unspent talent points. Free, no account, no
          addon.
        </p>
        <ReportUrlForm />
      </header>

      <section className="space-y-5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Gear checks
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Gear is read from the combat log itself, so it reflects what each
          raider actually had on during the pull — not what they were wearing
          when they last logged out.
        </p>
        <ul className="space-y-3">
          {GEAR_CHECKS.map((c) => (
            <li
              key={c.label}
              className="rounded-xl border border-white/[0.06] bg-surface-1 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">{c.label}</span>
                <span className={severityClass(c.severity)}>{c.severity}</span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {c.detail}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Consumable, buff & talent checks
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CONSUMABLE_CHECKS.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-white/[0.06] bg-surface-1 p-5"
            >
              <div className="flex items-start gap-3">
                <c.icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-from" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {c.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          How to audit your TBC raid
        </h2>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside leading-relaxed">
          <li>Upload your raid night to Warcraft Logs as usual.</li>
          <li>Paste the report URL into the box above.</li>
          <li>
            Open the <strong className="text-foreground">Buff &amp; Gear Audit</strong>{" "}
            tab to see the whole raid at once.
          </li>
          <li>
            Filter to a single pull, or to one raider, to work through what came
            back.
          </li>
        </ol>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Findings are ordered by severity, so missing enchants surface above
          cosmetic notes. A raid of 25 usually has a handful of genuine problems
          buried in it, and they tend to be the same two or three people every
          week.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQ.map((f) => (
            <div key={f.q} className="space-y-1.5">
              <h3 className="font-semibold text-foreground">{f.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold text-foreground">Related guides</h2>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li>
            <Link
              href="/guides/raid-preparation-checklist"
              className="text-gold-from hover:underline"
            >
              WoW Classic Raid Preparation Checklist
            </Link>{" "}
            <span className="text-muted-foreground">
              — what to fix before the audit finds it
            </span>
          </li>
          <li>
            <Link
              href="/guides/how-to-analyze-wow-classic-logs"
              className="text-gold-from hover:underline"
            >
              How to Analyze WoW Classic Logs
            </Link>{" "}
            <span className="text-muted-foreground">
              — the full report walkthrough
            </span>
          </li>
          <li>
            <Link
              href="/guides/improve-dps-wow-classic"
              className="text-gold-from hover:underline"
            >
              How to Improve Your DPS in WoW Classic
            </Link>
          </li>
          <li>
            <Link href="/guides" className="text-muted-foreground hover:text-foreground">
              All guides &rarr;
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
