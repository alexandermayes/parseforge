import { wclQuery } from "./wcl-client";
import {
  TOP_PLAYER_DATA_QUERY,
  TOP_PLAYER_DATA_QUERY_HEALING,
  REPORT_ACTORS_QUERY,
} from "./wcl-queries";
import type {
  WCLPlayerDetails,
  WCLDamageEntry,
  WCLBuffEntry,
  WCLCastEntry,
  WCLFight,
  WCLRanking,
  TopPlayerFullData,
} from "./wcl-types";

interface TopPlayerDataResponse {
  reportData: {
    report: {
      playerDetails: {
        data: {
          playerDetails: Record<string, WCLPlayerDetails[]>;
        };
      };
      damage?: { data: { entries: WCLDamageEntry[] } };
      healing?: { data: { entries: WCLDamageEntry[] } };
      buffs: { data: { auras: WCLBuffEntry[] } };
      casts: { data: { entries: WCLCastEntry[] } };
      fights: WCLFight[];
    };
  };
}

interface ReportActorsResponse {
  reportData: {
    report: {
      masterData: {
        actors: Array<{ id: number; name: string; type: string }>;
      };
    };
  };
}

/**
 * Fetch full data for the top N ranked players in parallel.
 * Groups actor lookups by report code to minimize queries.
 */
export async function fetchTopPlayers(
  rankings: WCLRanking[],
  count: number,
  role: "dps" | "healer",
): Promise<TopPlayerFullData[]> {
  const topRankings = rankings.slice(0, count);
  if (topRankings.length === 0) return [];

  try {
    // Group by report code to minimize actor lookups
    const reportCodes = [...new Set(topRankings.map((r) => r.report.code))];

    // Fetch actors for each unique report in parallel
    const actorResults = await Promise.all(
      reportCodes.map((code) =>
        wclQuery<ReportActorsResponse>(REPORT_ACTORS_QUERY, { code })
          .then((res) => ({ code, actors: res.reportData.report.masterData?.actors ?? [] }))
          .catch(() => ({ code, actors: [] as Array<{ id: number; name: string; type: string }> }))
      )
    );

    const actorsByReport = new Map(actorResults.map((r) => [r.code, r.actors]));

    const topPlayerQuery = role === "healer"
      ? TOP_PLAYER_DATA_QUERY_HEALING
      : TOP_PLAYER_DATA_QUERY;

    // Fetch full data for each top player in parallel
    const fetchResults = await Promise.all(
      topRankings.map(async (ranking) => {
        try {
          const actors = actorsByReport.get(ranking.report.code) ?? [];
          const actor = actors.find((a) => a.name === ranking.name);
          if (!actor) return null;

          const data = await wclQuery<TopPlayerDataResponse>(
            topPlayerQuery,
            {
              code: ranking.report.code,
              fightIDs: [ranking.report.fightID],
              sourceID: actor.id,
            }
          );

          const topReport = data.reportData.report;
          const topFight = topReport.fights[0];
          const duration = topFight
            ? topFight.endTime - topFight.startTime
            : ranking.duration;

          const throughput = role === "healer"
            ? (topReport.healing?.data?.entries ?? [])
            : (topReport.damage?.data?.entries ?? []);

          return {
            name: ranking.name,
            ranking,
            duration,
            throughputEntries: throughput,
            buffEntries: topReport.buffs?.data?.auras ?? [],
            castEntries: topReport.casts?.data?.entries ?? [],
          } as TopPlayerFullData;
        } catch (err) {
          console.error(`Top player fetch error for ${ranking.name}:`, err);
          return null;
        }
      })
    );

    return fetchResults.filter((r): r is TopPlayerFullData => r !== null);
  } catch (err) {
    console.error("Top players data fetch error:", err);
    return [];
  }
}
