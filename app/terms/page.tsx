import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using ParseForge — a free, informational WoW Classic / TBC raid-log analyzer not affiliated with Blizzard or Warcraft Logs.",
  alternates: {
    canonical: "https://parseforge.gg/terms",
  },
  openGraph: {
    title: "Terms of Service | ParseForge",
    description:
      "The terms for using ParseForge, a free, informational WoW Classic / TBC raid-log analyzer.",
    url: "https://parseforge.gg/terms",
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
      name: "Terms of Service",
      item: "https://parseforge.gg/terms",
    },
  ],
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="prose-custom space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: 2026-09-06
          </p>
          <p className="text-muted-foreground text-lg">
            Short and plain-language, because ParseForge is a small free tool,
            not a business you&apos;re signing a contract with.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">The service</h2>
          <p className="text-muted-foreground">
            ParseForge is a free tool, operated by an individual, provided
            &quot;as is&quot; with no service-level commitment. It may
            change, break, or go away at any time without notice.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Not affiliated with Blizzard or Warcraft Logs
          </h2>
          <p className="text-muted-foreground">
            ParseForge is not affiliated with, endorsed by, or sponsored by
            Blizzard Entertainment or Warcraft Logs (RPGLogs). World of
            Warcraft and related marks are trademarks of Blizzard
            Entertainment.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Analysis is informational</h2>
          <p className="text-muted-foreground">
            The DPS/HPS comparisons, gear and consumable audits, and
            improvement suggestions ParseForge produces are informational
            only. We make no warranty that they are accurate, complete, or
            right for your character or situation. Use them at your own
            risk.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Acceptable use</h2>
          <p className="text-muted-foreground">
            Don&apos;t scrape the site, run automated bulk queries against
            it, try to circumvent rate limits, or otherwise use it in a way
            that disrupts or abuses the service or the upstream Warcraft
            Logs API. Report data itself is Warcraft Logs&apos; public data
            and remains subject to Warcraft Logs&apos; own terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Limitation of liability</h2>
          <p className="text-muted-foreground">
            To the maximum extent permitted by law, the operator is not
            liable for any damages arising out of your use of ParseForge.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Governing law</h2>
          <p className="text-muted-foreground">
            These terms are governed by the laws of the State of California,
            USA.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Changes to these terms</h2>
          <p className="text-muted-foreground">
            If these terms change, we&apos;ll post the update here with a new
            &quot;Last updated&quot; date at the top of the page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            Questions about these terms? Email{" "}
            <a
              href="mailto:info@lootlistplus.com"
              className="text-gold-from hover:underline"
            >
              info@lootlistplus.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-white/[0.06] bg-surface-1 p-5">
          <h2 className="text-sm font-semibold">Related</h2>
          <p className="text-sm">
            <Link href="/privacy" className="text-gold-from hover:underline">
              Privacy Policy
            </Link>
          </p>
        </section>
      </article>
    </main>
  );
}
