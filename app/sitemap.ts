import type { MetadataRoute } from "next";
import { getRecentReports } from "@/lib/kv-cache";
import { DEMO_REPORT } from "@/lib/demo-report";

const BASE = "https://parseforge.gg";

// Regenerate hourly so newly-analyzed public reports enter the sitemap without
// a redeploy.
export const revalidate = 3600;

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE, changeFrequency: "weekly", priority: 1 },
  { url: `${BASE}/guides`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/guides/how-to-analyze-wow-classic-logs`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/guides/improve-dps-wow-classic`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/guides/raid-preparation-checklist`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/guides/wow-classic-loot-council-tools`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/guides/warcraft-logs-vs-parseforge`, changeFrequency: "monthly", priority: 0.7 },
  // The landing-page "See a live example" report. Hardcoded so at least one
  // real, indexable report page is always crawlable even when the recent-reports
  // pipeline below is empty (e.g. Redis unconfigured, or no public report
  // rendered since deploy). Canonical form (no query params) to match the page.
  { url: `${BASE}/analyze/${DEMO_REPORT.code}`, changeFrequency: "weekly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = STATIC_ROUTES.map((r) => ({ ...r, lastModified: now }));

  // Cap well under the 50k-URL sitemap limit; these are the freshest public
  // reports we've server-rendered. Skip the demo report — it's already a static
  // route above, so this avoids emitting it twice.
  const recent = await getRecentReports(10_000);
  const reportRoutes: MetadataRoute.Sitemap = recent
    .filter((r) => r.code !== DEMO_REPORT.code)
    .map((r) => ({
      url: `${BASE}/analyze/${r.code}`,
      lastModified: new Date(r.ts),
      changeFrequency: "weekly",
      priority: 0.5,
    }));

  return [...staticRoutes, ...reportRoutes];
}
