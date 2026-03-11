import {
  GEAR_SLOTS,
  ENCHANTABLE_SLOTS,
  FLASK_BUFF_IDS,
  ELIXIR_BUFF_IDS,
  FOOD_BUFF_IDS,
  WEAPON_ENHANCEMENT_IDS,
  CLASS_TALENT_TREES,
  getPerformanceGrade,
} from "./constants";
import {
  AnalysisResult,
  ConsumableStatus,
  DpsComparison,
  GearAnalysis,
  GearSlotComparison,
  TalentAnalysis,
  TalentDiff,
  TalentTreeSummary,
  BuffAnalysis,
  BuffComparison,
  CastAnalysis,
  CastComparison,
  AbilityShare,
  ImprovementSuggestion,
  WCLGearItem,
  WCLTalent,
  WCLDamageEntry,
  WCLBuffEntry,
  WCLCastEntry,
  WCLRanking,
  WCLRankingGearItem,
  TopPlayerFullData,
  TalentConsensusEntry,
  TalentConsensusAnalysis,
  GearPopularityItem,
  GearSlotPopularity,
  GearPopularityAnalysis,
  AbilityPriorityEntry,
  MetricPercentile,
  MetricPercentileAnalysis,
} from "./wcl-types";

// ─── DPS Comparison ──────────────────────────────────────────────────

export function analyzeDps(
  playerDamage: number,
  fightDuration: number,
  rankings: WCLRanking[],
  totalRankingCount?: number
): DpsComparison {
  const playerDps = playerDamage / (fightDuration / 1000);
  const dpsValues = rankings.map((r) => r.amount).sort((a, b) => a - b);

  const medianDps =
    dpsValues.length > 0
      ? dpsValues[Math.floor(dpsValues.length / 2)]
      : playerDps;

  const topDps = dpsValues.length > 0 ? dpsValues[dpsValues.length - 1] : playerDps;

  // Calculate percentile using total ranking count for accuracy.
  // Rankings only contains the top page of results, so we need the total count
  // to estimate where the player sits across ALL parses.
  let percentile = 50;
  if (dpsValues.length > 0) {
    // Guard against totalRankingCount being 0 or smaller than the fetched page
    const total = Math.max(totalRankingCount ?? dpsValues.length, dpsValues.length);
    // Count how many of the fetched rankings the player beats
    const beatsInPage = dpsValues.filter((d) => d <= playerDps).length;

    if (beatsInPage === 0) {
      // Player is below all fetched rankings — estimate position.
      const lowestRanked = dpsValues[0];
      const ratio = lowestRanked > 0 ? playerDps / lowestRanked : 0;

      if (total > dpsValues.length) {
        // We only have a page of top results; estimate rank in the remaining population
        const estimatedRank = Math.round(
          dpsValues.length + (total - dpsValues.length) * (1 - ratio)
        );
        percentile = Math.round(((total - estimatedRank) / total) * 100);
      } else {
        // All rankings fit on one page — estimate based on proximity to the lowest rank
        percentile = Math.round(ratio * 50);
      }
    } else {
      // Player beats some of the fetched rankings
      percentile = Math.round((beatsInPage / total) * 100);
      // Offset since these are the top players
      if (total > dpsValues.length) {
        percentile = Math.round(((total - dpsValues.length + beatsInPage) / total) * 100);
      }
    }
    // Floor at 1, cap at 99 — 0th and 100th are unreliable edge cases
    percentile = Math.max(1, Math.min(99, percentile));
  }

  return {
    playerDps: Math.round(playerDps),
    medianDps: Math.round(medianDps),
    topDps: Math.round(topDps),
    percentile,
    gapToMedian: medianDps > 0 ? Math.round(((medianDps - playerDps) / medianDps) * 100) : 0,
    gapToTop: topDps > 0 ? Math.round(((topDps - playerDps) / topDps) * 100) : 0,
    fightDuration,
  };
}

// ─── Gear Comparison ─────────────────────────────────────────────────

// Player gear comes from CombatantInfo events: array indexed by slot position,
// items have {id, quality (number), icon, itemLevel, permanentEnchant (number), gems}
// Rankings gear comes from characterRankings: array indexed by slot position,
// items have {name, quality (string), id, icon}

function normalizePlayerGear(rawGear: WCLGearItem[]): Map<number, WCLGearItem> {
  const bySlot = new Map<number, WCLGearItem>();
  for (let i = 0; i < rawGear.length; i++) {
    const item = rawGear[i];
    if (item && item.id > 0) {
      bySlot.set(i, { ...item, slot: i });
    }
  }
  return bySlot;
}

function normalizeRankingGear(rawGear: WCLRankingGearItem[]): Map<number, WCLGearItem> {
  const bySlot = new Map<number, WCLGearItem>();
  for (let i = 0; i < rawGear.length; i++) {
    const item = rawGear[i];
    if (item && item.id > 0) {
      bySlot.set(i, {
        id: item.id,
        slot: i,
        quality: item.quality,
        icon: item.icon,
        name: item.name,
      });
    }
  }
  return bySlot;
}

export function analyzeGear(
  playerGear: WCLGearItem[],
  topRankingGear: WCLRankingGearItem[],
  wowheadDomain: string = "tbc"
): GearAnalysis {
  const playerGearBySlot = normalizePlayerGear(playerGear);
  const topGearBySlot = normalizeRankingGear(topRankingGear);

  let missingEnchants = 0;
  let missingGems = 0;
  const slots: GearSlotComparison[] = [];

  // Slots where enchants are reliably reported by WCL
  // Head(0) and Shoulder(2) excluded — Arcanums/inscriptions not in permanentEnchant
  // Off Hand(16) excluded — held-in-off-hand items (orbs, tomes) are not enchantable
  const enchantableSlots = new Set([4, 6, 7, 8, 9, 14, 15]);

  for (const [slotId, slotName] of Object.entries(GEAR_SLOTS)) {
    const slot = parseInt(slotId);
    if (slot === 3 || slot === 18) continue; // Skip Shirt & Tabard
    const playerItem = playerGearBySlot.get(slot) ?? null;
    const topItem = topGearBySlot.get(slot) ?? null;

    // Player enchant data — prefer name from playerDetails, fall back to ID from events API
    const hasPlayerEnchant = !!playerItem?.permanentEnchant;
    const playerEnchant = hasPlayerEnchant
      ? (playerItem!.permanentEnchantName ?? `Enchant #${playerItem!.permanentEnchant}`)
      : null;
    // Rankings gear doesn't include enchant info
    const topEnchant: string | null = null;

    // Only flag missing enchant if player has the slot filled but no enchant
    const shouldHaveEnchant = enchantableSlots.has(slot);
    const missingEnchant = shouldHaveEnchant && playerItem !== null && !hasPlayerEnchant;
    if (missingEnchant) missingEnchants++;

    // Check missing gems on player items
    if (playerItem && !playerItem.gems?.length && topItem) {
      // Could count as missing gems, but we'd need socket info
    }

    slots.push({
      slot,
      slotName,
      playerItem,
      topItem,
      isSame: playerItem?.id === topItem?.id,
      playerEnchant,
      topEnchant,
      missingEnchant,
    });
  }

  // Calculate average item level from player gear (events API includes itemLevel)
  const playerItems = Array.from(playerGearBySlot.values());
  const playerIlvls = playerItems.filter((i) => i.itemLevel).map((i) => i.itemLevel!);
  const playerAvgIlvl =
    playerIlvls.length > 0
      ? Math.round(playerIlvls.reduce((a, b) => a + b, 0) / playerIlvls.length)
      : 0;

  return {
    slots,
    playerAvgIlvl,
    topAvgIlvl: 0, // Rankings gear doesn't include ilvl
    missingEnchants,
    missingGems,
    wowheadDomain,
  };
}

// ─── Talent Comparison ───────────────────────────────────────────────

export function analyzeTalents(
  playerTalents: WCLTalent[],
  topTalents: WCLTalent[],
  playerSpec: string,
  topSpec: string,
  playerClass?: string
): TalentAnalysis {
  // Detect Classic/TBC tree-based format: talents are just point distributions per tree
  // (typically 3 entries where guid is the point count, e.g. 40/0/21)
  const isTreeBased =
    playerTalents.length <= 3 &&
    playerTalents.every((t) => !t.name || t.name === "Unknown Ability");

  if (isTreeBased && playerTalents.length > 0) {
    const treeNames: string[] = playerClass ? (CLASS_TALENT_TREES[playerClass] ?? []) : [];
    const playerDist = playerTalents.map((t) => t.guid);

    // Top talents from rankings are also tree-based if they have the same structure
    // But rankings often return broken data (all zeros) — detect and handle
    const topIsTreeBased =
      topTalents.length <= 3 &&
      topTalents.every((t) => !t.name || t.name === "Unknown Ability");
    const topHasData = topIsTreeBased && topTalents.length === playerTalents.length;
    const topDist = topHasData ? topTalents.map((t) => t.guid) : [];
    const hasTopComparison = topDist.length > 0 && topDist.some((v) => v > 0);

    // Build diffs per tree (only if we have valid top data)
    const diffs: TalentDiff[] = [];
    let totalDiffs = 0;
    if (hasTopComparison) {
      for (let i = 0; i < playerDist.length; i++) {
        const playerPts = playerDist[i] ?? 0;
        const topPts = topDist[i] ?? 0;
        const diff = topPts - playerPts;
        if (diff !== 0) {
          totalDiffs += Math.abs(diff);
          diffs.push({
            name: treeNames[i] ?? `Tree ${i + 1}`,
            guid: i,
            icon: "",
            playerPoints: playerPts,
            topPoints: topPts,
            diff,
          });
        }
      }
    }

    const treeSummary: TalentTreeSummary = {
      playerDistribution: playerDist,
      topDistribution: hasTopComparison ? topDist : [],
      treeNames: treeNames.length >= playerDist.length
        ? treeNames.slice(0, playerDist.length)
        : Array.from({ length: playerDist.length }, (_, i) => `Tree ${i + 1}`),
    };

    return { diffs, playerSpec, topSpec, totalDiffs, treeSummary };
  }

  // Standard per-talent comparison (Wrath+)
  const topByGuid = new Map<number, WCLTalent>();
  for (const t of topTalents) {
    topByGuid.set(t.guid, t);
  }

  const playerByGuid = new Map<number, WCLTalent>();
  for (const t of playerTalents) {
    playerByGuid.set(t.guid, t);
  }

  const allGuids = new Set([...topByGuid.keys(), ...playerByGuid.keys()]);
  const diffs: TalentDiff[] = [];
  let totalDiffs = 0;

  for (const guid of allGuids) {
    const playerT = playerByGuid.get(guid);
    const topT = topByGuid.get(guid);
    const playerPts = playerT?.points ?? 0;
    const topPts = topT?.points ?? 0;
    const diff = topPts - playerPts;

    if (diff !== 0) {
      totalDiffs += Math.abs(diff);
      diffs.push({
        name: (playerT ?? topT)!.name,
        guid,
        icon: (playerT ?? topT)!.abilityIcon,
        playerPoints: playerPts,
        topPoints: topPts,
        diff,
      });
    }
  }

  diffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  return { diffs, playerSpec, topSpec, totalDiffs };
}

// ─── Buff Uptime Comparison ──────────────────────────────────────────

export function analyzeBuffs(
  playerBuffs: WCLBuffEntry[],
  topBuffs: WCLBuffEntry[],
  fightDuration: number
): BuffAnalysis {
  const topByGuid = new Map<number, WCLBuffEntry>();
  for (const b of topBuffs) {
    topByGuid.set(b.guid, b);
  }

  const playerByGuid = new Map<number, WCLBuffEntry>();
  for (const b of playerBuffs) {
    playerByGuid.set(b.guid, b);
  }

  const buffs: BuffComparison[] = [];
  const missingBuffs: string[] = [];
  const lowUptimeBuffs: string[] = [];

  // Check all top player buffs
  for (const topBuff of topBuffs) {
    const playerBuff = playerByGuid.get(topBuff.guid);
    const topUptime = Math.min((topBuff.totalUptime / fightDuration) * 100, 100);

    if (!playerBuff) {
      if (topUptime > 20) {
        missingBuffs.push(topBuff.name);
        buffs.push({
          name: topBuff.name,
          guid: topBuff.guid,
          icon: topBuff.abilityIcon,
          playerUptime: 0,
          topUptime: Math.round(topUptime),
          gap: Math.round(topUptime),
          isMissing: true,
        });
      }
    } else {
      const playerUptime = Math.min(
        (playerBuff.totalUptime / fightDuration) * 100,
        100
      );
      const gap = topUptime - playerUptime;
      if (gap > 5) {
        lowUptimeBuffs.push(topBuff.name);
      }
      buffs.push({
        name: topBuff.name,
        guid: topBuff.guid,
        icon: topBuff.abilityIcon,
        playerUptime: Math.round(playerUptime),
        topUptime: Math.round(topUptime),
        gap: Math.round(gap),
        isMissing: false,
      });
    }
  }

  buffs.sort((a, b) => b.gap - a.gap);

  return { buffs: buffs.slice(0, 20), missingBuffs, lowUptimeBuffs };
}

// ─── Cast Efficiency Comparison ──────────────────────────────────────

export function analyzeCasts(
  playerCasts: WCLCastEntry[],
  topCasts: WCLCastEntry[],
  playerDuration: number,
  topDuration: number
): CastAnalysis {
  const playerMinutes = playerDuration / 1000 / 60;
  const topMinutes = topDuration / 1000 / 60;

  const topByGuid = new Map<number, WCLCastEntry>();
  for (const c of topCasts) {
    topByGuid.set(c.guid, c);
  }

  const casts: CastComparison[] = [];

  for (const pc of playerCasts) {
    const tc = topByGuid.get(pc.guid);
    const playerCpm = playerMinutes > 0 ? pc.total / playerMinutes : 0;
    const topCpm = tc && topMinutes > 0 ? tc.total / topMinutes : 0;

    casts.push({
      name: pc.name,
      guid: pc.guid,
      icon: pc.abilityIcon,
      playerCasts: pc.total,
      playerCpm: Math.round(playerCpm * 10) / 10,
      topCasts: tc?.total ?? 0,
      topCpm: Math.round(topCpm * 10) / 10,
      cpmDiff: Math.round((topCpm - playerCpm) * 10) / 10,
    });
  }

  casts.sort((a, b) => Math.abs(b.cpmDiff) - Math.abs(a.cpmDiff));

  // Calculate active time based on total casts
  const playerTotalCasts = playerCasts.reduce((sum, c) => sum + c.total, 0);
  const topTotalCasts = topCasts.reduce((sum, c) => sum + c.total, 0);

  return {
    casts: casts.slice(0, 20),
    playerActiveTime: playerMinutes > 0 ? playerTotalCasts / playerMinutes : 0,
    topActiveTime: topMinutes > 0 ? topTotalCasts / topMinutes : 0,
  };
}

// ─── Ability Breakdown ───────────────────────────────────────────────

export function analyzeAbilities(
  playerDamage: WCLDamageEntry[],
  topDamage: WCLDamageEntry[]
): AbilityShare[] {
  const playerTotal = playerDamage.reduce((s, d) => s + d.total, 0);
  const topTotal = topDamage.reduce((s, d) => s + d.total, 0);

  const topByGuid = new Map<number, WCLDamageEntry>();
  for (const d of topDamage) {
    topByGuid.set(d.guid, d);
  }

  const abilities: AbilityShare[] = [];
  const seen = new Set<number>();

  for (const pd of playerDamage) {
    seen.add(pd.guid);
    const td = topByGuid.get(pd.guid);
    abilities.push({
      name: pd.name,
      guid: pd.guid,
      icon: pd.abilityIcon,
      playerShare: playerTotal > 0 ? Math.round((pd.total / playerTotal) * 1000) / 10 : 0,
      topShare: td && topTotal > 0 ? Math.round((td.total / topTotal) * 1000) / 10 : 0,
      playerTotal: pd.total,
      topTotal: td?.total ?? 0,
    });
  }

  // Add abilities that top player uses but player doesn't
  for (const td of topDamage) {
    if (!seen.has(td.guid)) {
      abilities.push({
        name: td.name,
        guid: td.guid,
        icon: td.abilityIcon,
        playerShare: 0,
        topShare: topTotal > 0 ? Math.round((td.total / topTotal) * 1000) / 10 : 0,
        playerTotal: 0,
        topTotal: td.total,
      });
    }
  }

  abilities.sort((a, b) => b.playerShare - a.playerShare || b.topShare - a.topShare);

  return abilities.slice(0, 15);
}

// ─── Consumable Detection ────────────────────────────────────────────

export function detectConsumables(
  buffs: WCLBuffEntry[],
  gear: WCLGearItem[] = []
): ConsumableStatus {
  const buffGuids = new Set(buffs.map((b) => b.guid));

  const flask = [...FLASK_BUFF_IDS].some((id) => buffGuids.has(id))
    || [...ELIXIR_BUFF_IDS].some((id) => buffGuids.has(id));
  const food = [...FOOD_BUFF_IDS].some((id) => buffGuids.has(id));

  // Weapon oils/stones are temporary item enchants — check gear first, then buffs table
  const weaponEnhancement =
    gear.some((g, i) => (i === 15 || i === 16) && !!g.temporaryEnchant)
    || [...WEAPON_ENHANCEMENT_IDS].some((id) => buffGuids.has(id));

  return { flask, food, weaponEnhancement };
}

// ─── Improvement Suggestions ─────────────────────────────────────────

export function generateSuggestions(
  dps: DpsComparison,
  gear: GearAnalysis,
  consumables: ConsumableStatus,
  casts: CastAnalysis,
  playerRole: "dps" | "healer" = "dps"
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];
  const metricLabel = playerRole === "healer" ? "HPS" : "DPS";
  const metricCategory = playerRole === "healer" ? "hps" as const : "dps" as const;

  // DPS/HPS gap
  if (dps.gapToMedian > 20) {
    suggestions.push({
      category: metricCategory,
      priority: "high",
      title: `Significant ${metricLabel} gap`,
      description: `Your ${metricLabel} is ${dps.gapToMedian}% below median for this encounter. Focus on the suggestions below to close this gap.`,
      estimatedImpact: `+${Math.round(dps.medianDps - dps.playerDps)} ${metricLabel} to reach median`,
    });
  } else if (dps.gapToMedian > 5) {
    suggestions.push({
      category: metricCategory,
      priority: "medium",
      title: `Moderate ${metricLabel} gap`,
      description: `Your ${metricLabel} is ${dps.gapToMedian}% below median. Small optimizations can close this gap.`,
    });
  }

  // Missing enchants
  if (gear.missingEnchants > 0) {
    suggestions.push({
      category: "gear",
      priority: gear.missingEnchants > 3 ? "high" : "medium",
      title: `${gear.missingEnchants} missing enchant${gear.missingEnchants > 1 ? "s" : ""}`,
      description: `Enchant all available slots. Missing: ${gear.slots
        .filter((s) => s.missingEnchant)
        .map((s) => s.slotName)
        .join(", ")}.`,
    });
  }

  // Consumable warnings — specific and actionable
  if (!consumables.flask) {
    suggestions.push({
      category: "consumables",
      priority: "high",
      title: "No flask or elixir detected",
      description: "Use a flask (or battle + guardian elixir combo) for every pull. This is free throughput.",
    });
  }
  if (!consumables.food) {
    suggestions.push({
      category: "consumables",
      priority: "high",
      title: "No food buff detected",
      description: "Eat stat food before every pull. Even basic food provides a meaningful stat boost.",
    });
  }
  if (!consumables.weaponEnhancement) {
    suggestions.push({
      category: "consumables",
      priority: "medium",
      title: "No weapon enhancement detected",
      description: "Apply a weapon oil, sharpening stone, or weight stone for additional stats.",
    });
  }

  // Active time (ABC)
  if (casts.topActiveTime > 0 && casts.playerActiveTime / casts.topActiveTime < 0.85) {
    suggestions.push({
      category: "casts",
      priority: "high",
      title: "Low active time (ABC: Always Be Casting)",
      description:
        "Your overall casts per minute is significantly lower than top players. Reduce idle time, pre-position for mechanics, and keep your GCD rolling.",
    });
  }

  suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return suggestions;
}

// ─── Averaged Buff Comparison (Top N) ────────────────────────────────

export function analyzeBuffsAgainstAverage(
  playerBuffs: WCLBuffEntry[],
  topPlayersData: TopPlayerFullData[],
  playerDuration: number
): BuffAnalysis {
  if (topPlayersData.length === 0) {
    return { buffs: [], missingBuffs: [], lowUptimeBuffs: [] };
  }

  const N = topPlayersData.length;

  // Collect all buff GUIDs across all top players, compute avg uptime %
  const buffAggregates = new Map<number, { name: string; icon: string; totalPct: number; count: number }>();
  for (const tp of topPlayersData) {
    for (const b of tp.buffEntries) {
      const pct = Math.min((b.totalUptime / tp.duration) * 100, 100);
      const existing = buffAggregates.get(b.guid);
      if (existing) {
        existing.totalPct += pct;
        existing.count++;
      } else {
        buffAggregates.set(b.guid, { name: b.name, icon: b.abilityIcon, totalPct: pct, count: 1 });
      }
    }
  }

  const playerByGuid = new Map<number, WCLBuffEntry>();
  for (const b of playerBuffs) {
    playerByGuid.set(b.guid, b);
  }

  const buffs: BuffComparison[] = [];
  const missingBuffs: string[] = [];
  const lowUptimeBuffs: string[] = [];

  for (const [guid, agg] of buffAggregates) {
    // Only include buffs present in >= 2 of N players (or all if N <= 2)
    if (agg.count < Math.min(2, N)) continue;

    const avgTopUptime = agg.totalPct / N; // missing players contribute 0
    if (avgTopUptime < 5) continue; // skip very low uptime buffs

    const playerBuff = playerByGuid.get(guid);
    const playerUptime = playerBuff
      ? Math.min((playerBuff.totalUptime / playerDuration) * 100, 100)
      : 0;
    const gap = avgTopUptime - playerUptime;

    if (!playerBuff && avgTopUptime > 20) {
      missingBuffs.push(agg.name);
    }
    if (playerBuff && gap > 5) {
      lowUptimeBuffs.push(agg.name);
    }

    buffs.push({
      name: agg.name,
      guid,
      icon: agg.icon,
      playerUptime: Math.round(playerUptime),
      topUptime: Math.round(avgTopUptime),
      gap: Math.round(gap),
      isMissing: !playerBuff,
    });
  }

  buffs.sort((a, b) => b.gap - a.gap);
  return { buffs: buffs.slice(0, 20), missingBuffs, lowUptimeBuffs };
}

// ─── Averaged Cast Comparison (Top N) ────────────────────────────────

export function analyzeCastsAgainstAverage(
  playerCasts: WCLCastEntry[],
  topPlayersData: TopPlayerFullData[],
  playerDuration: number
): CastAnalysis {
  if (topPlayersData.length === 0) {
    const playerMinutes = playerDuration / 1000 / 60;
    const playerTotalCasts = playerCasts.reduce((sum, c) => sum + c.total, 0);
    return {
      casts: playerCasts.slice(0, 20).map((c) => ({
        name: c.name, guid: c.guid, icon: c.abilityIcon,
        playerCasts: c.total,
        playerCpm: playerMinutes > 0 ? Math.round((c.total / playerMinutes) * 10) / 10 : 0,
        topCasts: 0, topCpm: 0, cpmDiff: 0,
      })),
      playerActiveTime: playerMinutes > 0 ? playerTotalCasts / playerMinutes : 0,
      topActiveTime: 0,
    };
  }

  const N = topPlayersData.length;
  const playerMinutes = playerDuration / 1000 / 60;

  // Aggregate CPM per ability across top players
  const castAggregates = new Map<number, { name: string; icon: string; totalCpm: number; totalCasts: number }>();
  let topTotalCpmSum = 0;

  for (const tp of topPlayersData) {
    const tpMinutes = tp.duration / 1000 / 60;
    if (tpMinutes <= 0) continue;
    let tpTotalCasts = 0;
    for (const c of tp.castEntries) {
      const cpm = c.total / tpMinutes;
      tpTotalCasts += c.total;
      const existing = castAggregates.get(c.guid);
      if (existing) {
        existing.totalCpm += cpm;
        existing.totalCasts += c.total;
      } else {
        castAggregates.set(c.guid, { name: c.name, icon: c.abilityIcon, totalCpm: cpm, totalCasts: c.total });
      }
    }
    topTotalCpmSum += tpTotalCasts / tpMinutes;
  }

  const casts: CastComparison[] = [];
  const playerByGuid = new Map<number, WCLCastEntry>();
  for (const c of playerCasts) {
    playerByGuid.set(c.guid, c);
  }

  // Include player casts
  const seen = new Set<number>();
  for (const pc of playerCasts) {
    seen.add(pc.guid);
    const agg = castAggregates.get(pc.guid);
    const playerCpm = playerMinutes > 0 ? pc.total / playerMinutes : 0;
    const avgTopCpm = agg ? agg.totalCpm / N : 0;

    casts.push({
      name: pc.name,
      guid: pc.guid,
      icon: pc.abilityIcon,
      playerCasts: pc.total,
      playerCpm: Math.round(playerCpm * 10) / 10,
      topCasts: agg ? Math.round(agg.totalCasts / N) : 0,
      topCpm: Math.round(avgTopCpm * 10) / 10,
      cpmDiff: Math.round((avgTopCpm - playerCpm) * 10) / 10,
    });
  }

  casts.sort((a, b) => Math.abs(b.cpmDiff) - Math.abs(a.cpmDiff));

  const playerTotalCasts = playerCasts.reduce((sum, c) => sum + c.total, 0);

  return {
    casts: casts.slice(0, 20),
    playerActiveTime: playerMinutes > 0 ? playerTotalCasts / playerMinutes : 0,
    topActiveTime: topTotalCpmSum / N,
  };
}

// ─── Averaged Ability Comparison (Top N) ─────────────────────────────

export function analyzeAbilitiesAgainstAverage(
  playerDamage: WCLDamageEntry[],
  topPlayersData: TopPlayerFullData[]
): AbilityShare[] {
  if (topPlayersData.length === 0) {
    return analyzeAbilities(playerDamage, []);
  }

  const N = topPlayersData.length;
  const playerTotal = playerDamage.reduce((s, d) => s + d.total, 0);

  // For each top player, compute damage shares, then average
  const shareAggregates = new Map<number, { name: string; icon: string; totalShare: number; totalDmg: number }>();
  for (const tp of topPlayersData) {
    const tpTotal = tp.throughputEntries.reduce((s, d) => s + d.total, 0);
    if (tpTotal <= 0) continue;
    for (const d of tp.throughputEntries) {
      const share = (d.total / tpTotal) * 100;
      const existing = shareAggregates.get(d.guid);
      if (existing) {
        existing.totalShare += share;
        existing.totalDmg += d.total;
      } else {
        shareAggregates.set(d.guid, { name: d.name, icon: d.abilityIcon, totalShare: share, totalDmg: d.total });
      }
    }
  }

  const abilities: AbilityShare[] = [];
  const seen = new Set<number>();

  for (const pd of playerDamage) {
    seen.add(pd.guid);
    const agg = shareAggregates.get(pd.guid);
    const avgTopShare = agg ? agg.totalShare / N : 0;

    abilities.push({
      name: pd.name,
      guid: pd.guid,
      icon: pd.abilityIcon,
      playerShare: playerTotal > 0 ? Math.round((pd.total / playerTotal) * 1000) / 10 : 0,
      topShare: Math.round(avgTopShare * 10) / 10,
      playerTotal: pd.total,
      topTotal: agg ? Math.round(agg.totalDmg / N) : 0,
    });
  }

  // Build a set of spell GUIDs that top players actually *cast* (not just proc damage)
  const topPlayerCastGuids = new Set<number>();
  for (const tp of topPlayersData) {
    for (const c of tp.castEntries) {
      topPlayerCastGuids.add(c.guid);
    }
  }

  // Add abilities top players use but player doesn't
  // Only include if avg share > 1% AND at least one top player actually cast it
  // Skip legacy/garbage spells with "(OLD)" in the name
  for (const [guid, agg] of shareAggregates) {
    if (!seen.has(guid)) {
      const avgShare = agg.totalShare / N;
      if (avgShare > 1 && topPlayerCastGuids.has(guid) && !agg.name.includes("(OLD)")) {
        abilities.push({
          name: agg.name,
          guid,
          icon: agg.icon,
          playerShare: 0,
          topShare: Math.round(avgShare * 10) / 10,
          playerTotal: 0,
          topTotal: Math.round(agg.totalDmg / N),
        });
      }
    }
  }

  abilities.sort((a, b) => b.playerShare - a.playerShare || b.topShare - a.topShare);
  return abilities.slice(0, 15);
}

// ─── Talent Consensus (Feature 2) ───────────────────────────────────

export function analyzeTalentConsensus(
  playerTalents: WCLTalent[],
  rankings: WCLRanking[],
  playerSpec: string
): TalentConsensusAnalysis {
  // Filter rankings that have talent data
  const withTalents = rankings.filter((r) => r.talents && r.talents.length > 0);
  if (withTalents.length === 0) {
    return { talents: [], playerSpec, sampleSize: 0, matchPercentage: 100 };
  }

  const playerTalentGuids = new Set(playerTalents.map((t) => t.guid));
  const sampleSize = withTalents.length;

  // Count frequency of each talent ID
  const talentFreq = new Map<number, { name: string; icon: string; count: number }>();
  for (const r of withTalents) {
    for (const t of r.talents!) {
      const existing = talentFreq.get(t.id);
      if (existing) {
        existing.count++;
      } else {
        talentFreq.set(t.id, { name: t.name, icon: t.icon, count: 1 });
      }
    }
  }

  const talents: TalentConsensusEntry[] = [];
  let consensusCount = 0;
  let playerHasConsensusCount = 0;

  for (const [id, freq] of talentFreq) {
    const percentage = Math.round((freq.count / sampleSize) * 100);
    const playerHasTalent = playerTalentGuids.has(id);
    talents.push({
      name: freq.name,
      id,
      icon: freq.icon,
      frequency: freq.count,
      totalPlayers: sampleSize,
      percentage,
      playerHasTalent,
    });

    // Consensus = taken by >= 50% of top players
    if (percentage >= 50) {
      consensusCount++;
      if (playerHasTalent) playerHasConsensusCount++;
    }
  }

  // Sort: missing consensus talents first, then by frequency desc
  talents.sort((a, b) => {
    const aIsConsensusMissing = a.percentage >= 50 && !a.playerHasTalent ? 1 : 0;
    const bIsConsensusMissing = b.percentage >= 50 && !b.playerHasTalent ? 1 : 0;
    if (bIsConsensusMissing !== aIsConsensusMissing) return bIsConsensusMissing - aIsConsensusMissing;
    return b.percentage - a.percentage;
  });

  const matchPercentage = consensusCount > 0
    ? Math.round((playerHasConsensusCount / consensusCount) * 100)
    : 100;

  return { talents, playerSpec, sampleSize, matchPercentage };
}

// ─── Gear Popularity (Feature 3) ────────────────────────────────────

export function analyzeGearPopularity(
  playerGear: WCLGearItem[],
  rankings: WCLRanking[]
): GearPopularityAnalysis {
  const withGear = rankings.filter((r) => r.gear && r.gear.length > 0);
  if (withGear.length === 0) {
    return { slots: [], sampleSize: 0, popularMatchCount: 0, totalSlots: 0 };
  }

  const sampleSize = withGear.length;
  const playerGearBySlot = new Map<number, WCLGearItem>();
  for (let i = 0; i < playerGear.length; i++) {
    if (playerGear[i] && playerGear[i].id > 0) {
      playerGearBySlot.set(i, playerGear[i]);
    }
  }

  const slots: GearSlotPopularity[] = [];
  let popularMatchCount = 0;
  let totalSlots = 0;

  for (const [slotId, slotName] of Object.entries(GEAR_SLOTS)) {
    const slot = parseInt(slotId);
    if (slot === 3 || slot === 18) continue; // Skip Shirt & Tabard

    // Count item frequency for this slot
    const itemCounts = new Map<number, { name: string; icon: string; quality: string; count: number }>();
    for (const r of withGear) {
      const item = r.gear![slot];
      if (!item || item.id <= 0) continue;
      const existing = itemCounts.get(item.id);
      if (existing) {
        existing.count++;
      } else {
        itemCounts.set(item.id, { name: item.name, icon: item.icon, quality: item.quality, count: 1 });
      }
    }

    if (itemCounts.size === 0) continue;

    const items: GearPopularityItem[] = Array.from(itemCounts.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        icon: data.icon,
        quality: data.quality,
        count: data.count,
        percentage: Math.round((data.count / sampleSize) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const playerItem = playerGearBySlot.get(slot);
    const mostPopularId = items[0]?.id;
    const playerUsesPopular = playerItem ? playerItem.id === mostPopularId : false;

    totalSlots++;
    if (playerUsesPopular) popularMatchCount++;

    slots.push({
      slot,
      slotName,
      playerItemId: playerItem?.id ?? null,
      playerItemName: playerItem?.name ?? null,
      playerUsesPopular,
      items,
      totalPlayers: sampleSize,
    });
  }

  return { slots, sampleSize, popularMatchCount, totalSlots };
}

// ─── Ability Priority Map (Feature 4) ───────────────────────────────

export function analyzeAbilityPriority(
  playerDamage: WCLDamageEntry[],
  topPlayersData: TopPlayerFullData[]
): AbilityPriorityEntry[] {
  if (topPlayersData.length === 0) return [];

  const playerTotal = playerDamage.reduce((s, d) => s + d.total, 0);
  const N = topPlayersData.length;

  // Build a set of spell GUIDs that top players actually *cast*
  const topPlayerCastGuids = new Set<number>();
  for (const tp of topPlayersData) {
    for (const c of tp.castEntries) {
      topPlayerCastGuids.add(c.guid);
    }
  }

  // Collect damage share % per ability per top player
  const abilityShares = new Map<number, { name: string; icon: string; shares: number[] }>();
  for (const tp of topPlayersData) {
    const tpTotal = tp.throughputEntries.reduce((s, d) => s + d.total, 0);
    if (tpTotal <= 0) continue;
    for (const d of tp.throughputEntries) {
      const share = (d.total / tpTotal) * 100;
      const existing = abilityShares.get(d.guid);
      if (existing) {
        existing.shares.push(share);
      } else {
        abilityShares.set(d.guid, { name: d.name, icon: d.abilityIcon, shares: [share] });
      }
    }
  }

  // Player shares
  const playerShareMap = new Map<number, number>();
  for (const d of playerDamage) {
    playerShareMap.set(d.guid, playerTotal > 0 ? (d.total / playerTotal) * 100 : 0);
  }

  const entries: AbilityPriorityEntry[] = [];
  for (const [guid, agg] of abilityShares) {
    // Skip legacy/garbage spells
    if (agg.name.includes("(OLD)")) continue;

    // Pad missing values with 0 for players that didn't use this ability
    while (agg.shares.length < N) agg.shares.push(0);
    const avg = agg.shares.reduce((a, b) => a + b, 0) / N;
    const min = Math.min(...agg.shares);
    const max = Math.max(...agg.shares);
    const playerShare = playerShareMap.get(guid) ?? 0;

    // Filter out noise — also skip abilities nobody actually cast (proc-only damage)
    if (avg < 0.5 && playerShare < 0.5) continue;
    if (playerShare === 0 && !topPlayerCastGuids.has(guid)) continue;

    entries.push({
      name: agg.name,
      guid,
      icon: agg.icon,
      playerShare: Math.round(playerShare * 10) / 10,
      avgTopShare: Math.round(avg * 10) / 10,
      minTopShare: Math.round(min * 10) / 10,
      maxTopShare: Math.round(max * 10) / 10,
      shareDeviation: Math.round((playerShare - avg) * 10) / 10,
      rank: 0, // filled below
      playerRank: 0,
    });
  }

  // Also include player abilities not in top players
  for (const d of playerDamage) {
    if (!abilityShares.has(d.guid)) {
      const playerShare = playerTotal > 0 ? (d.total / playerTotal) * 100 : 0;
      if (playerShare < 0.5) continue;
      entries.push({
        name: d.name,
        guid: d.guid,
        icon: d.abilityIcon,
        playerShare: Math.round(playerShare * 10) / 10,
        avgTopShare: 0,
        minTopShare: 0,
        maxTopShare: 0,
        shareDeviation: Math.round(playerShare * 10) / 10,
        rank: 0,
        playerRank: 0,
      });
    }
  }

  // Assign ranks
  entries.sort((a, b) => b.avgTopShare - a.avgTopShare);
  entries.forEach((e, i) => { e.rank = i + 1; });

  const byPlayerShare = [...entries].sort((a, b) => b.playerShare - a.playerShare);
  byPlayerShare.forEach((e, i) => { e.playerRank = i + 1; });

  // Sort by avgTopShare desc for final output
  entries.sort((a, b) => b.avgTopShare - a.avgTopShare || b.playerShare - a.playerShare);
  return entries.slice(0, 15);
}

// ─── Metric Percentiles (Feature 5) ─────────────────────────────────

export function analyzeMetricPercentiles(params: {
  casts: CastAnalysis;
  gear: GearAnalysis;
  consumables: ConsumableStatus;
  talentConsensus: TalentConsensusAnalysis;
  gearPopularity: GearPopularityAnalysis;
}): MetricPercentileAnalysis {
  const { casts, gear, consumables, talentConsensus, gearPopularity } = params;

  // Active Time (CPM)
  const activeTimePct = casts.topActiveTime > 0
    ? Math.min(Math.round((casts.playerActiveTime / casts.topActiveTime) * 100), 100)
    : 50;

  // Enchant Coverage
  const enchantableCount = gear.slots.filter((s) => ENCHANTABLE_SLOTS.has(s.slot) && s.playerItem !== null).length;
  const enchantedCount = enchantableCount - gear.missingEnchants;
  const enchantPct = enchantableCount > 0
    ? Math.round((enchantedCount / enchantableCount) * 100)
    : 100;

  // Consumables (3 categories: flask, food, weaponEnhancement)
  const consumableCount = [consumables.flask, consumables.food, consumables.weaponEnhancement]
    .filter(Boolean).length;
  const consumablePct = Math.round((consumableCount / 3) * 100);

  // Talent Build
  const talentPct = talentConsensus.matchPercentage;

  // Gear Meta
  const gearMetaPct = gearPopularity.totalSlots > 0
    ? Math.round((gearPopularity.popularMatchCount / gearPopularity.totalSlots) * 100)
    : 50;

  const metrics: MetricPercentile[] = [
    {
      metric: "activeTime",
      label: "Active Time (CPM)",
      playerValue: Math.round(casts.playerActiveTime * 10) / 10,
      topAvgValue: Math.round(casts.topActiveTime * 10) / 10,
      percentile: activeTimePct,
      grade: getPerformanceGrade(activeTimePct),
      description: activeTimePct >= 90 ? "Excellent uptime" : activeTimePct >= 70 ? "Good uptime, small gaps" : "Significant casting downtime",
    },
    {
      metric: "enchants",
      label: "Enchant Coverage",
      playerValue: enchantedCount,
      topAvgValue: enchantableCount,
      percentile: enchantPct,
      grade: getPerformanceGrade(enchantPct),
      description: enchantPct >= 100 ? "All slots enchanted" : `${gear.missingEnchants} enchant${gear.missingEnchants > 1 ? "s" : ""} missing`,
    },
    {
      metric: "consumables",
      label: "Consumables",
      playerValue: consumableCount,
      topAvgValue: 3,
      percentile: consumablePct,
      grade: getPerformanceGrade(consumablePct),
      description: consumablePct >= 100 ? "All consumables active" : `${3 - consumableCount} consumable${3 - consumableCount > 1 ? "s" : ""} missing`,
    },
    {
      metric: "talents",
      label: "Talent Build",
      playerValue: talentPct,
      topAvgValue: 100,
      percentile: talentPct,
      grade: getPerformanceGrade(talentPct),
      description: talentPct >= 90 ? "Build matches consensus" : talentPct >= 70 ? "Minor talent deviations" : "Significant talent differences",
    },
    {
      metric: "gearMeta",
      label: "Gear Meta",
      playerValue: gearPopularity.popularMatchCount,
      topAvgValue: gearPopularity.totalSlots,
      percentile: gearMetaPct,
      grade: getPerformanceGrade(gearMetaPct),
      description: gearMetaPct >= 75 ? "Using popular items" : gearMetaPct >= 50 ? "Some off-meta items" : "Many off-meta gear choices",
    },
  ];

  // Weighted overall: Active Time (3x), Consumables (2x), Talent Build (2x), Enchant (1x), Gear Meta (1x)
  const weights = [3, 1, 2, 2, 1];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const overallScore = Math.round(
    metrics.reduce((sum, m, i) => sum + m.percentile * weights[i], 0) / totalWeight
  );

  return {
    metrics,
    overallScore,
    overallGrade: getPerformanceGrade(overallScore),
  };
}

// ─── Build Full Analysis Result ──────────────────────────────────────

export function buildAnalysisResult(params: {
  playerName: string;
  playerClass: string;
  playerSpec: string;
  playerRole?: "dps" | "healer";
  encounterName: string;
  fightDuration: number;
  playerTotalDamage: number;
  playerGear: WCLGearItem[];
  playerTalents: WCLTalent[];
  playerDamageTable: WCLDamageEntry[];
  playerBuffTable: WCLBuffEntry[];
  playerCastTable: WCLCastEntry[];
  topPlayersData: TopPlayerFullData[];
  rankings: WCLRanking[];
  totalRankingCount?: number;
  wowheadDomain?: string;
}): AnalysisResult {
  const topPlayersData = params.topPlayersData;
  const topRanking = topPlayersData[0]?.ranking ?? params.rankings[0];
  const topPlayerNames = topPlayersData.map((tp) => tp.name);

  const dps = analyzeDps(params.playerTotalDamage, params.fightDuration, params.rankings, params.totalRankingCount);

  const gear = analyzeGear(
    params.playerGear,
    topRanking?.gear ?? [],
    params.wowheadDomain ?? "tbc"
  );

  // Convert ranking talents ({name, id, icon}) to our TalentDiff-compatible format
  const topTalentsNormalized: WCLTalent[] = (topRanking?.talents ?? []).map((t) => ({
    name: t.name,
    guid: t.id,
    type: 0,
    abilityIcon: t.icon,
    points: 1,
  }));

  const talents = analyzeTalents(
    params.playerTalents,
    topTalentsNormalized,
    params.playerSpec,
    topRanking?.spec ?? params.playerSpec,
    params.playerClass
  );

  // Use averaged comparisons when we have top player data
  const buffs = topPlayersData.length > 0
    ? analyzeBuffsAgainstAverage(params.playerBuffTable, topPlayersData, params.fightDuration)
    : analyzeBuffs(params.playerBuffTable, [], params.fightDuration);

  const casts = topPlayersData.length > 0
    ? analyzeCastsAgainstAverage(params.playerCastTable, topPlayersData, params.fightDuration)
    : analyzeCasts(params.playerCastTable, [], params.fightDuration, params.fightDuration);

  const abilities = topPlayersData.length > 0
    ? analyzeAbilitiesAgainstAverage(params.playerDamageTable, topPlayersData)
    : analyzeAbilities(params.playerDamageTable, []);

  const role = params.playerRole ?? "dps";
  const consumables = detectConsumables(params.playerBuffTable, params.playerGear);

  // New analysis features
  const talentConsensus = analyzeTalentConsensus(params.playerTalents, params.rankings, params.playerSpec);
  const gearPopularity = analyzeGearPopularity(params.playerGear, params.rankings);
  const abilityPriority = analyzeAbilityPriority(params.playerDamageTable, topPlayersData);
  const metricPercentiles = analyzeMetricPercentiles({
    casts,
    gear,
    consumables,
    talentConsensus,
    gearPopularity,
  });

  const suggestions = generateSuggestions(dps, gear, consumables, casts, role);

  return {
    playerName: params.playerName,
    playerClass: params.playerClass,
    playerSpec: params.playerSpec,
    playerRole: role,
    encounterName: params.encounterName,
    fightDuration: params.fightDuration,
    dps,
    gear,
    talents,
    buffs,
    casts,
    abilities,
    suggestions,
    consumables,
    topPlayerName: topRanking?.name ?? "N/A",
    topPlayerRank: 1,
    topPlayerNames,
    topPlayersCount: topPlayersData.length,
    talentConsensus,
    gearPopularity,
    abilityPriority,
    metricPercentiles,
  };
}
