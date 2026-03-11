import type {
  CLAResult,
  CLAPlayerResult,
  CLAPlayerFightData,
  CLAConsumableRow,
  CLAConsumableDetail,
  CLAGearIssue,
  CLAGearSlot,
  CLAFightMeta,
} from "./cla-types";
import type { WCLPlayerDetails, WCLCombatantInfoEvent, WCLBuffEntry } from "./wcl-types";
import {
  classifyRole,
  GEAR_SLOTS,
  ENCHANTABLE_SLOTS,
  FLASK_BUFF_IDS,
  FOOD_BUFF_IDS,
  WEAPON_ENHANCEMENT_IDS,
} from "./constants";
import {
  CONSUMABLE_DB,
  BATTLE_ELIXIR_IDS,
  GUARDIAN_ELIXIR_IDS,
  SCROLL_BUFF_IDS,
} from "./cla-constants";

// ─── Input types ────────────────────────────────────────────────────

export interface CLAEngineInput {
  playerDetails: WCLPlayerDetails[];
  fights: CLAFightMeta[];
  /** buffData[fightId][sourceId] = WCLBuffEntry[] */
  buffData: Record<number, Record<number, WCLBuffEntry[]>>;
  /** combatantData[fightId] = WCLCombatantInfoEvent[] */
  combatantData: Record<number, WCLCombatantInfoEvent[]>;
  wowheadDomain: string;
}

// ─── Empty consumable detail ────────────────────────────────────────

function emptyDetail(): CLAConsumableDetail {
  return {
    present: false,
    uptimePercent: 0,
    spellId: 0,
    spellName: "",
    isSuboptimal: false,
    suboptimalReason: "",
  };
}

// ─── Consumable analysis ────────────────────────────────────────────

function findBestBuff(
  buffs: WCLBuffEntry[],
  idSet: Set<number>,
  fightDuration: number,
): CLAConsumableDetail {
  let best: CLAConsumableDetail | null = null;
  let bestUptime = -1;

  for (const buff of buffs) {
    if (!idSet.has(buff.guid)) continue;
    const uptimePct = fightDuration > 0
      ? Math.min(100, (buff.totalUptime / fightDuration) * 100)
      : 0;

    if (uptimePct > bestUptime) {
      bestUptime = uptimePct;
      const info = CONSUMABLE_DB.get(buff.guid);
      best = {
        present: true,
        uptimePercent: Math.round(uptimePct * 10) / 10,
        spellId: buff.guid,
        spellName: info?.name ?? buff.name,
        isSuboptimal: info?.isSuboptimal ?? false,
        suboptimalReason: info?.betterAlternative
          ? `Use ${info.betterAlternative} instead`
          : "",
      };
    }
  }

  return best ?? emptyDetail();
}

function findScrolls(
  buffs: WCLBuffEntry[],
  fightDuration: number,
): CLAConsumableDetail[] {
  const scrolls: CLAConsumableDetail[] = [];

  for (const buff of buffs) {
    if (!SCROLL_BUFF_IDS.has(buff.guid)) continue;
    const uptimePct = fightDuration > 0
      ? Math.min(100, (buff.totalUptime / fightDuration) * 100)
      : 0;
    const info = CONSUMABLE_DB.get(buff.guid);
    scrolls.push({
      present: true,
      uptimePercent: Math.round(uptimePct * 10) / 10,
      spellId: buff.guid,
      spellName: info?.name ?? buff.name,
      isSuboptimal: info?.isSuboptimal ?? false,
      suboptimalReason: info?.betterAlternative
        ? `Use ${info.betterAlternative} instead`
        : "",
    });
  }

  return scrolls;
}

export function analyzeConsumables(
  buffs: WCLBuffEntry[],
  fightDuration: number,
  gear?: WCLCombatantInfoEvent["gear"],
  wowheadDomain: string = "tbc",
): CLAConsumableRow {
  const flask = findBestBuff(buffs, FLASK_BUFF_IDS, fightDuration);
  const battleElixir = findBestBuff(buffs, BATTLE_ELIXIR_IDS, fightDuration);
  const guardianElixir = findBestBuff(buffs, GUARDIAN_ELIXIR_IDS, fightDuration);
  const food = findBestBuff(buffs, FOOD_BUFF_IDS, fightDuration);

  // MoP+ doesn't have temporary weapon enhancements (oils/stones were removed)
  const hasTemporaryEnhancements = wowheadDomain !== "mists";
  let weaponEnhancement = hasTemporaryEnhancements
    ? findBestBuff(buffs, WEAPON_ENHANCEMENT_IDS, fightDuration)
    : emptyDetail();

  // Weapon oils/stones are temporary item enchants, not buff auras — they often
  // don't appear in the Buffs table. Fall back to checking gear temporaryEnchant.
  if (hasTemporaryEnhancements && !weaponEnhancement.present && gear) {
    const hasTemp = gear.some(
      (g, i) => (i === 15 || i === 16) && g && g.temporaryEnchant
    );
    if (hasTemp) {
      weaponEnhancement = {
        present: true,
        uptimePercent: 100,
        spellId: 0,
        spellName: "Weapon Enhancement (detected on gear)",
        isSuboptimal: false,
        suboptimalReason: "",
      };
    }
  }
  const scrolls = findScrolls(buffs, fightDuration);

  // Average uptime across the main consumable categories that are present
  // MoP+ only has flask+food (2 categories), no weapon enhancements
  const categories = hasTemporaryEnhancements
    ? [flask, food, weaponEnhancement]
    : [flask, food];
  // If no flask, use battle+guardian elixirs instead
  if (!flask.present) {
    categories[0] = battleElixir;
    categories.push(guardianElixir);
  }
  const presentCategories = categories.filter((c) => c.present);
  const totalCategories = flask.present
    ? (hasTemporaryEnhancements ? 3 : 2)
    : (hasTemporaryEnhancements ? 4 : 3); // +battle+guardian instead of flask
  const sumUptime = presentCategories.reduce((s, c) => s + c.uptimePercent, 0);
  const averageUptime = totalCategories > 0
    ? Math.round((sumUptime / totalCategories) * 10) / 10
    : 0;

  return {
    flask,
    battleElixir,
    guardianElixir,
    food,
    weaponEnhancement,
    scrolls,
    averageUptime,
  };
}

// ─── Detail gear lookup ─────────────────────────────────────────────

function buildDetailGearMap(
  detailsGear?: import("./wcl-types").WCLGearItem[],
): Map<number, import("./wcl-types").WCLGearItem> {
  const map = new Map<number, import("./wcl-types").WCLGearItem>();
  if (!detailsGear) return map;
  for (const item of detailsGear) {
    if (item && item.id > 0) map.set(item.id, item);
  }
  return map;
}

// ─── Gear issue detection ───────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };

export function analyzeGearIssues(
  combatantInfo: WCLCombatantInfoEvent | undefined,
  detailsGear?: import("./wcl-types").WCLGearItem[],
  wowheadDomain: string = "tbc",
): CLAGearIssue[] {
  if (!combatantInfo?.gear) return [];

  const issues: CLAGearIssue[] = [];
  const detailMap = buildDetailGearMap(detailsGear);

  // Compute average ilvl for low-ilvl detection
  const ilvls: number[] = [];
  for (const [index, item] of combatantInfo.gear.entries()) {
    if (index === 3 || index === 18) continue; // skip shirt & tabard
    if (!item || item.id === 0) continue;
    if (item.itemLevel && item.itemLevel > 0) ilvls.push(item.itemLevel);
  }
  const avgIlvl = ilvls.length > 0
    ? ilvls.reduce((a, b) => a + b, 0) / ilvls.length
    : 0;

  for (const [index, item] of combatantInfo.gear.entries()) {
    if (index === 3 || index === 18) continue; // skip shirt & tabard
    if (!item || item.id === 0) continue;

    const slotName = GEAR_SLOTS[index] ?? `Slot ${index}`;
    const detailItem = detailMap.get(item.id);
    const itemName = detailItem?.name ?? `Item #${item.id}`;

    // Missing enchant on enchantable slot
    if (ENCHANTABLE_SLOTS.has(index) && !item.permanentEnchant) {
      issues.push({
        slotIndex: index,
        slotName,
        itemId: item.id,
        itemName,
        issueType: "missing_enchant",
        severity: "error",
        description: `Missing enchant on ${slotName}`,
      });
    }

    // Check for empty gem sockets (gems array exists but has id=0 entries)
    if (item.gems && item.gems.length > 0) {
      const emptyGems = item.gems.filter((g) => g.id === 0);
      if (emptyGems.length > 0) {
        issues.push({
          slotIndex: index,
          slotName,
          itemId: item.id,
          itemName,
          issueType: "empty_socket",
          severity: "warning",
          description: `${emptyGems.length} empty gem socket(s) on ${slotName}`,
        });
      }
    }

    // Missing weapon oil/stone on Main Hand (slot 15)
    // MoP+ doesn't have temporary weapon enhancements (oils/stones were removed)
    const hasTemporaryEnhancements = wowheadDomain !== "mists";
    if (hasTemporaryEnhancements && index === 15 && !item.temporaryEnchant) {
      issues.push({
        slotIndex: index,
        slotName,
        itemId: item.id,
        itemName,
        issueType: "missing_weapon_enhancement",
        severity: "info",
        description: "No temporary weapon enhancement",
      });
    }

    // Low item level — 15+ ilvls below player's average
    const ilvl = item.itemLevel ?? 0;
    if (avgIlvl > 0 && ilvl > 0 && avgIlvl - ilvl >= 15) {
      issues.push({
        slotIndex: index,
        slotName,
        itemId: item.id,
        itemName,
        issueType: "low_ilvl",
        severity: "info",
        description: `Item level ${ilvl} is ${Math.round(avgIlvl - ilvl)} below average (${Math.round(avgIlvl)})`,
      });
    }
  }

  // Sort by severity: error → warning → info
  issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return issues;
}

// ─── Gear snapshot ──────────────────────────────────────────────────

export function buildGearSnapshot(
  combatantInfo: WCLCombatantInfoEvent | undefined,
  wowheadDomain: string,
  detailsGear?: import("./wcl-types").WCLGearItem[],
): CLAGearSlot[] {
  if (!combatantInfo?.gear) return [];

  const slots: CLAGearSlot[] = [];
  const detailMap = buildDetailGearMap(detailsGear);

  for (const [index, item] of combatantInfo.gear.entries()) {
    if (index === 3) continue; // skip shirt
    const slotName = GEAR_SLOTS[index] ?? `Slot ${index}`;

    if (!item || item.id === 0) {
      slots.push({
        slotIndex: index,
        slotName,
        itemId: 0,
        itemName: "Empty",
        itemLevel: 0,
        enchantId: 0,
        enchantName: "",
        gems: [],
        wowheadUrl: "",
      });
      continue;
    }

    const detailItem = detailMap.get(item.id);
    // Merge gem info: use detail gems (which may have names) when available
    const detailGems = detailItem?.gems;
    const eventGems = item.gems?.filter((g) => g.id !== 0) ?? [];

    slots.push({
      slotIndex: index,
      slotName,
      itemId: item.id,
      itemName: detailItem?.name ?? `Item #${item.id}`,
      itemLevel: item.itemLevel ?? 0,
      enchantId: item.permanentEnchant ?? 0,
      enchantName: detailItem?.permanentEnchantName ?? "",
      gems: eventGems.map((g) => {
        const dg = detailGems?.find((d) => d.id === g.id);
        return { id: g.id, itemLevel: dg?.itemLevel ?? g.itemLevel };
      }),
      wowheadUrl: `https://www.wowhead.com/${wowheadDomain}/item=${item.id}`,
    });
  }

  return slots;
}

// ─── Main orchestrator ──────────────────────────────────────────────

export function buildCLAResult(input: CLAEngineInput): CLAResult {
  const { playerDetails, fights, buffData, combatantData, wowheadDomain } = input;

  const players: CLAPlayerResult[] = [];

  for (const player of playerDetails) {
    const className = player.type;
    const rawSpec = player.specs?.[0];
    const spec =
      typeof rawSpec === "object" && rawSpec !== null && "spec" in rawSpec
        ? (rawSpec as unknown as { spec: string }).spec
        : typeof rawSpec === "string"
          ? rawSpec
          : player.icon?.split("-")[1] ?? "";

    const role = classifyRole(className, spec, player.icon);

    // Gear analysis from first available fight's combatant info
    let playerCombatantInfo: WCLCombatantInfoEvent | undefined;
    for (const fight of fights) {
      const events = combatantData[fight.id] ?? [];
      playerCombatantInfo = events.find((e) => e.sourceID === player.id);
      if (playerCombatantInfo) break;
    }

    // Per-fight consumable data
    const fightDataArr: CLAPlayerFightData[] = [];
    for (const fight of fights) {
      const playerBuffs = buffData[fight.id]?.[player.id] ?? [];
      const consumables = analyzeConsumables(playerBuffs, fight.duration, playerCombatantInfo?.gear, wowheadDomain);
      fightDataArr.push({ fightId: fight.id, consumables });
    }

    const detailsGear = player.combatantInfo?.gear;
    const gearIssues = analyzeGearIssues(playerCombatantInfo, detailsGear, wowheadDomain);
    const gearSnapshot = buildGearSnapshot(playerCombatantInfo, wowheadDomain, detailsGear);

    players.push({
      sourceId: player.id,
      name: player.name,
      className,
      spec,
      role,
      fightData: fightDataArr,
      gearIssues,
      gearSnapshot,
    });
  }

  return { fights, players, wowheadDomain };
}
