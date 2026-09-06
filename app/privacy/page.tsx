import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ParseForge handles your data — Warcraft Logs report processing, Upstash caching, PostHog analytics, consent choices, and your privacy rights.",
  alternates: {
    canonical: "https://parseforge.gg/privacy",
  },
  openGraph: {
    title: "Privacy Policy | ParseForge",
    description:
      "How ParseForge handles your data — report processing, caching, analytics, and your privacy rights.",
    url: "https://parseforge.gg/privacy",
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
      name: "Privacy Policy",
      item: "https://parseforge.gg/privacy",
    },
  ],
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="prose-custom space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: 2026-09-06
          </p>
          <p className="text-muted-foreground text-lg">
            ParseForge is a small, free tool. This page explains what data we
            process, why, and what choices you have — in plain language, not
            legalese.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Who we are</h2>
          <p className="text-muted-foreground">
            ParseForge (parseforge.gg) is a free WoW Classic / TBC raid-log
            analyzer, operated by an individual, not a company. If you have
            questions about this policy or your data, email{" "}
            <a
              href="mailto:info@lootlistplus.com"
              className="text-gold-from hover:underline"
            >
              info@lootlistplus.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What ParseForge processes</h2>
          <p className="text-muted-foreground">
            When you paste a Warcraft Logs report URL, ParseForge fetches the
            public report data from Warcraft Logs&apos; API on your behalf and
            analyzes it. That data — and the analysis we compute from it — is
            cached temporarily on our servers (via Upstash Redis) so that
            repeat views of the same report load quickly, typically for
            roughly 5&ndash;10 minutes per cached result before it expires.
          </p>
          <p className="text-muted-foreground">
            If a report is public, its code is also kept in a short list
            (internally called <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">pf:recent_reports</code>)
            that we use to build our sitemap and power the &quot;recent
            reports&quot; links on the homepage. We never store private
            report data this way.
          </p>
          <p className="text-muted-foreground">
            ParseForge has no user accounts. There is no login, no password,
            and no payment processing anywhere on the site — we don&apos;t
            collect or store that kind of data because we don&apos;t have
            anywhere to put it.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Analytics</h2>
          <p className="text-muted-foreground">
            We use PostHog to understand how the site is used — it records
            pageviews and automatically captured interactions like clicks and
            form submissions. Those events are sent through our own{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">/ingest</code>{" "}
            path rather than directly to PostHog&apos;s servers.
          </p>
          <p className="text-muted-foreground">
            Session replay (a recording of how you interact with the page)
            never starts automatically. It only runs after you&apos;ve given
            full consent, and even then every form input is masked and
            browser console logs are never captured.
          </p>
          <p className="text-muted-foreground">
            If you&apos;re visiting from the EEA or UK, the Google consent
            dialog described below controls this: if you decline, PostHog
            runs in a memory-only mode and sets no cookies. If you&apos;re
            visiting from outside the EEA/UK, analytics are on by default,
            consistent with how most sites operate for visitors outside those
            regions.
          </p>
          <p className="text-muted-foreground">
            Separately, Vercel Analytics and Vercel Speed Insights collect
            aggregate traffic counts and page-performance (Web Vitals) data
            for every visitor — this is not tied to an individual profile.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Advertising and your consent choices
          </h2>
          <p className="text-muted-foreground">
            We use Google Privacy &amp; Messaging as our consent management
            platform, implementing the IAB Transparency &amp; Consent
            Framework (TCF) v2.2. ParseForge does not currently show any
            adverts; Google AdSense may serve ads on the site in the future,
            and the consent choices you make through this dialog will apply
            to that advertising once it goes live.
          </p>
          <p className="text-muted-foreground">
            You can change your mind at any time by re-opening the consent
            dialog from wherever your browser or the page surfaces it.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Third parties</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Warcraft Logs (RPGLogs)</strong>{" "}
              — the source of the report data you paste a link to; we query
              their API on your behalf.
            </li>
            <li>
              <strong className="text-foreground">Google</strong> — provides
              our consent management dialog and, in the future, may serve
              AdSense ads.
            </li>
            <li>
              <strong className="text-foreground">PostHog</strong> — product
              analytics, described above.
            </li>
            <li>
              <strong className="text-foreground">Vercel</strong> — hosts the
              site and provides traffic and performance analytics.
            </li>
            <li>
              <strong className="text-foreground">Upstash</strong> — provides
              the Redis cache that temporarily holds report data.
            </li>
            <li>
              <strong className="text-foreground">Wowhead</strong> (
              <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">
                wow.zamimg.com
              </code>
              ) — supplies item tooltips and icons; when you view a report,
              your browser makes a request directly to Wowhead&apos;s
              servers to load them.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Your rights</h2>
          <p className="text-muted-foreground">
            If you&apos;re in the EEA or UK, GDPR / UK GDPR gives you the
            right to access, correct, erase, or restrict the personal data we
            process about you, to receive a copy in a portable format, to
            object to processing, and to withdraw consent at any time.
          </p>
          <p className="text-muted-foreground">
            If you&apos;re a California resident, CCPA/CPRA applies: we do
            not sell your personal information, and we do not share it for
            cross-context behavioral advertising, as of this policy. You have
            the right to know what we hold and the right to have it deleted.
          </p>
          <p className="text-muted-foreground">
            To exercise any of these rights, email{" "}
            <a
              href="mailto:info@lootlistplus.com"
              className="text-gold-from hover:underline"
            >
              info@lootlistplus.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Children</h2>
          <p className="text-muted-foreground">
            ParseForge is not directed to children under 13, and we do not
            knowingly collect personal information from them.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Changes to this policy</h2>
          <p className="text-muted-foreground">
            If this policy changes, we&apos;ll post the update here with a
            new &quot;Last updated&quot; date at the top of the page.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-white/[0.06] bg-surface-1 p-5">
          <h2 className="text-sm font-semibold">Related</h2>
          <p className="text-sm">
            <Link href="/terms" className="text-gold-from hover:underline">
              Terms of Service
            </Link>
          </p>
        </section>
      </article>
    </main>
  );
}
