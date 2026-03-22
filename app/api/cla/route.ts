import { NextRequest, NextResponse } from "next/server";
import { wclQuery } from "@/lib/wcl-client";
import {
  REPORT_META_QUERY,
  RAID_COMBATANT_INFO_QUERY,
  buildCLABuffUptimeQuery,
} from "@/lib/wcl-queries";
import { buildCLAResult, type CLAEngineInput } from "@/lib/cla-engine";
import { getWowheadDomain } from "@/lib/constants";
import { flattenPlayerDetails } from "@/lib/wcl-helpers";
import { cachedApiHandler, parseBody } from "@/lib/api-utils";
import type { CLAResult, CLAFightMeta } from "@/lib/cla-types";
import type {
  WCLPlayerDetails,
  WCLCombatantInfoEvent,
  WCLFight,
  WCLReportData,
  WCLBuffEntry,
} from "@/lib/wcl-types";

const BATCH_SIZE = 12; // max players per buff query

interface ReportMetaResponse {
  reportData: {
    report: WCLReportData;
  };
}

interface CombatantInfoResponse {
  reportData: {
    report: {
      combatantInfo: {
        data: WCLCombatantInfoEvent[];
      };
    };
  };
}

interface BuffBatchResponse {
  reportData: {
    report: Record<string, { data: { auras: WCLBuffEntry[] } }>;
  };
}

export async function POST(request: NextRequest) {
  const parsed = await parseBody<{ reportCode: string; fightIds: number[] }>(
    request, ["reportCode", "fightIds"]
  );
  if ("error" in parsed) return parsed.error;
  const { reportCode, fightIds } = parsed.body;

  if (fightIds.length === 0) {
    return NextResponse.json({ error: "No fights specified" }, { status: 400 });
  }

  return cachedApiHandler(`cla-${reportCode}-${fightIds.sort().join(",")}`, async () => {
    // Step 1: Fetch report metadata (fights + players)
    const metaData = await wclQuery<ReportMetaResponse>(REPORT_META_QUERY, {
      code: reportCode,
    });
    const report = metaData.reportData.report;
    const zoneName = report.zone?.name;
    const wowheadDomain = getWowheadDomain(zoneName);

    // Filter to requested fights
    const selectedFights = report.fights.filter((f) => fightIds.includes(f.id));
    if (selectedFights.length === 0) {
      return NextResponse.json({ error: "No matching fights found" }, { status: 404 });
    }

    const fightMetas: CLAFightMeta[] = selectedFights.map((f) => ({
      id: f.id,
      name: f.name,
      duration: f.endTime - f.startTime,
    }));

    // Get all player actors
    const playerActors = report.masterData.actors.filter(
      (a) => a.type === "Player"
    );
    const sourceIds = playerActors.map((a) => a.id);

    // Step 2: Per fight — fetch buff uptime (batched) + CombatantInfo in parallel
    const buffData: Record<number, Record<number, WCLBuffEntry[]>> = {};
    const combatantData: Record<number, WCLCombatantInfoEvent[]> = {};

    // We need playerDetails from one of the fights to get spec info
    // Fetch it alongside the first fight's data
    interface PlayerDetailsResponse {
      reportData: {
        report: {
          playerDetails: {
            data: {
              playerDetails: Record<string, WCLPlayerDetails[]>;
            };
          };
        };
      };
    }

    const playerDetailsQuery = `
      query CLAPlayerDetails($code: String!, $fightIDs: [Int!]!) {
        reportData {
          report(code: $code) {
            playerDetails(fightIDs: $fightIDs)
          }
        }
      }
    `;

    // Fetch player details using all fight IDs
    const playerDetailsPromise = wclQuery<PlayerDetailsResponse>(
      playerDetailsQuery,
      { code: reportCode, fightIDs: fightIds }
    );

    // Per-fight: buff queries (batched) + combatant info
    const fightPromises = selectedFights.map(async (fight) => {
      // Batch source IDs into groups of BATCH_SIZE
      const batches: number[][] = [];
      for (let i = 0; i < sourceIds.length; i += BATCH_SIZE) {
        batches.push(sourceIds.slice(i, i + BATCH_SIZE));
      }

      // Buff queries (one per batch) + combatant info query
      const buffPromises = batches.map((batch) =>
        wclQuery<BuffBatchResponse>(buildCLABuffUptimeQuery(batch), {
          code: reportCode,
          fightIDs: [fight.id],
        })
      );

      const combatantPromise = wclQuery<CombatantInfoResponse>(
        RAID_COMBATANT_INFO_QUERY,
        { code: reportCode, fightIDs: [fight.id] }
      );

      const [buffResults, combatantResult] = await Promise.all([
        Promise.all(buffPromises),
        combatantPromise,
      ]);

      // Merge buff results
      const fightBuffs: Record<number, WCLBuffEntry[]> = {};
      for (const buffResult of buffResults) {
        const reportData = buffResult.reportData.report;
        for (const [key, value] of Object.entries(reportData)) {
          if (!key.startsWith("buffs_")) continue;
          const sid = parseInt(key.replace("buffs_", ""), 10);
          fightBuffs[sid] = value?.data?.auras ?? [];
        }
      }

      buffData[fight.id] = fightBuffs;
      combatantData[fight.id] =
        combatantResult.reportData.report.combatantInfo?.data ?? [];
    });

    const [playerDetailsResult] = await Promise.all([
      playerDetailsPromise,
      ...fightPromises,
    ]);

    const allPlayers = flattenPlayerDetails(
      playerDetailsResult.reportData?.report?.playerDetails
    );

    // Step 3: Build CLA result
    const engineInput: CLAEngineInput = {
      playerDetails: allPlayers,
      fights: fightMetas,
      buffData,
      combatantData,
      wowheadDomain,
    };

    return buildCLAResult(engineInput);
  });
}
