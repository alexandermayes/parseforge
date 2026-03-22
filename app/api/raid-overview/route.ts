import { NextRequest, NextResponse } from "next/server";
import { wclQuery } from "@/lib/wcl-client";
import {
  RAID_OVERVIEW_QUERY,
  RAID_COMBATANT_INFO_QUERY,
  RAID_DEATH_EVENTS_QUERY,
} from "@/lib/wcl-queries";
import { buildRaidOverview } from "@/lib/raid-overview-engine";
import { flattenPlayerDetails } from "@/lib/wcl-helpers";
import { cachedApiHandler, parseBody } from "@/lib/api-utils";
import type {
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

interface DeathEventsResponse {
  reportData: {
    report: {
      deathEvents: {
        data: Array<{
          timestamp: number;
          type: string;
          sourceID: number;
          source?: { name: string; type: string };
          killerID?: number;
          killer?: { name: string; type: string };
          killingAbility?: { name: string; guid: number };
        }>;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  const parsed = await parseBody<{ reportCode: string; fightId: number }>(
    request, ["reportCode", "fightId"]
  );
  if ("error" in parsed) return parsed.error;
  const { reportCode, fightId } = parsed.body;

  return cachedApiHandler(`rpb-${reportCode}-${fightId}`, async () => {
    const [overviewData, combatantData, deathEventsData] = await Promise.all([
      wclQuery<RaidOverviewResponse>(RAID_OVERVIEW_QUERY, {
        code: reportCode,
        fightIDs: [fightId],
      }),
      wclQuery<CombatantInfoResponse>(RAID_COMBATANT_INFO_QUERY, {
        code: reportCode,
        fightIDs: [fightId],
      }),
      wclQuery<DeathEventsResponse>(RAID_DEATH_EVENTS_QUERY, {
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
    const allPlayers = flattenPlayerDetails(report.playerDetails);

    return buildRaidOverview({
      playerDetails: allPlayers,
      damageEntries: report.damage?.data?.entries ?? [],
      healingEntries: report.healing?.data?.entries ?? [],
      deathEntries: report.deaths?.data?.entries ?? [],
      damageTakenEntries: report.damageTaken?.data?.entries ?? [],
      combatantInfoEvents: combatantData.reportData.report.combatantInfo?.data ?? [],
      deathEvents: deathEventsData.reportData?.report?.deathEvents?.data ?? [],
      fightDuration,
      fightStartTime: fight.startTime,
      encounterName: fight.name,
    });
  });
}
