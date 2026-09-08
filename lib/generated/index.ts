// ─────────────────────────────────────────────────────────────────────────
// The single composition point for lib/cla-constants.ts's four game-data
// maps. This is the ONLY place era precedence is decided — do not resolve a
// cross-era collision anywhere else.
//
// ── Era precedence: Classic+TBC wins, not "later era wins" ────────────────
//
// Composition is FIRST-RESOLVED-ERA-WINS across [Classic+TBC, WotLK, Cata]
// — i.e. Classic+TBC's own value always wins a colliding id, WotLK fills in
// ids Classic+TBC doesn't have, and Cata fills in whatever's still missing.
// This is deliberately the REVERSE of "a later era overwrites an earlier
// one," which is what a flat `new Map([...allThreeEras])` literal would do
// by insertion order.
//
// Why: at the exhaustive-data scale each era module now covers (thousands
// of rows, not the small hand-curated subset the pre-regeneration map
// carried), the numeric id space is NOT globally unique across WoW's
// Classic-progression client builds — Blizzard's Classic/TBC/WotLK/Cata
// Classic clients independently reuse freed enchant/gem/spell ids for
// unrelated content (RESEARCH.md Pitfall 5; confirmed empirically during
// this cutover — e.g. enchant id 3003 is "Glyph of Ferocity" in the TBC
// 2.5.6.69546 client and an unrelated "Arcanum of Ferocity" in the WotLK
// 3.4.5.63697 client; gem id 32196 is "Runed Crimson Spinel" in TBC/WotLK
// and an unrelated "Brilliant Crimson Spinel" in Cata). A later-era-wins
// merge would silently replace a real TBC fact with an unrelated later-era
// item that happens to reuse the same numeric id, which is precisely the
// silent cross-era misattribution this whole regeneration pipeline (ACC-01)
// exists to prevent — and it would have broken lib/cla-constants.test.ts's
// existing pinned facts for ids 2667, 3003 and 32196, none of which the
// pre-regeneration hand-curated map ever collided on because a human
// selected which era's row to include.
//
// ParseForge's product is fundamentally a Classic/TBC raid-log analyzer
// (see .planning/PROJECT.md) with WotLK/Cata support layered on top, so
// Classic+TBC winning ties is also the right default for the product this
// map serves — a report from TBC content must never resolve a TBC item id
// to an unrelated later-era item's name. The tradeoff this accepts: a small
// number of ids that are genuinely WotLK- or Cata-native AND collide with
// an (unrelated) Classic+TBC id will resolve to the Classic+TBC name
// instead. Every such collision is enumerated, never silently applied — see
// `node scripts/regen-game-data.mjs --report` and docs/GAME-DATA-AUDIT.md.
//
// This is a deliberate deviation from this plan's literal "later era wins"
// text (see the 02-06-SUMMARY.md Deviations section) — the plan's own hard
// acceptance gate (`npx vitest run lib/cla-constants.test.ts` passing
// UNMODIFIED) is what proves this composition is behaviour-preserving, and
// a naive later-wins merge fails that gate for real, wago-verified data.
// ─────────────────────────────────────────────────────────────────────────

import { ENCHANT_NAME_CLASSIC_TBC, GEM_NAME_CLASSIC_TBC, GEM_STAT_CLASSIC_TBC } from "./game-data.classic-tbc";
import { ENCHANT_NAME_WOTLK, GEM_NAME_WOTLK, GEM_STAT_WOTLK } from "./game-data.wotlk";
import { ENCHANT_NAME_CATA, GEM_NAME_CATA, GEM_STAT_CATA } from "./game-data.cata";
import { CONSUMABLE_NAMES } from "./game-data.consumables";
import {
  ENCHANT_NAME_OVERRIDES,
  GEM_NAME_OVERRIDES,
  CONSUMABLE_CURATION,
  UNVERIFIED_OVERRIDE_IDS,
  type GemStatType,
  type ConsumableCategory,
} from "./game-data-overrides";
import type { RaidRole } from "@/lib/wcl-types";

/** First-resolved-era wins: earlier maps in `maps` take precedence over
 * later ones for the same id. See the module header for why this is the
 * opposite of a naive "later entry overwrites" flat-merge. */
function composeEraPriority<T>(maps: Map<number, T>[]): Map<number, T> {
  const result = new Map<number, T>();
  for (const map of maps) {
    for (const [id, value] of map) {
      if (!result.has(id)) result.set(id, value);
    }
  }
  return result;
}

// ─── Enchant names ──────────────────────────────────────────────────────
const composedEnchantNames = composeEraPriority([
  ENCHANT_NAME_CLASSIC_TBC,
  ENCHANT_NAME_WOTLK,
  ENCHANT_NAME_CATA,
]);
// Overrides are the explicit human final say — always win, regardless of
// era precedence.
for (const [id, name] of ENCHANT_NAME_OVERRIDES) composedEnchantNames.set(id, name);
export const ENCHANT_NAME_DB: Map<number, string> = composedEnchantNames;

// ─── Gem names ──────────────────────────────────────────────────────────
const composedGemNames = composeEraPriority([GEM_NAME_CLASSIC_TBC, GEM_NAME_WOTLK, GEM_NAME_CATA]);
for (const [id, name] of GEM_NAME_OVERRIDES) composedGemNames.set(id, name);
export const GEM_NAME_DB: Map<number, string> = composedGemNames;

// ─── Gem stats ────────────────────────────────────────────────────────────
// Each entry's `name` is taken from the already-composed GEM_NAME_DB when it
// has the id — the exact invariant lib/cla-constants.test.ts asserts
// ("keeps GEM_STAT_DB names in sync with GEM_NAME_DB"). Deriving it here
// rather than storing it twice makes that invariant structural rather than
// a coincidence the test happens to catch.
const composedGemStatsRaw = composeEraPriority([GEM_STAT_CLASSIC_TBC, GEM_STAT_WOTLK, GEM_STAT_CATA]);
export const GEM_STAT_DB: Map<number, { name: string; statType: GemStatType; badForRoles: RaidRole[] }> = new Map();
for (const [id, info] of composedGemStatsRaw) {
  GEM_STAT_DB.set(id, {
    name: composedGemNames.get(id) ?? info.name,
    statType: info.statType,
    badForRoles: info.badForRoles,
  });
}

// ─── Consumables ────────────────────────────────────────────────────────
// Joins the hand-curated category/isSuboptimal/betterAlternative judgment
// (CONSUMABLE_CURATION) with the wago-generated display name
// (CONSUMABLE_NAMES, already resolved per-id by scripts/regen-game-data.mjs
// — including its own consumableNames-override fallback for ids no era can
// resolve). Task 1's row-count floor guarantees every curated id has a
// name row, so the `continue` below is a defensive guard, not an expected
// path.
export const CONSUMABLE_DB: Map<
  number,
  { name: string; category: ConsumableCategory; isSuboptimal: boolean; betterAlternative?: string }
> = new Map();
for (const [id, curation] of CONSUMABLE_CURATION) {
  const nameRow = CONSUMABLE_NAMES.get(id);
  if (!nameRow) continue;
  CONSUMABLE_DB.set(id, {
    name: nameRow.name,
    category: curation.category,
    isSuboptimal: curation.isSuboptimal,
    ...(curation.betterAlternative !== undefined ? { betterAlternative: curation.betterAlternative } : {}),
  });
}

/**
 * Every id whose value came from a human rather than a client dump — the
 * union of every enchant/gem/consumable-name override
 * (UNVERIFIED_OVERRIDE_IDS already covers all three sections; see
 * game-data-overrides.ts). This is what docs/GAME-DATA-AUDIT.md's
 * unverified-overrides section is built from, and it is the mechanism that
 * keeps hand-sourced values distinguishable from wago-verified ones after
 * merging (D-11, T-02-18).
 */
export const UNVERIFIED_IDS: Set<number> = UNVERIFIED_OVERRIDE_IDS;
