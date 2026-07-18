import Link from "next/link";
import { getRecentReports } from "@/lib/kv-cache";
import { getReportMeta } from "@/lib/report-meta";
import { DEMO_REPORT } from "@/lib/demo-report";

// Server-rendered list of public report pages, so crawlers reach `/analyze/*`
// from the homepage (the client `RecentReports` in the hero is localStorage-only
// and invisible to bots). The demo report is always attempted first so there is
// at least one real, indexable report link even when the recent-reports set is
// empty (e.g. Redis unconfigured). Enriched with WCL meta for descriptive anchor
// text; the homepage is ISR-cached (see `revalidate` in page.tsx) so this fans
// out to WCL at most once per revalidation window, not per request.

const MAX_SHOWN = 5;
// Over-fetch candidates so transient meta failures don't shrink the list below
// MAX_SHOWN when there are enough reports to fill it.
const MAX_ATTEMPTS = MAX_SHOWN + 2;

// WCL report titles are user-supplied and often junk ("??", blank) — fall back
// to the zone so anchor text never shows noise. Mirrors the analyze page.
function headline(title: string, zone: string): string {
  const t = title?.trim();
  return t && !/^[?\s.]+$/.test(t) ? t : zone;
}

export default async function FeaturedReports() {
  const recent = await getRecentReports(MAX_ATTEMPTS * 2);
  const candidates = [
    DEMO_REPORT.code,
    ...recent.map((r) => r.code).filter((c) => c !== DEMO_REPORT.code),
  ].slice(0, MAX_ATTEMPTS);

  // getReportMeta never throws (it returns a discriminated status), so Promise.all
  // is safe; private/errored/missing reports resolve to null and drop out.
  const resolved = await Promise.all(
    candidates.map(async (code) => {
      const res = await getReportMeta(code);
      return res.status === "ok" ? { code, meta: res.meta } : null;
    }),
  );
  const shown = resolved
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .slice(0, MAX_SHOWN);

  if (shown.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">
        Recently Analyzed Reports
      </h2>
      <div className="grid gap-2">
        {shown.map(({ code, meta }) => {
          const h = headline(meta.title, meta.zone);
          return (
            <Link
              key={code}
              href={`/analyze/${code}`}
              className="surface-card rounded-lg px-4 py-3 transition-interactive hover:bg-surface-2 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {h} — WoW Classic Raid Analysis
                </p>
                <p className="text-caption text-muted-foreground truncate">
                  {meta.zone} &middot; {meta.players.length} raiders
                </p>
              </div>
              <span className="text-caption text-gold-from shrink-0">
                View &rarr;
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
