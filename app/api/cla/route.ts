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
import { mapPool } from "@/lib/async-pool";
import { cachedApiHandler, parseBody } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CLAFightMeta } from "@/lib/cla-types";
import type {
  WCLPlayerDetails,
  WCLCombatantInfoEvent,
  WCLFight,
  WCLReportData,
  WCLBuffEntry,
} from "@/lib/wcl-types";

const BATCH_SIZE = 12; // max players per buff query
const FIGHT_CONCURRENCY = 3; // max fights fetched at once (caps WCL fan-out)

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

  const limited = await checkRateLimit(request, "cla");
  if (limited) return limited;

  if (fightIds.length === 0) {
    return NextResponse.json({ error: "No fights specified" }, { status: 400 });
  }

  // Sort a copy numerically — sort() is in-place and lexicographic, which would
  // mutate the caller's array and order [2,10] as "10,2".
  const cacheFightIds = [...fightIds].sort((a, b) => a - b);
  return cachedApiHandler(`cla-${reportCode}-${cacheFightIds.join(",")}`, async () => {
    // Step 1: Fetch report metadata (fights + players)
    const metaData = await wclQuery<ReportMetaResponse>(REPORT_META_QUERY, {
      code: reportCode,
    });
    const report = metaData.reportData.report;
    const zoneName = report.zone?.name;
    const wowheadDomain = getWowheadDomain(zoneName, report.zone?.expansion?.id);

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

    // Batch source IDs into groups of BATCH_SIZE (same for every fight)
    const batches: number[][] = [];
    for (let i = 0; i < sourceIds.length; i += BATCH_SIZE) {
      batches.push(sourceIds.slice(i, i + BATCH_SIZE));
    }

    // Per-fight: buff queries (batched) + combatant info. Capped at
    // FIGHT_CONCURRENCY fights in flight so a multi-boss audit doesn't fire
    // fights × (batches + 1) WCL queries simultaneously (~30+ for a full clear).
    const processFight = async (fight: WCLFight) => {
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
    };

    const [playerDetailsResult] = await Promise.all([
      playerDetailsPromise,
      mapPool(selectedFights, FIGHT_CONCURRENCY, processFight),
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
