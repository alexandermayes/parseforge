import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AnalyzeClient from "./AnalyzeClient";
import ReportSummary from "./ReportSummary";
import { getReportMeta } from "@/lib/report-meta";

type Params = Promise<{ reportCode: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// WCL report titles are user-supplied and often junk ("??", blank) — fall back
// to the zone so titles/headings never show noise.
function headlineFor(title: string, zone: string): string {
  const t = title?.trim();
  return t && !/^[?\s.]+$/.test(t) ? t : zone;
}

// generateMetadata fetches report meta via the request-cached getReportMeta, so
// it shares a single WCL call with the page render below. Indexing is enabled
// only when the report loads publicly; private/errored/missing reports stay
// noindex (and missing ones 404 in the page component).
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { reportCode } = await params;
  const sp = await searchParams;
  const fight = first(sp.fight);
  const source = first(sp.source);

  const ogParams = new URLSearchParams({ report: reportCode });
  if (fight) ogParams.set("fight", fight);
  if (source) ogParams.set("source", source);
  const ogUrl = `/og?${ogParams.toString()}`;

  const result = await getReportMeta(reportCode);
  const canonical = `https://parseforge.gg/analyze/${reportCode}`;

  const generic =
    "WoW Classic raid performance analysis — DPS percentiles, gear audits, buff tracking, and improvement suggestions.";

  if (result.status !== "ok") {
    return {
      title: `Report ${reportCode}`,
      description: generic,
      robots: { index: false },
      openGraph: {
        type: "website",
        siteName: "ParseForge",
        title: "ParseForge raid analysis",
        description: generic,
        images: [{ url: ogUrl, width: 1200, height: 630, alt: "ParseForge analysis" }],
      },
      twitter: {
        card: "summary_large_image",
        title: "ParseForge raid analysis",
        description: generic,
        images: [ogUrl],
      },
    };
  }

  const { meta } = result;
  const headline = headlineFor(meta.title, meta.zone);
  const title = `${headline} — WoW Classic Raid Analysis`;
  const description = `Player-by-player analysis of ${headline} in ${meta.zone} — DPS/HPS percentiles, gear and enchant audits, buff uptime, and improvement tips for ${meta.players.length} raiders.`;

  return {
    title,
    description,
    // Canonical without query params folds every ?fight=&source= permutation
    // into one indexable URL.
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "ParseForge",
      url: canonical,
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${headline} raid analysis` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function AnalyzePage({ params }: { params: Params }) {
  const { reportCode } = await params;
  const result = await getReportMeta(reportCode);

  // A report that genuinely doesn't exist (usually deleted) returns a real 404
  // so search engines drop it cleanly instead of indexing an error shell.
  if (result.status === "not_found") {
    notFound();
  }

  return (
    <>
      <AnalyzeClient reportCode={reportCode} />
      {result.status === "ok" && (
        <ReportSummary meta={result.meta} reportCode={reportCode} />
      )}
    </>
  );
}
