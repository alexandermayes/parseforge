import type {
  RaidPlayerMetrics,
  RaidOverviewResult,
  DeathDetail,
  ConsumableStatus,
  WCLPlayerDetails,
  WCLCombatantInfoEvent,
} from "./wcl-types";
import {
  classifyRole,
  ROLE_SORT_ORDER,
  FLASK_BUFF_IDS,
  FOOD_BUFF_IDS,
  WEAPON_ENHANCEMENT_IDS,
  ENCHANTABLE_SLOTS,
  isHealerSpec,
} from "./constants";
import { BATTLE_ELIXIR_IDS, GUARDIAN_ELIXIR_IDS } from "./cla-constants";
import { parsePlayerSpec } from "./wcl-helpers";

// ─── WCL table entry shapes (fight-wide, per-player rows) ───────────

interface DamageTableEntry {
  id: number;
  name: string;
  type: string;
  icon: string;
  total: number;
  activeTime: number;
  activeTimeReduced: number;
}

interface DeathTableEntry {
  id: number;
  name: string;
  type: string;
  icon: string;
  deathTime: number;
  damage: { total: number };
  healing: { total: number };
}

interface DamageTakenTableEntry {
  id: number;
  name: string;
  type: string;
  icon: string;
  total: number;
}

// ─── Input types for the engine ─────────────────────────────────────

export interface RaidOverviewInput {
  playerDetails: WCLPlayerDetails[];
  damageEntries: DamageTableEntry[];
  healingEntries: DamageTableEntry[];
  deathEntries: DeathTableEntry[];
  damageTakenEntries: DamageTakenTableEntry[];
  combatantInfoEvents: WCLCombatantInfoEvent[];
  fightDuration: number;
  fightStartTime: number;
  encounterName: string;
}

// ─── Consumable detection ───────────────────────────────────────────

function detectConsumables(
  combatantInfo: WCLCombatantInfoEvent | undefined
): ConsumableStatus {
  if (!combatantInfo) {
    return { flask: false, food: false, weaponEnhancement: false };
  }

  const auras: number[] = [];
  // CombatantInfo events have an `auras` array with {source, ability, stacks, icon, name}
  // or sometimes just ability IDs; handle both formats
  const rawAuras = (combatantInfo as unknown as Record<string, unknown>).auras;
  if (Array.isArray(rawAuras)) {
    for (const aura of rawAuras) {
      if (typeof aura === "number") {
        auras.push(aura);
      } else if (aura && typeof aura === "object" && "ability" in aura) {
        auras.push((aura as { ability: number }).ability);
      }
    }
  }

  const hasFlask = auras.some((id) => FLASK_BUFF_IDS.has(id));
  const hasBattleElixir = auras.some((id) => BATTLE_ELIXIR_IDS.has(id));
  const hasGuardianElixir = auras.some((id) => GUARDIAN_ELIXIR_IDS.has(id));
  const hasFood = auras.some((id) => FOOD_BUFF_IDS.has(id));
  const hasWeaponEnh = auras.some((id) => WEAPON_ENHANCEMENT_IDS.has(id));

  // Check temporary enchant on gear as a fallback for weapon enhancement
  const hasTemporaryEnchant =
    combatantInfo.gear?.some(
      (g, i) => (i === 15 || i === 16) && g && g.temporaryEnchant
    ) ?? false;

  return {
    // Flask OR both battle + guardian elixir together
    flask: hasFlask || (hasBattleElixir && hasGuardianElixir),
    food: hasFood,
    weaponEnhancement: hasWeaponEnh || hasTemporaryEnchant,
  };
}

// ─── Gear analysis ──────────────────────────────────────────────────

function countMissingEnchants(
  combatantInfo: WCLCombatantInfoEvent | undefined
): number {
  if (!combatantInfo?.gear) return 0;

  let missing = 0;
  for (const [index, item] of combatantInfo.gear.entries()) {
    if (!ENCHANTABLE_SLOTS.has(index)) continue;
    if (!item || item.id === 0) continue; // empty slot
    if (!item.permanentEnchant) {
      missing++;
    }
  }
  return missing;
}

function computeAvgItemLevel(
  combatantInfo: WCLCombatantInfoEvent | undefined
): number {
  if (!combatantInfo?.gear) return 0;

  let totalIlvl = 0;
  let count = 0;
  for (const [index, item] of combatantInfo.gear.entries()) {
    if (index === 3 || index === 18) continue; // skip shirt & tabard
    if (!item || item.id === 0) continue;
    if (item.itemLevel) {
      totalIlvl += item.itemLevel;
      count++;
    }
  }

  return count > 0 ? Math.round(totalIlvl / count) : 0;
}

// ─── Main engine function ───────────────────────────────────────────

export function buildRaidOverview(input: RaidOverviewInput): RaidOverviewResult {
  const {
    playerDetails,
    damageEntries,
    healingEntries,
    deathEntries,
    damageTakenEntries,
    combatantInfoEvents,
    fightDuration,
    fightStartTime,
    encounterName,
  } = input;

  const durationSec = fightDuration / 1000;

  // Index combatant info by sourceID
  const combatantInfoBySource = new Map<number, WCLCombatantInfoEvent>();
  for (const event of combatantInfoEvents) {
    combatantInfoBySource.set(event.sourceID, event);
  }

  // Index damage done by player ID (from damage table entries)
  const damageById = new Map<number, DamageTableEntry>();
  for (const entry of damageEntries) {
    damageById.set(entry.id, entry);
  }

  // Index healing by player ID
  const healingById = new Map<number, DamageTableEntry>();
  for (const entry of healingEntries) {
    healingById.set(entry.id, entry);
  }

  // Build death details per player and global timeline
  const deathDetailsById = new Map<number, DeathDetail[]>();
  const deathTimeline: DeathDetail[] = [];

  // Build a name/class lookup from playerDetails
  const playerInfoById = new Map<number, { name: string; className: string }>();
  for (const p of playerDetails) {
    playerInfoById.set(p.id, { name: p.name, className: p.type });
  }

  for (const death of deathEntries) {
    const info = playerInfoById.get(death.id);
    const detail: DeathDetail = {
      playerName: info?.name ?? death.name,
      playerClass: info?.className ?? death.type,
      sourceId: death.id,
      fightTimeMs: death.deathTime,
      damage: death.damage?.total ?? 0,
      healing: death.healing?.total ?? 0,
    };
    const existing = deathDetailsById.get(death.id);
    if (existing) {
      existing.push(detail);
    } else {
      deathDetailsById.set(death.id, [detail]);
    }
    deathTimeline.push(detail);
  }

  // Sort timeline chronologically
  deathTimeline.sort((a, b) => a.fightTimeMs - b.fightTimeMs);

  // Index damage taken by player ID
  const damageTakenById = new Map<number, number>();
  for (const entry of damageTakenEntries) {
    damageTakenById.set(entry.id, (damageTakenById.get(entry.id) ?? 0) + entry.total);
  }

  // Build metrics for each player
  const players: RaidPlayerMetrics[] = [];

  for (const player of playerDetails) {
    const className = player.type;
    const spec = parsePlayerSpec(player);

    const role = classifyRole(className, spec, player.icon);
    const isHealer = isHealerSpec(spec);

    // For healers, use HPS; for everyone else, use DPS
    let throughput: number;
    let activityPercent: number;

    if (isHealer) {
      const healEntry = healingById.get(player.id);
      throughput = healEntry && durationSec > 0 ? healEntry.total / durationSec : 0;
      activityPercent = healEntry && fightDuration > 0
        ? Math.min(100, (healEntry.activeTime / fightDuration) * 100)
        : 0;
    } else {
      const dmgEntry = damageById.get(player.id);
      throughput = dmgEntry && durationSec > 0 ? dmgEntry.total / durationSec : 0;
      activityPercent = dmgEntry && fightDuration > 0
        ? Math.min(100, (dmgEntry.activeTime / fightDuration) * 100)
        : 0;
    }

    const combatantInfo = combatantInfoBySource.get(player.id);

    const playerDeaths = deathDetailsById.get(player.id) ?? [];

    players.push({
      sourceId: player.id,
      name: player.name,
      className,
      spec,
      role,
      throughput: Math.round(throughput),
      deaths: playerDeaths.length,
      deathDetails: playerDeaths,
      avoidableDamage: damageTakenById.get(player.id) ?? 0,
      activityPercent: Math.round(activityPercent * 10) / 10,
      consumables: detectConsumables(combatantInfo),
      missingEnchants: countMissingEnchants(combatantInfo),
      avgItemLevel: computeAvgItemLevel(combatantInfo),
    });
  }

  // Sort: role order, then throughput descending within each role
  players.sort((a, b) => {
    const roleDiff = ROLE_SORT_ORDER[a.role] - ROLE_SORT_ORDER[b.role];
    if (roleDiff !== 0) return roleDiff;
    return b.throughput - a.throughput;
  });

  return {
    encounterName,
    fightDuration,
    players,
    deathTimeline,
  };
}
