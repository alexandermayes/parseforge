import { NextRequest, NextResponse } from "next/server";
import { wclQuery, getCached, setCache } from "@/lib/wcl-client";
import {
  RAID_OVERVIEW_QUERY,
  RAID_COMBATANT_INFO_QUERY,
} from "@/lib/wcl-queries";
import { buildRaidOverview } from "@/lib/raid-overview-engine";
import { ANALYSIS_CACHE_TTL } from "@/lib/constants";
import type {
  RaidOverviewResult,
  WCLPlayerDetails,
  WCLCombatantInfoEvent,
  WCLFight,
} from "@/lib/wcl-types";

interface RaidOverviewResponse {
  reportData: {
    report: {
      playerDetails: {
        data: {
          playerDetails: Record<string, WCLPlayerDetails[]>;
        };
      };
      damage: {
        data: {
          entries: Array<{
            id: number;
            name: string;
            type: string;
            icon: string;
            total: number;
            activeTime: number;
            activeTimeReduced: number;
          }>;
        };
      };
      healing: {
        data: {
          entries: Array<{
            id: number;
            name: string;
            type: string;
            icon: string;
            total: number;
            activeTime: number;
            activeTimeReduced: number;
          }>;
        };
      };
      damageTaken: {
        data: {
          entries: Array<{
            id: number;
            name: string;
            type: string;
            icon: string;
            total: number;
          }>;
        };
      };
      deaths: {
        data: {
          entries: Array<{
            id: number;
            name: string;
            type: string;
            icon: string;
            deathTime: number;
            damage: { total: number };
            healing: { total: number };
          }>;
        };
      };
      fights: WCLFight[];
    };
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

export async function POST(request: NextRequest) {
  let body: { reportCode: string; fightId: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { reportCode, fightId } = body;
  if (!reportCode || !fightId) {
    return NextResponse.json(
      { error: "Missing reportCode or fightId" },
      { status: 400 }
    );
  }

  const cacheKey = `rpb-${reportCode}-${fightId}`;
  const cached = getCached<RaidOverviewResult>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // Two parallel queries: fight-wide tables + combatant info
    const [overviewData, combatantData] = await Promise.all([
      wclQuery<RaidOverviewResponse>(RAID_OVERVIEW_QUERY, {
        code: reportCode,
        fightIDs: [fightId],
      }),
      wclQuery<CombatantInfoResponse>(RAID_COMBATANT_INFO_QUERY, {
        code: reportCode,
        fightIDs: [fightId],
      }),
    ]);

    const report = overviewData.reportData.report;
    const fight = report.fights[0];
    if (!fight) {
      return NextResponse.json({ error: "Fight not found" }, { status: 404 });
    }

    const fightDuration = fight.endTime - fight.startTime;
    const allPlayers = Object.values(report.playerDetails.data.playerDetails).flat();

    const result = buildRaidOverview({
      playerDetails: allPlayers,
      damageEntries: report.damage?.data?.entries ?? [],
      healingEntries: report.healing?.data?.entries ?? [],
      deathEntries: report.deaths?.data?.entries ?? [],
      damageTakenEntries: report.damageTaken?.data?.entries ?? [],
      combatantInfoEvents: combatantData.reportData.report.combatantInfo?.data ?? [],
      fightDuration,
      encounterName: fight.name,
    });

    setCache(cacheKey, result, ANALYSIS_CACHE_TTL);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Raid overview error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
