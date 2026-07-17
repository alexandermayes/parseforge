import { cache } from "react";
import { wclQuery, WCLError } from "@/lib/wcl-client";
import { REPORT_META_QUERY } from "@/lib/wcl-queries";
import { recordRecentReport } from "@/lib/kv-cache";
import type { WCLReportData, ReportMeta } from "@/lib/wcl-types";

/**
 * Map a raw WCL report payload into our ReportMeta shape. Shared by the
 * `/api/report/[code]` route and server-side rendering (see `getReportMeta`)
 * so the mapping lives in exactly one place.
 */
export function mapReportMeta(report: WCLReportData): ReportMeta {
  return {
    title: report.title,
    owner: report.owner?.name ?? "Unknown",
    zone: report.zone?.name ?? "Unknown",
    zoneExpansionId: report.zone?.expansion?.id,
    fights: report.fights
      .filter((f) => f.encounterID > 0)
      .map((f) => ({
        id: f.id,
        name: f.name,
        encounterID: f.encounterID,
        kill: f.kill,
        difficulty: f.difficulty,
        bossPercentage: f.bossPercentage,
        duration: f.endTime - f.startTime,
      })),
    players: report.masterData.actors
      .filter((a) => a.type === "Player")
      .map((a) => ({
        id: a.id,
        name: a.name,
        type: a.subType,
        subType: a.subType,
        icon: a.icon ?? a.subType,
      })),
  };
}

export type ReportMetaResult =
  | { status: "ok"; meta: ReportMeta }
  | { status: "not_found" }
  | { status: "private" }
  | { status: "error" };

/**
 * Server-side report fetch for rendering + metadata, returning a discriminated
 * result instead of throwing so the page can choose to render, noindex, or 404.
 *
 * Wrapped in React `cache()` so `generateMetadata` and the page component share
 * a single call per request; the underlying `wclQuery` also caches for 5 min.
 */
export const getReportMeta = cache(
  async (code: string): Promise<ReportMetaResult> => {
    if (!/^[a-zA-Z0-9]{10,20}$/.test(code)) return { status: "not_found" };

    try {
      const data = await wclQuery<{ reportData: { report: WCLReportData | null } }>(
        REPORT_META_QUERY,
        { code },
      );
      const report = data.reportData.report;
      if (!report) return { status: "not_found" };
      // Record this public report so the sitemap can surface it for crawling.
      await recordRecentReport(code, Date.now());
      return { status: "ok", meta: mapReportMeta(report) };
    } catch (err) {
      if (err instanceof WCLError) {
        if (err.kind === "not_found") return { status: "not_found" };
        if (err.kind === "private") return { status: "private" };
      }
      // Transient (rate limit / timeout / upstream) — don't 404 or index, let
      // the client retry.
      return { status: "error" };
    }
  },
);
