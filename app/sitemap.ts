import type { MetadataRoute } from "next";
import { getRecentReports } from "@/lib/kv-cache";

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
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = STATIC_ROUTES.map((r) => ({ ...r, lastModified: now }));

  // Cap well under the 50k-URL sitemap limit; these are the freshest public
  // reports we've server-rendered.
  const recent = await getRecentReports(10_000);
  const reportRoutes: MetadataRoute.Sitemap = recent.map((r) => ({
    url: `${BASE}/analyze/${r.code}`,
    lastModified: new Date(r.ts),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...reportRoutes];
}
