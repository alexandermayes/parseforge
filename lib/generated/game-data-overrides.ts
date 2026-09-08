// ─────────────────────────────────────────────────────────────────────────
// Typed accessor over lib/generated/game-data-overrides.json — the single
// hand-authored game-data file (D-11). Every value here came from a human,
// not a client dump; every entry in the JSON carries a non-empty `source`
// note explaining why it could not be derived (enforced at generation time
// by scripts/regen-game-data.mjs's fatal startup check).
//
// This module declares no game data of its own — it is a pure projection of
// the JSON, so there is exactly one place to edit an override.
// ─────────────────────────────────────────────────────────────────────────

import type { RaidRole } from "@/lib/wcl-types";
import overridesJson from "./game-data-overrides.json";

/**
 * Stat category a gem's enchantment resolves to, classified from its raw
 * stat text by scripts/regen-game-data.mjs's table-driven classifier.
 * "neutral" covers unclassifiable text (resistances, spell penetration,
 * mp5, meta-gem proc effects — none of which map onto a single stat).
 */
export type GemStatType =
  | "spell_hit"
  | "melee_hit"
  | "spell_power"
  | "attack_power"
  | "strength"
  | "agility"
  | "intellect"
  | "spirit"
  | "defense"
  | "dodge"
  | "parry"
  | "stamina"
  | "haste"
  | "crit"
  | "hit"
  | "expertise"
  | "armor_penetration"
  | "neutral";

/** Generated-module shape for a single gem row. Mirrors lib/cla-constants.ts's
 * GemInfo — kept as a locally-owned type here so this plan's generated files
 * do not import from cla-constants.ts (which will import FROM lib/generated/
 * once plan 02-06 cuts it over, and a two-way import would be circular). */
export interface GeneratedGemInfo {
  name: string;
  statType: GemStatType;
  badForRoles: RaidRole[];
}

interface OverrideEntry {
  value: string;
  source: string;
}

interface OverridesJsonShape {
  statTypeBadForRoles: Record<GemStatType, RaidRole[]>;
  enchantNames: Record<string, OverrideEntry>;
  gemNames: Record<string, OverrideEntry>;
}

const overrides = overridesJson as unknown as OverridesJsonShape;

/** Which raid roles a given GemStatType is a poor choice for (e.g. spell
 * power is bad for a Physical dps/tank). Keyed on the stat category, not
 * per-id — today's data is already policy-consistent (D-09 action text). */
export const STAT_TYPE_BAD_FOR_ROLES: Record<GemStatType, RaidRole[]> = overrides.statTypeBadForRoles;

/** Hand-authored enchant-name overrides, keyed by SpellItemEnchantment id. */
export const ENCHANT_NAME_OVERRIDES: Map<number, string> = new Map(
  Object.entries(overrides.enchantNames).map(([id, entry]) => [Number(id), entry.value]),
);

/** Hand-authored gem-name overrides, keyed by item id. */
export const GEM_NAME_OVERRIDES: Map<number, string> = new Map(
  Object.entries(overrides.gemNames).map(([id, entry]) => [Number(id), entry.value]),
);

/**
 * Every id present in either override section — the registry of every value
 * that came from a human rather than a client dump. No id in this set may
 * appear inside a generated era module (scripts/regen-game-data.mjs excludes
 * these ids when deriving; lib/generated/game-data.test.ts asserts it).
 */
export const UNVERIFIED_OVERRIDE_IDS: Set<number> = new Set([
  ...Object.keys(overrides.enchantNames).map(Number),
  ...Object.keys(overrides.gemNames).map(Number),
]);
