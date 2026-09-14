import { NextRequest, NextResponse } from "next/server";
import { wclQuery } from "@/lib/wcl-client";
import { cachedApiHandler, parseBody, isValidReportCode, badRequest } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { TIMELINE_CASTS_QUERY, TIMELINE_CASTS_PAGE_QUERY } from "@/lib/wcl-queries";
import { buildCastTimeline } from "@/lib/timeline-engine";
import type { TimelineDeathEvent } from "@/lib/timeline-engine";
import type { WCLCastEvent, WCLCastEntry, TimelineRequest, WCLPlayerDetails } from "@/lib/wcl-types";
import { flattenPlayerDetails } from "@/lib/wcl-helpers";

interface TimelineActor {
  id: number;
  name: string;
  type: string;
  subType?: string;
}

interface TimelineFight {
  id: number;
  name: string;
  startTime: number;
  endTime: number;
}

interface TimelineCastsResponse {
  reportData: {
    report: {
      playerDetails: {
        data: {
          playerDetails: Record<string, WCLPlayerDetails[]>;
        };
      };
      castEvents: { data: WCLCastEvent[]; nextPageTimestamp: number | null };
      castTable: { data: { entries: WCLCastEntry[] } };
      deathEvents: { data: TimelineDeathEvent[] };
      masterData: { actors: TimelineActor[] };
      fights: TimelineFight[];
    };
  };
}

interface TimelineCastsPageResponse {
  reportData: {
    report: {
      castEvents: { data: WCLCastEvent[]; nextPageTimestamp: number | null };
    };
  };
}

// Hard cap on cast-events pages fetched per request. This is a required
// denial-of-service bound, not a nicety: without it a crafted fight id (a
// very long, high-APM fight) could force unbounded WCL query volume against
// a shared, rate-limited third-party API quota. When the cap is hit,
// `truncated` is set so the client never mistakes a capped log for a
// complete one.
const MAX_TIMELINE_PAGES = 20;

export async function POST(request: NextRequest) {
  const parsed = await parseBody<TimelineRequest>(
    request,
    ["reportCode", "fightId", "sourceId"]
  );
  if ("error" in parsed) return parsed.error;
  const body = parsed.body;
  const { reportCode, fightId, sourceId } = body;

  const limited = await checkRateLimit(request, "timeline");
  if (limited) return limited;

  // Validate before building the cache key / querying WCL — identical
  // ordering to app/api/analyze/route.ts.
  if (!isValidReportCode(reportCode)) return badRequest("Invalid report code.");
  if (!Number.isInteger(fightId) || !Number.isInteger(sourceId)) {
    return badRequest("Invalid fight or source id — expected integers.");
  }

  return cachedApiHandler(`timeline-${reportCode}-${fightId}-${sourceId}`, async () => {
    const first = await wclQuery<TimelineCastsResponse>(TIMELINE_CASTS_QUERY, {
      code: reportCode,
      fightIDs: [fightId],
      sourceID: sourceId,
    });

    const report = first.reportData.report;
    const fight = report.fights[0];
    if (!fight) {
      return NextResponse.json({ error: "Fight not found" }, { status: 404 });
    }

    const actors = report.masterData?.actors ?? [];

    // playerDetails is fetched with fightIDs: [fightId], so — unlike the
    // report-wide actor list above — this genuinely confirms sourceId played
    // in *this* fight, not just somewhere in the report (WR-01). Mirrors the
    // fight-scoped check in app/api/analyze/route.ts.
    const fightPlayers = flattenPlayerDetails(report.playerDetails);
    const sourceInFight = fightPlayers.some((p) => p.id === sourceId);
    if (!sourceInFight) {
      return NextResponse.json({ error: "Player not found in fight" }, { status: 404 });
    }

    const castEvents: WCLCastEvent[] = [...(report.castEvents?.data ?? [])];
    let nextPageTimestamp = report.castEvents?.nextPageTimestamp ?? null;
    let truncated = false;
    let pagesFetched = 1;

    while (nextPageTimestamp != null) {
      if (pagesFetched >= MAX_TIMELINE_PAGES) {
        truncated = true;
        break;
      }
      const page = await wclQuery<TimelineCastsPageResponse>(TIMELINE_CASTS_PAGE_QUERY, {
        code: reportCode,
        fightIDs: [fightId],
        sourceID: sourceId,
        startTime: nextPageTimestamp,
      });
      const pageEvents = page.reportData.report.castEvents;
      castEvents.push(...(pageEvents?.data ?? []));
      nextPageTimestamp = pageEvents?.nextPageTimestamp ?? null;
      pagesFetched++;
    }

    const castTable = report.castTable?.data?.entries ?? [];

    return buildCastTimeline({
      castEvents,
      castTable,
      actors,
      fight: { name: fight.name, startTime: fight.startTime, endTime: fight.endTime },
      playerName: actors.find((a) => a.id === sourceId)?.name ?? "",
      sourceId,
      truncated,
      deathEvents: report.deathEvents?.data ?? [],
    });
  });
}
