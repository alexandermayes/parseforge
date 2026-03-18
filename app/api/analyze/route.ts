import { NextRequest, NextResponse } from "next/server";
import { wclQuery, getCached, setCache } from "@/lib/wcl-client";
import {
  PLAYER_FULL_DATA_QUERY,
  PLAYER_FULL_DATA_QUERY_HEALING,
  ENCOUNTER_RANKINGS_QUERY,
  TOP_PLAYER_DATA_QUERY,
  TOP_PLAYER_DATA_QUERY_HEALING,
} from "@/lib/wcl-queries";
import { buildAnalysisResult } from "@/lib/analysis-engine";
import { ANALYSIS_CACHE_TTL, TOP_PLAYERS_TO_FETCH, getWowheadDomain, isHealerSpec } from "@/lib/constants";
import { GEM_STAT_DB, GEM_NAME_DB } from "@/lib/cla-constants";
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
  TopPlayerFullData,
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

export async function POST(request: NextRequest) {
  let body: AnalyzeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { reportCode, fightId, sourceId } = body;
  if (!reportCode || !fightId || !sourceId) {
    return NextResponse.json(
      { error: "Missing reportCode, fightId, or sourceId" },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = `${reportCode}-${fightId}-${sourceId}`;
  const cached = getCached<AnalysisResult>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
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
    const allPlayers = Object.values(report.playerDetails.data.playerDetails).flat();
    const player = allPlayers.find((p) => p.id === sourceId);
    if (!player) {
      return NextResponse.json({ error: "Player not found in fight" }, { status: 404 });
    }

    const playerClass = player.type;
    // specs can be objects like {spec: "Guardian", count: 1} or plain strings
    const rawSpec = player.specs?.[0];
    const playerSpec =
      typeof rawSpec === "object" && rawSpec !== null && "spec" in rawSpec
        ? (rawSpec as unknown as { spec: string }).spec
        : typeof rawSpec === "string"
          ? rawSpec
          : player.icon?.split("-")[1] ?? "";

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
      throughputEntries = healReport.healing?.data.entries ?? [];
      buffEntries = healReport.buffs.data.auras ?? [];
      castEntries = healReport.casts.data.entries ?? [];
      combatantInfoData = healReport;
    } else {
      throughputEntries = report.damage?.data.entries ?? [];
      buffEntries = report.buffs.data.auras ?? [];
      castEntries = report.casts.data.entries ?? [];
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
    });
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
    // We need the encounterID — extract from fight name or use a mapping
    // For now, use the fight's encounter data from the report meta
    const reportMetaData = await wclQuery<{
      reportData: {
        report: {
          zone: { id: number; name: string };
          fights: Array<{ id: number; encounterID: number; name: string }>;
        };
      };
    }>(
      `query GetEncounterID($code: String!, $fightIDs: [Int!]!) {
        reportData {
          report(code: $code) {
            zone { id name }
            fights(fightIDs: $fightIDs) {
              id
              encounterID
              name
            }
          }
        }
      }`,
      { code: reportCode, fightIDs: [fightId] }
    );

    const zoneName = reportMetaData.reportData.report.zone?.name;
    const wowheadDomain = getWowheadDomain(zoneName);
    const fightMeta = reportMetaData.reportData.report.fights[0];
    if (!fightMeta || !fightMeta.encounterID) {
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
          encounterID: fightMeta.encounterID,
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
    const topPlayersData: TopPlayerFullData[] = [];
    const topRankings = rankingsData.rankings.slice(0, TOP_PLAYERS_TO_FETCH);

    if (topRankings.length > 0) {
      try {
        // Group by report code to minimize actor lookups
        const reportCodes = [...new Set(topRankings.map((r) => r.report.code))];

        // Fetch actors for each unique report in parallel
        const actorResults = await Promise.all(
          reportCodes.map((code) =>
            wclQuery<{
              reportData: {
                report: {
                  masterData: {
                    actors: Array<{ id: number; name: string; type: string }>;
                  };
                };
              };
            }>(
              `query TopPlayerMeta($code: String!) {
                reportData {
                  report(code: $code) {
                    masterData {
                      actors(type: "Player") {
                        id
                        name
                        type
                      }
                    }
                  }
                }
              }`,
              { code }
            ).then((res) => ({ code, actors: res.reportData.report.masterData.actors }))
              .catch(() => ({ code, actors: [] as Array<{ id: number; name: string; type: string }> }))
          )
        );

        const actorsByReport = new Map(actorResults.map((r) => [r.code, r.actors]));

        // Fetch full data for each top player in parallel
        const topPlayerQuery = playerRole === "healer"
          ? TOP_PLAYER_DATA_QUERY_HEALING
          : TOP_PLAYER_DATA_QUERY;

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

              const throughput = playerRole === "healer"
                ? (topReport.healing?.data.entries ?? [])
                : (topReport.damage?.data.entries ?? []);

              return {
                name: ranking.name,
                ranking,
                duration,
                throughputEntries: throughput,
                buffEntries: topReport.buffs.data.auras ?? [],
                castEntries: topReport.casts.data.entries ?? [],
              } as TopPlayerFullData;
            } catch (err) {
              console.error(`Top player fetch error for ${ranking.name}:`, err);
              return null;
            }
          })
        );

        for (const result of fetchResults) {
          if (result) topPlayersData.push(result);
        }
      } catch (err) {
        console.error("Top players data fetch error:", err);
      }
    }

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
      encounterName: fightMeta.name,
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

    // Cache result
    setCache(cacheKey, result, ANALYSIS_CACHE_TTL);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Analysis error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
