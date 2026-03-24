import { NextRequest, NextResponse } from "next/server";
import { wclQuery } from "@/lib/wcl-client";
import { cachedApiHandler, parseBody } from "@/lib/api-utils";
import {
  PLAYER_FULL_DATA_QUERY,
  PLAYER_FULL_DATA_QUERY_HEALING,
  ENCOUNTER_RANKINGS_QUERY,
  ENCOUNTER_META_QUERY,
} from "@/lib/wcl-queries";
import { buildAnalysisResult } from "@/lib/analysis-engine";
import { fetchTopPlayers } from "@/lib/wcl-fetchers";
import { TOP_PLAYERS_TO_FETCH, getWowheadDomain, isHealerSpec } from "@/lib/constants";
import { GEM_STAT_DB, GEM_NAME_DB } from "@/lib/cla-constants";
import { flattenPlayerDetails, parsePlayerSpec } from "@/lib/wcl-helpers";
import {
  AnalyzeRequest,
  AnalysisResult,
  WCLRankingsData,
  WCLPlayerDetails,
  WCLDamageEntry,
  WCLBuffEntry,
  WCLCastEntry,
  WCLFight,
  WCLCombatantInfoEvent,
  WCLGearItem,
} from "@/lib/wcl-types";

interface PlayerFullDataResponse {
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
      combatantInfo: { data: WCLCombatantInfoEvent[] };
      fights: WCLFight[];
    };
  };
}

interface RankingsResponse {
  worldData: {
    encounter: {
      characterRankings: WCLRankingsData;
    };
  };
}


export async function POST(request: NextRequest) {
  const parsed = await parseBody<AnalyzeRequest>(
    request, ["reportCode", "fightId", "sourceId"]
  );
  if ("error" in parsed) return parsed.error;
  const body = parsed.body;
  const { reportCode, fightId, sourceId } = body;

  return cachedApiHandler(`analyze-${reportCode}-${fightId}-${sourceId}`, async () => {
    // Step 1: We need player details first to detect role, so fetch with DPS query initially
    // and re-fetch with healing query if needed
    const playerData = await wclQuery<PlayerFullDataResponse>(
      PLAYER_FULL_DATA_QUERY,
      { code: reportCode, fightIDs: [fightId], sourceID: sourceId }
    );

    const report = playerData.reportData.report;
    const fight = report.fights[0];
    if (!fight) {
      return NextResponse.json({ error: "Fight not found" }, { status: 404 });
    }

    const fightDuration = fight.endTime - fight.startTime;

    // Find player in details
    const allPlayers = flattenPlayerDetails(report.playerDetails);
    const player = allPlayers.find((p) => p.id === sourceId);
    if (!player) {
      return NextResponse.json({ error: "Player not found in fight" }, { status: 404 });
    }

    const playerClass = player.type;
    const playerSpec = parsePlayerSpec(player);

    const playerRole = isHealerSpec(playerSpec) ? "healer" as const : "dps" as const;

    // If healer, re-fetch with healing query to get Healing table instead of DamageDone
    let throughputEntries: WCLDamageEntry[];
    let buffEntries: WCLBuffEntry[];
    let castEntries: WCLCastEntry[];
    let combatantInfoData: PlayerFullDataResponse["reportData"]["report"];

    if (playerRole === "healer") {
      const healerData = await wclQuery<PlayerFullDataResponse>(
        PLAYER_FULL_DATA_QUERY_HEALING,
        { code: reportCode, fightIDs: [fightId], sourceID: sourceId }
      );
      const healReport = healerData.reportData.report;
      throughputEntries = healReport.healing?.data?.entries ?? [];
      buffEntries = healReport.buffs?.data?.auras ?? [];
      castEntries = healReport.casts?.data?.entries ?? [];
      combatantInfoData = healReport;
    } else {
      throughputEntries = report.damage?.data?.entries ?? [];
      buffEntries = report.buffs?.data?.auras ?? [];
      castEntries = report.casts?.data?.entries ?? [];
      combatantInfoData = report;
    }

    // Extract gear and talents from CombatantInfo events, then enhance with names from playerDetails
    const combatantInfoEvent = combatantInfoData.combatantInfo?.data?.[0];
    const detailsGear = player.combatantInfo?.gear ?? [];
    // Build a map by item ID for reliable matching (array index can differ between APIs)
    const detailsGearById = new Map<number, WCLGearItem>();
    for (const item of detailsGear) {
      if (item && item.id > 0) {
        detailsGearById.set(item.id, item);
      }
    }
    const playerGear: WCLGearItem[] = (combatantInfoEvent?.gear ?? []).map((g, i) => {
      // Null/empty entries in the sparse gear array → skip with placeholder
      if (!g || g.id === 0) {
        return { id: 0, slot: i, quality: 0, icon: "", itemLevel: 0 } as WCLGearItem;
      }
      // playerDetails gear has item names; CombatantInfo events have enchants/gems/ilvl
      // Match by item ID for reliable enchant/gem name resolution
      const detailItem = detailsGearById.get(g.id);
      return {
        id: g.id,
        slot: i,
        quality: g.quality,
        icon: g.icon,
        name: detailItem?.name ?? undefined,
        itemLevel: g.itemLevel,
        permanentEnchant: g.permanentEnchant,
        permanentEnchantName: detailItem?.permanentEnchantName ?? undefined,
        temporaryEnchant: g.temporaryEnchant,
        temporaryEnchantName: detailItem?.temporaryEnchantName ?? undefined,
        gems: g.gems?.map((gem) => {
          const detailGem = detailItem?.gems?.find((dg) => dg.id === gem.id);
          const gemDbEntry = GEM_STAT_DB.get(gem.id);
          const gemNameEntry = GEM_NAME_DB.get(gem.id);
          return { ...gem, name: detailGem?.name ?? gemDbEntry?.name ?? gemNameEntry ?? undefined };
        }),
        setID: g.setID,
      };
    }).filter((g) => g.id > 0);
    const detailsTalents = player.combatantInfo?.talents ?? [];
    const playerTalents = (combatantInfoEvent?.talents ?? []).map((t, i) => ({
      name: detailsTalents[i]?.name ?? "",
      guid: t.id,
      type: 0,
      abilityIcon: t.icon,
      points: detailsTalents[i]?.points ?? 1,
    }));
    // Note: playerTalent names may be empty — they get backfilled from rankings data below

    const totalDamage = throughputEntries.reduce((s, e) => s + e.total, 0);

    // Step 2: Get encounter rankings for this class/spec
    // Use client-provided encounter data when available (avoids extra WCL query)
    let encounterID = body.encounterID;
    let encounterName = body.encounterName;
    let wowheadDomain = body.zoneName ? getWowheadDomain(body.zoneName) : undefined;

    if (!encounterID || !encounterName || !wowheadDomain) {
      // Fallback: fetch from WCL if client didn't provide encounter data
      const reportMetaData = await wclQuery<{
        reportData: {
          report: {
            zone: { id: number; name: string };
            fights: Array<{ id: number; encounterID: number; name: string }>;
          };
        };
      }>(ENCOUNTER_META_QUERY, { code: reportCode, fightIDs: [fightId] });

      const fightMeta = reportMetaData.reportData.report.fights[0];
      encounterID = fightMeta?.encounterID;
      encounterName = fightMeta?.name;
      wowheadDomain = getWowheadDomain(reportMetaData.reportData.report.zone?.name);
    }

    if (!encounterID) {
      return NextResponse.json(
        { error: "Could not determine encounter ID" },
        { status: 400 }
      );
    }

    let rankingsData: WCLRankingsData;
    try {
      const rankingsResponse = await wclQuery<RankingsResponse>(
        ENCOUNTER_RANKINGS_QUERY,
        {
          encounterID: encounterID,
          className: playerClass,
          specName: playerSpec,
          metric: playerRole === "healer" ? "hps" : "dps",
        }
      );
      rankingsData = rankingsResponse.worldData.encounter.characterRankings;
    } catch (err) {
      console.error("Rankings fetch error:", err);
      rankingsData = { page: 1, hasMorePages: false, count: 0, rankings: [] };
    }

    // Step 3: Fetch top N players in parallel
    const topPlayersData = await fetchTopPlayers(
      rankingsData.rankings,
      TOP_PLAYERS_TO_FETCH,
      playerRole,
    );

    // Backfill empty talent names from rankings data
    const talentNameMap = new Map<number, string>();
    for (const r of rankingsData.rankings) {
      for (const t of r.talents ?? []) {
        if (t.name && !talentNameMap.has(t.id)) {
          talentNameMap.set(t.id, t.name);
        }
      }
    }
    for (const t of playerTalents) {
      if (!t.name && talentNameMap.has(t.guid)) {
        t.name = talentNameMap.get(t.guid)!;
      }
    }

    // Step 4: Build analysis
    const result = buildAnalysisResult({
      playerName: player.name,
      playerClass,
      playerSpec,
      playerRole,
      encounterName: encounterName ?? "Unknown",
      fightDuration,
      playerTotalDamage: totalDamage,
      playerGear,
      playerTalents,
      playerDamageTable: throughputEntries,
      playerBuffTable: buffEntries,
      playerCastTable: castEntries,
      topPlayersData,
      rankings: rankingsData.rankings,
      totalRankingCount: rankingsData.count,
      wowheadDomain,
    });

    return result;
  });
}
