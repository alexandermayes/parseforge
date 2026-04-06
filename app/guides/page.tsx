import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, TrendingUp, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "WoW Classic Guides",
  description:
    "Free guides to improve your WoW Classic raid performance — log analysis tutorials, DPS optimization tips, and raid preparation checklists.",
  alternates: {
    canonical: "https://parseforge.gg/guides",
  },
  openGraph: {
    title: "WoW Classic Guides | ParseForge",
    description:
      "Free guides to improve your WoW Classic raid performance — log analysis, DPS optimization, and raid prep.",
    url: "https://parseforge.gg/guides",
  },
};

const guides = [
  {
    href: "/guides/how-to-analyze-wow-classic-logs",
    icon: BookOpen,
    title: "How to Analyze WoW Classic Logs",
    description:
      "A step-by-step walkthrough of reading Warcraft Logs reports and using ParseForge to turn raw data into actionable improvements.",
  },
  {
    href: "/guides/improve-dps-wow-classic",
    icon: TrendingUp,
    title: "How to Improve Your DPS in WoW Classic",
    description:
      "Practical tips for boosting your damage output — from rotation fundamentals and consumables to gear optimization and buff uptime.",
  },
  {
    href: "/guides/raid-preparation-checklist",
    icon: Shield,
    title: "WoW Classic Raid Preparation Checklist",
    description:
      "Everything you need before pulling the first boss — consumables, enchants, talents, world buffs, and how to verify it all with ParseForge.",
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
      name: "Guides",
      item: "https://parseforge.gg/guides",
    },
  ],
};

export default function GuidesIndex() {
  return (
    <main className="mx-auto max-w-3xl py-16 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">
          WoW Classic Guides
        </h1>
        <p className="text-muted-foreground">
          Practical guides to help you get more out of your raid logs and improve
          your performance in WoW Classic.
        </p>
      </div>

      <div className="grid gap-4">
        {guides.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="group rounded-xl border border-white/[0.06] bg-surface-1 p-5 transition-colors hover:border-gold-from/30 hover:bg-surface-2"
          >
            <div className="flex items-start gap-4">
              <g.icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-from" />
              <div className="space-y-1">
                <h2 className="font-semibold group-hover:text-gold-from transition-colors">
                  {g.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {g.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="pt-4 text-center">
        <Link href="/" className="text-sm text-gold-from hover:underline">
          &larr; Back to ParseForge
        </Link>
      </div>
    </main>
  );
}
