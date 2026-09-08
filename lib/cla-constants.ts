// ─── CLA Game-Data Maps ──────────────────────────────────────────────────
// The four id -> name/stat maps below (ENCHANT_NAME_DB, GEM_NAME_DB,
// GEM_STAT_DB, CONSUMABLE_DB) are composed from wago.tools-generated era
// data plus one source-noted overrides file — see lib/generated/index.ts,
// the single place era precedence is decided, and docs/GAME-DATA-AUDIT.md,
// the standing review artifact for every regeneration run
// (`npm run regen-game-data`). No hand-typed id maps live in this file
// (ACC-01, D-09) — everything below this comment is either a type
// declaration, a derived value computed FROM the composed maps, or an
// app-level definition (class buffs, talent-point expectations) that no
// client dump could ever supply.

import type { RaidRole } from "./wcl-types";
import {
  ENCHANT_NAME_DB as GENERATED_ENCHANT_NAME_DB,
  GEM_NAME_DB as GENERATED_GEM_NAME_DB,
  GEM_STAT_DB as GENERATED_GEM_STAT_DB,
  CONSUMABLE_DB as GENERATED_CONSUMABLE_DB,
} from "./generated";

// ─── CLA Consumable Database ────────────────────────────────────────
// Master lookup: spell ID → name, category, suboptimality metadata.
// name: generated per-era from wago.tools SpellName data (scripts/regen-game-data.mjs).
// category / isSuboptimal / betterAlternative: hand-curated product judgment,
// living in lib/generated/game-data-overrides.json's `consumables` key —
// no client dump carries these (D-11).

export type ConsumableCategory =
  | "flask"
  | "battle_elixir"
  | "guardian_elixir"
  | "food"
  | "weapon_enhancement"
  | "scroll";

export interface ConsumableInfo {
  name: string;
  category: ConsumableCategory;
  isSuboptimal: boolean;
  betterAlternative?: string;
}

export const CONSUMABLE_DB: Map<number, ConsumableInfo> = GENERATED_CONSUMABLE_DB;

// ─── Categorized ID sets ────────────────────────────────────────────

export const BATTLE_ELIXIR_IDS = new Set<number>();
export const GUARDIAN_ELIXIR_IDS = new Set<number>();
export const SCROLL_BUFF_IDS = new Set<number>();

// Build categorized sets from the master DB
for (const [id, info] of CONSUMABLE_DB) {
  if (info.category === "battle_elixir") BATTLE_ELIXIR_IDS.add(id);
  if (info.category === "guardian_elixir") GUARDIAN_ELIXIR_IDS.add(id);
  if (info.category === "scroll") SCROLL_BUFF_IDS.add(id);
}

/** Combined set of all consumable spell IDs for GraphQL filtering */
export function getAllConsumableAbilityIds(): number[] {
  return Array.from(CONSUMABLE_DB.keys());
}

// ─── Enchant Name Database ───────────────────────────────────────────
// Maps WCL permanentEnchant IDs (SpellItemEnchantment IDs) to display names.
// Generated per-era from wago.tools client data and composed by
// lib/generated/index.ts — see that file for era precedence and
// docs/GAME-DATA-AUDIT.md for the resolved builds and row counts behind
// this run.

export const ENCHANT_NAME_DB: Map<number, string> = GENERATED_ENCHANT_NAME_DB;

// ─── Gem Name Database ──────────────────────────────────────────────
// Maps gem item IDs to display names (supplements GEM_STAT_DB for display).
// Generated per-era from wago.tools client ItemSparse data and composed by
// lib/generated/index.ts — see that file for era precedence and
// docs/GAME-DATA-AUDIT.md for the resolved builds and row counts behind
// this run.

export const GEM_NAME_DB: Map<number, string> = GENERATED_GEM_NAME_DB;

// ─── Class Buff Definitions ──────────────────────────────────────────
// Not game data — a hand-authored raid-audit policy (which buffs matter,
// which roles expect them) with no wago.tools equivalent.

export interface ClassBuffFamily {
  name: string;
  spellIds: Set<number>;
  expectedRoles: RaidRole[];
  isWarningFor?: RaidRole[];
  warningReason?: string;
  /** Which wowhead domains (expansions) this buff family applies to */
  expansions?: string[];
}

export const CLASS_BUFF_FAMILIES: ClassBuffFamily[] = [
  // ── Paladin Blessings ──
  {
    name: "Blessing of Might",
    spellIds: new Set([
      // BoM ranks 1-10
      19740, 19834, 19835, 19836, 19837, 19838, 25291, 27140, 48931, 48932,
      // Greater BoM ranks 1-4
      25782, 25916, 27141, 48933, 48934,
    ]),
    expectedRoles: ["Physical", "Tank"],
  },
  {
    name: "Blessing of Wisdom",
    spellIds: new Set([
      // BoW ranks 1-9
      19742, 19850, 19852, 19853, 19854, 25290, 27142, 48935, 48936,
      // Greater BoW ranks 1-4
      25894, 25918, 27143, 48937, 48938,
    ]),
    expectedRoles: ["Caster", "Healer"],
  },
  {
    name: "Blessing of Kings",
    spellIds: new Set([20217, 25898]),
    expectedRoles: ["Tank", "Healer", "Caster", "Physical"],
  },
  {
    name: "Blessing of Salvation",
    spellIds: new Set([1038, 25895]),
    expectedRoles: [],
    isWarningFor: ["Tank"],
    warningReason: "Salvation on Tank reduces threat",
    expansions: ["classic", "tbc"],
  },
  // ── Priest Buffs ──
  {
    name: "Power Word: Fortitude",
    spellIds: new Set([
      // Fort ranks 1-8
      1243, 1244, 1245, 2791, 10937, 10938, 25389, 48161,
      // Prayer of Fortitude ranks 1-4
      21562, 21564, 25392, 48162,
    ]),
    expectedRoles: ["Tank", "Healer", "Caster", "Physical"],
  },
  {
    name: "Divine Spirit",
    spellIds: new Set([
      // DS ranks 1-5
      14752, 14818, 14819, 27841, 25312,
      // Prayer of Spirit ranks 1-3
      27681, 32999, 48073, 48074,
    ]),
    expectedRoles: ["Caster", "Healer"],
    expansions: ["classic", "tbc", "wrath"],
  },
  {
    name: "Shadow Protection",
    spellIds: new Set([
      // Shadow Protection ranks 1-5
      976, 10957, 10958, 25433, 48169,
      // Prayer of Shadow Protection ranks 1-3
      27683, 39374, 48170,
    ]),
    expectedRoles: ["Tank", "Healer", "Caster", "Physical"],
  },
  // ── Druid Buffs ──
  {
    name: "Mark of the Wild",
    spellIds: new Set([
      // MotW ranks 1-9
      1126, 5232, 6756, 5234, 8907, 9884, 9885, 26990, 48469,
      // Gift of the Wild ranks 1-4
      21849, 21850, 26991, 48470,
    ]),
    expectedRoles: ["Tank", "Healer", "Caster", "Physical"],
  },
  // ── Mage Buffs ──
  {
    name: "Arcane Intellect",
    spellIds: new Set([
      // AI ranks 1-7
      1459, 1460, 1461, 10156, 10157, 27126, 42995,
      // Arcane Brilliance ranks 1-3
      23028, 27127, 43002,
    ]),
    expectedRoles: ["Caster", "Healer"],
  },
  // ── Warrior Shouts ──
  {
    name: "Battle Shout",
    spellIds: new Set([
      // Ranks 1-9
      6673, 5242, 6192, 11549, 11550, 11551, 25289, 2048, 47436,
    ]),
    expectedRoles: ["Physical", "Tank"],
  },
  {
    name: "Commanding Shout",
    spellIds: new Set([
      // Ranks 1-4
      469, 47439, 47440, 25203,
    ]),
    expectedRoles: ["Tank"],
  },
];

// ─── Gem Stat Database ───────────────────────────────────────────────
// Stat types derived from each gem's enchantment text in client data
// (ItemSparse -> GemProperties -> SpellItemEnchantment). Generated per-era
// and composed by lib/generated/index.ts — see that file for era
// precedence and docs/GAME-DATA-AUDIT.md for the resolved builds behind
// this run.

export type GemStatType =
  | "spell_hit" | "melee_hit" | "spell_power" | "attack_power"
  | "strength" | "agility" | "intellect" | "spirit" | "defense"
  | "dodge" | "parry" | "stamina" | "haste" | "crit" | "hit"
  | "expertise" | "armor_penetration" | "neutral";

export interface GemInfo {
  name: string;
  statType: GemStatType;
  badForRoles: RaidRole[];
}

export const GEM_STAT_DB: Map<number, GemInfo> = GENERATED_GEM_STAT_DB;

// ─── Talent Point Expectations ───────────────────────────────────────
// Not game data — the number of talent points a fully-leveled character has
// available to spend per expansion. No client dump carries this as a
// discrete "expected total"; it's derived from each expansion's max level
// and talent-point-per-level rate.

export const EXPECTED_TALENT_POINTS: Record<string, number> = {
  classic: 51,
  tbc: 61,
  wrath: 71,
  cata: 41,
  mists: 6,
};
