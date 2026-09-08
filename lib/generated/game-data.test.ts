import { describe, it, expect } from "vitest";
import { ENCHANT_NAME_CLASSIC_TBC, GEM_NAME_CLASSIC_TBC, GEM_STAT_CLASSIC_TBC } from "./game-data.classic-tbc";
import { ENCHANT_NAME_WOTLK, GEM_NAME_WOTLK, GEM_STAT_WOTLK } from "./game-data.wotlk";
import { ENCHANT_NAME_CATA, GEM_NAME_CATA, GEM_STAT_CATA } from "./game-data.cata";
import { ENCHANT_NAME_OVERRIDES, GEM_NAME_OVERRIDES, UNVERIFIED_OVERRIDE_IDS } from "./game-data-overrides";

// Proves the wago.tools-generated data (scripts/regen-game-data.mjs) reproduces
// every ID-to-name pair lib/cla-constants.test.ts pins against the
// pre-regeneration hand-authored maps — the regression guard the 02-06
// cutover depends on. Composition here is a small LOCAL helper (not imported
// from the app) because the shared composition module is plan 02-06's
// artifact; this test's only job is to prove the generated data is correct
// before anything depends on it.

/**
 * Composes era maps in the same order lib/cla-constants.ts's sections list
 * today — Classic and TBC, then WotLK, then Cata — so a later era wins for a
 * colliding id, matching current behaviour.
 */
function composeEras<T>(maps: Map<number, T>[]): Map<number, T> {
  const result = new Map<number, T>();
  for (const map of maps) {
    for (const [id, value] of map) result.set(id, value);
  }
  return result;
}

const composedEnchantNames = composeEras([ENCHANT_NAME_CLASSIC_TBC, ENCHANT_NAME_WOTLK, ENCHANT_NAME_CATA]);
for (const [id, name] of ENCHANT_NAME_OVERRIDES) composedEnchantNames.set(id, name);

const composedGemNames = composeEras([GEM_NAME_CLASSIC_TBC, GEM_NAME_WOTLK, GEM_NAME_CATA]);
for (const [id, name] of GEM_NAME_OVERRIDES) composedGemNames.set(id, name);

const composedGemStats = composeEras([GEM_STAT_CLASSIC_TBC, GEM_STAT_WOTLK, GEM_STAT_CATA]);

// Tests 1-6 below assert every pinned pair directly against the CLASSIC-TBC
// era module rather than the later-wins composed map. This is a deliberate
// deviation from composing every assertion (see Deviations in the SUMMARY):
// every id these tests check is a genuine TBC-era fact (the exact same facts
// lib/cla-constants.test.ts pins against the pre-regeneration hand-typed
// map). The exhaustive, non-curated generated data surfaces real cross-era
// ID reuse the curated subset never hit — e.g. enchant 3003 means "Glyph of
// Ferocity" in the 2.5.6.69546 TBC client and "Arcanum of Ferocity" in the
// 3.4.5.63697 WotLK client; gem 32196 is "Runed Crimson Spinel" in TBC/WotLK
// and "Brilliant Crimson Spinel" in Cata. A later-wins merge would silently
// clobber the TBC fact with an unrelated later-era item that happens to
// reuse the same numeric id — exactly the silent cross-era misattribution
// this phase exists to prevent (RESEARCH.md Pitfall 5). These collisions are
// real and correctly enumerated by `node scripts/regen-game-data.mjs
// --report` (see the SUMMARY's collision list) — the era modules themselves
// stay separately correct by construction; only a blind full-map merge would
// be wrong here, so this test asserts against the specific era each pinned
// fact belongs to. Tests 7-8 do exercise the composed map, where merge
// behaviour (not a specific era's historical fact) is exactly what's under
// test.
describe("generated game data reproduces the pinned ID-to-name pairs", () => {
  it("Test 1: resolves 2673 to Mongoose and 2667 to Savagery", () => {
    expect(ENCHANT_NAME_CLASSIC_TBC.get(2673)).toBe("Mongoose");
    expect(ENCHANT_NAME_CLASSIC_TBC.get(2667)).toBe("Savagery");
  });

  it("Test 2: resolves the two rows PR #11 had transposed (684, 2564)", () => {
    expect(ENCHANT_NAME_CLASSIC_TBC.get(684)).toContain("Major Strength");
    expect(ENCHANT_NAME_CLASSIC_TBC.get(2564)).toContain("Agility");
  });

  it("Test 3: resolves the leg armor / glyph enchant names", () => {
    expect(ENCHANT_NAME_CLASSIC_TBC.get(3003)).toContain("Glyph of Ferocity");
    expect(ENCHANT_NAME_CLASSIC_TBC.get(3012)).toContain("Nethercobra Leg Armor");
    expect(ENCHANT_NAME_CLASSIC_TBC.get(3013)).toContain("Nethercleft Leg Armor");
  });

  it("Test 4: resolves resilience/all-stats enchants with their exact pinned stat text", () => {
    expect(ENCHANT_NAME_CLASSIC_TBC.get(2933)).toContain("Resilience");
    expect(ENCHANT_NAME_CLASSIC_TBC.get(2661)).toContain("+6 All Stats");
  });

  it("Test 5: resolves the gem names, including the one that was wrong (32200)", () => {
    expect(GEM_NAME_CLASSIC_TBC.get(23097)).toBe("Delicate Blood Garnet");
    expect(GEM_NAME_CLASSIC_TBC.get(24027)).toBe("Bold Living Ruby");
    expect(GEM_NAME_CLASSIC_TBC.get(32196)).toBe("Runed Crimson Spinel");
    expect(GEM_NAME_CLASSIC_TBC.get(32200)).toBe("Solid Empyrean Sapphire");
  });

  it("Test 6: classifies gem 32196 as spell_power, bad for Physical, from the role policy", () => {
    expect(GEM_STAT_CLASSIC_TBC.get(32196)?.statType).toBe("spell_power");
    expect(GEM_STAT_CLASSIC_TBC.get(32196)?.badForRoles).toContain("Physical");
  });

  it("Test 7: every gem-stat id that also has a gem-name carries the identical name", () => {
    let checked = 0;
    for (const [id, info] of composedGemStats) {
      const name = composedGemNames.get(id);
      if (name) {
        expect(info.name).toBe(name);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("Test 8: no unverified-override id appears inside any generated era module", () => {
    const eraMaps = [
      ENCHANT_NAME_CLASSIC_TBC,
      ENCHANT_NAME_WOTLK,
      ENCHANT_NAME_CATA,
      GEM_NAME_CLASSIC_TBC,
      GEM_NAME_WOTLK,
      GEM_NAME_CATA,
      GEM_STAT_CLASSIC_TBC,
      GEM_STAT_WOTLK,
      GEM_STAT_CATA,
    ];
    for (const overrideId of UNVERIFIED_OVERRIDE_IDS) {
      for (const map of eraMaps) {
        expect(map.has(overrideId)).toBe(false);
      }
    }
    expect(UNVERIFIED_OVERRIDE_IDS.size).toBeGreaterThan(0);

    // The composed map (era modules + overrides merged on top) still
    // resolves every overridden id — via the override, not a generated row.
    for (const [id, value] of ENCHANT_NAME_OVERRIDES) {
      expect(composedEnchantNames.get(id)).toBe(value);
    }
  });
});
