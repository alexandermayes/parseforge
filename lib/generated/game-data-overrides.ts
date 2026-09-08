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

/**
 * A consumable's category, as curated by a human — no client dump carries
 * this classification. Locally declared (mirrors GemStatType/GeneratedGemInfo
 * above) rather than imported from lib/cla-constants.ts, which imports FROM
 * this module post-cutover — a two-way import would be circular.
 */
export type ConsumableCategory =
  | "flask"
  | "battle_elixir"
  | "guardian_elixir"
  | "food"
  | "weapon_enhancement"
  | "scroll";

interface OverrideEntry {
  value: string;
  source: string;
}

interface ConsumableCurationEntry {
  category: ConsumableCategory;
  isSuboptimal: boolean;
  betterAlternative?: string;
  source: string;
}

interface OverridesJsonShape {
  statTypeBadForRoles: Record<GemStatType, RaidRole[]>;
  enchantNames: Record<string, OverrideEntry>;
  gemNames: Record<string, OverrideEntry>;
  consumables: Record<string, ConsumableCurationEntry>;
  consumableNames: Record<string, OverrideEntry>;
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
 * Hand-authored consumable curation — category, suboptimality and
 * better-alternative judgment, keyed by consumable spell id. These are
 * product judgments no client dump contains (D-11); the display `name` is
 * NOT here — it is generated per-era from SpellName.Name_lang and joined in
 * by lib/generated/index.ts.
 */
export const CONSUMABLE_CURATION: Map<
  number,
  { category: ConsumableCategory; isSuboptimal: boolean; betterAlternative?: string }
> = new Map(
  Object.entries(overrides.consumables).map(([id, entry]) => [
    Number(id),
    {
      category: entry.category,
      isSuboptimal: entry.isSuboptimal,
      ...(entry.betterAlternative !== undefined ? { betterAlternative: entry.betterAlternative } : {}),
    },
  ]),
);

/** Hand-authored consumable-name overrides, keyed by consumable spell id —
 * used only when no era's client data resolves a name for a curated id. */
export const CONSUMABLE_NAME_OVERRIDES: Map<number, string> = new Map(
  Object.entries(overrides.consumableNames).map(([id, entry]) => [Number(id), entry.value]),
);

/**
 * Every id present in any override section — the registry of every value
 * that came from a human rather than a client dump. No id in this set may
 * appear inside a generated era module (scripts/regen-game-data.mjs excludes
 * these ids when deriving; lib/generated/game-data.test.ts asserts it).
 * CONSUMABLE_CURATION ids are deliberately excluded here — curation (category/
 * isSuboptimal/betterAlternative) is ALWAYS human-authored by design, not a
 * fallback for missing client data, so including all 178 would misrepresent
 * every consumable as "unverified" in the audit doc. Only consumableNames ids
 * (a name that could not be derived) belong in this registry.
 */
export const UNVERIFIED_OVERRIDE_IDS: Set<number> = new Set([
  ...Object.keys(overrides.enchantNames).map(Number),
  ...Object.keys(overrides.gemNames).map(Number),
  ...Object.keys(overrides.consumableNames).map(Number),
]);
