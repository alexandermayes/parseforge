import type { Metadata } from "next";
import AnalyzeClient from "./AnalyzeClient";

type Params = Promise<{ reportCode: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// NOTE: generateMetadata runs on every server render of this page, so it must
// stay cheap — no data fetching here. It only builds the /og image URL from the
// route + search params; the (cached) analysis fetch happens inside /og, which
// is only requested by link unfurlers.
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

  const title = `Report ${reportCode}`;
  const description =
    "WoW Classic raid performance analysis — DPS percentiles, gear audits, buff tracking, and improvement suggestions.";

  return {
    title,
    description,
    robots: { index: false },
    openGraph: {
      type: "website",
      siteName: "ParseForge",
      title: "ParseForge raid analysis",
      description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: "ParseForge analysis" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "ParseForge raid analysis",
      description,
      images: [ogUrl],
    },
  };
}

export default async function AnalyzePage({ params }: { params: Params }) {
  const { reportCode } = await params;
  return <AnalyzeClient reportCode={reportCode} />;
}
